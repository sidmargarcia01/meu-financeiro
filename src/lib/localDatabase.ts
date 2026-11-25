import 'server-only'
import { Pool, types } from 'pg'

// Keep date-only financial values independent of the machine's time zone.
types.setTypeParser(1082, (value: string) => value)
// Preserve the numeric API contract used by the existing financial services.
types.setTypeParser(1700, (value: string) => Number(value))
const state = globalThis as unknown as { financeiroPool?: Pool }
export function pool(): Pool {
  if (!state.financeiroPool) {
    if (!process.env.DATABASE_URL) throw new Error('Banco local não configurado')
    state.financeiroPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 12, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 })
  }
  return state.financeiroPool
}
export const identifier = (name: string) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error('Identificador inválido')
  return '"' + name + '"'
}
const tables = new Set(['accounts','categories','contacts','cost_centers','payment_methods','projects','tags','transactions','users','plans','user_settings','credit_cards','recurrences','investments','saved_collections','assets','portfolios','investment_transactions','transaction_tags','split_transactions','transfers'])
const relations: Record<string, Record<string, [string,string,string,boolean]>> = {
  transactions: { accounts:['accounts','account_id','id',false], categories:['categories','category_id','id',false], cost_centers:['cost_centers','center_id','id',false], projects:['projects','project_id','id',false], contacts:['contacts','contact_id','id',false] },
  accounts: { credit_cards:['credit_cards','id','account_id',true] },
  users: { plans:['plans','plan_id','id',false], user_settings:['user_settings','id','user_id',false] }
}
function splitProjection(value: string) {
  let depth=0,start=0;const result:string[]=[]
  for(let i=0;i<value.length;i++){if(value[i]==='(')depth++;if(value[i]===')')depth--;if(value[i]===','&&depth===0){result.push(value.slice(start,i).trim());start=i+1}}
  result.push(value.slice(start).trim());return result.filter(Boolean)
}
function projection(table:string, fields:string):string {
  return splitProjection(fields).map(part=>{
    if(part==='*')return 't.*'
    if(!part.includes('('))return 't.'+identifier(part)
    const match=part.match(/^(?:(\w+):)?(\w+)(?:!inner)?\(([^()]*)\)$/)
    if(!match)throw new Error('Projeção inválida')
    const [,alias,relation,cols]=match;const spec=relations[table]?.[relation]
    if(!spec)throw new Error('Relação inválida')
    const [target,local,foreign,many]=spec
    const columns=cols.trim()==='*'?'r.*':cols.split(',').map(c=>'r.'+identifier(c.trim())).join(',')
    if(many)return `(SELECT COALESCE(json_agg(related),'[]'::json) FROM (SELECT ${columns} FROM public.${identifier(target)} r WHERE r.${identifier(foreign)}=t.${identifier(local)}) related) AS ${identifier(alias||relation)}`
    return `(SELECT row_to_json(related) FROM (SELECT ${columns} FROM public.${identifier(target)} r WHERE r.${identifier(foreign)}=t.${identifier(local)} LIMIT 1) related) AS ${identifier(alias||relation)}`
  }).join(',')
}
export async function asUser<T>(userId:string, callback:(client:any)=>Promise<T>):Promise<T> {
  const client=await pool().connect()
  try { await client.query('BEGIN');await client.query("SELECT set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claim.role','authenticated',true)",[userId]);await client.query('SET LOCAL ROLE financeiro_app');const result=await callback(client);await client.query('COMMIT');return result }
  catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
}
export class LocalQuery implements PromiseLike<any> {
  private operation='select';private fields='*';private payload:any;private filters:Array<[string,string,any]>=[];private orders:Array<[string,boolean]>=[];private take?:number;private skip=0;private cardinality='many';private returning=false;private countMode=false;private head=false;private conflict='id'
  constructor(private table:string,private userId:string){if(!tables.has(table))throw new Error('Tabela inválida')}
  select(fields='*',opts:any={}){this.fields=fields;this.returning=true;this.countMode=!!opts.count;this.head=!!opts.head;return this}
  insert(value:any){this.operation='insert';this.payload=value;return this}
  update(value:any){this.operation='update';this.payload=value;return this}
  upsert(value:any,opts:any={}){this.operation='upsert';this.payload=value;this.conflict=opts.onConflict||'id';return this}
  delete(){this.operation='delete';return this}
  eq(k:string,v:any){this.filters.push([k,'=',v]);return this}
  neq(k:string,v:any){this.filters.push([k,'<>',v]);return this}
  gt(k:string,v:any){this.filters.push([k,'>',v]);return this}
  gte(k:string,v:any){this.filters.push([k,'>=',v]);return this}
  lt(k:string,v:any){this.filters.push([k,'<',v]);return this}
  lte(k:string,v:any){this.filters.push([k,'<=',v]);return this}
  ilike(k:string,v:any){this.filters.push([k,'ILIKE',v]);return this}
  in(k:string,v:any[]){this.filters.push([k,'IN',v]);return this}
  is(k:string,v:any){if(v!==null)throw new Error('Filtro IS inválido');this.filters.push([k,'IS NULL',null]);return this}
  not(k:string,op:string,v:any){if(op!=='is'||v!==null)throw new Error('Filtro NOT inválido');this.filters.push([k,'IS NOT NULL',null]);return this}
  or(value:string){const m=value.match(/^initial_balance_date\.is\.null,initial_balance_date\.lt\.(\d{4}-\d{2}-\d{2})$/);if(!m)throw new Error('Filtro OR inválido');this.filters.push(['initial_balance_date','DATE_OR_NULL',m[1]]);return this}
  order(k:string,opts:any={}){this.orders.push([k,opts.ascending!==false]);return this}
  limit(n:number){if(!Number.isSafeInteger(n)||n<0||n>100000)throw new Error('Limite inválido');this.take=n;return this}
  range(from:number,to:number){if(!Number.isSafeInteger(from)||from<0||!Number.isSafeInteger(to)||to<from)throw new Error('Página inválida');this.skip=from;this.take=to-from+1;return this}
  single(){this.cardinality='one';return this}
  maybeSingle(){this.cardinality='optional';return this}
  then<TResult1=any,TResult2=never>(yes?:((value:any)=>TResult1|PromiseLike<TResult1>)|null,no?:((reason:any)=>TResult2|PromiseLike<TResult2>)|null):Promise<TResult1|TResult2>{return this.execute().then(yes,no)}
  private async execute(){
    try{return await asUser(this.userId,async client=>{
      const values:any[]=[];const bind=(v:any)=>{values.push(v);return '$'+values.length}
      const where=this.filters.map(([k,op,v])=>{
        const col='t.'+identifier(k)
        if(op==='IS NULL'||op==='IS NOT NULL')return `${col} ${op}`
        if(op==='IN')return v.length?`${col} IN (${v.map(bind).join(',')})`:'FALSE'
        if(op==='DATE_OR_NULL')return `(${col} IS NULL OR ${col}<${bind(v)})`
        return `${col} ${op} ${bind(v)}`
      }).join(' AND ')
      const suffix=where?' WHERE '+where:'';const name='public.'+identifier(this.table)
      let sql:string;let count:number|undefined
      if(this.operation==='select'){
        if(this.countMode){const result=await client.query(`SELECT count(*)::int AS n FROM ${name} t${suffix}`,values);count=result.rows[0].n;if(this.head)return {data:null,error:null,count}}
        sql=`SELECT ${projection(this.table,this.fields)} FROM ${name} t${suffix}`
        if(this.orders.length)sql+=' ORDER BY '+this.orders.map(([k,asc])=>'t.'+identifier(k)+(asc?' ASC':' DESC')).join(',')
        if(this.take!==undefined)sql+=' LIMIT '+bind(this.take)
        if(this.skip)sql+=' OFFSET '+bind(this.skip)
      }else if(this.operation==='delete'){
        if(!where)throw new Error('Exclusão exige filtro')
        sql=`DELETE FROM ${name} t${suffix}`+(this.returning?' RETURNING *':'')
      }else if(this.operation==='update'){
        if(!where)throw new Error('Atualização exige filtro')
        const entries=Object.entries(this.payload).filter(([,v])=>v!==undefined)
        if(!entries.length)throw new Error('Atualização vazia')
        sql=`UPDATE ${name} t SET ${entries.map(([k,v])=>identifier(k)+'='+bind(k==='items'||k==='jsonb'?JSON.stringify(v):v)).join(',')}${suffix}`+(this.returning?' RETURNING *':'')
      }else{
        const rows=Array.isArray(this.payload)?this.payload:[this.payload]
        if(!rows.length)return {data:[],error:null}
        const columns=Array.from(new Set<string>(rows.flatMap((r:any)=>Object.keys(r).filter(k=>r[k]!==undefined))))
        sql=`INSERT INTO ${name} (${columns.map(identifier).join(',')}) VALUES `+rows.map((r:any)=>'('+columns.map(k=>r[k]===undefined?'DEFAULT':bind(k==='items'||k==='jsonb'?JSON.stringify(r[k]):r[k])).join(',')+')').join(',')
        if(this.operation==='upsert'){const conflicts=this.conflict.split(',').map(c=>c.trim());sql+=` ON CONFLICT (${conflicts.map(identifier).join(',')}) DO UPDATE SET `+columns.filter(k=>!conflicts.includes(k)).map(k=>identifier(k)+'=EXCLUDED.'+identifier(k)).join(',')}
        if(this.returning)sql+=' RETURNING *'
      }
      const result=await client.query(sql,values);let data=this.operation==='select'||this.returning?result.rows:null
      if(this.cardinality!=='many'){if((data?.length||0)>1||(this.cardinality==='one'&&!data?.length))return {data:null,error:{code:'PGRST116',message:'Registro não encontrado ou resultado ambíguo'}};data=data?.[0]??null}
      return {data,error:null,count}
    })}catch(error:any){return {data:null,error:{code:error.code||'DATABASE_ERROR',message:error.message},count:null}}
  }
}
export function localDataClient(userId:string){
  if(!/^[0-9a-f-]{36}$/i.test(userId))throw new Error('Contexto de usuário inválido')
  return {from:(table:string)=>new LocalQuery(table,userId),rpc:async(name:string,args:any={})=>{
    try{const data=await asUser(userId,async client=>{
      if(name==='get_my_storage_usage'){return (await client.query('SELECT public.get_my_storage_usage() AS value')).rows[0].value}
      if(name==='confirm_ofx_matches'){return (await client.query('SELECT public.confirm_ofx_matches($1::text,$2::jsonb) AS value',[args.account,JSON.stringify(args.matches)])).rows[0].value}
      throw new Error('Operação inválida')
    });return {data,error:null}}catch(error:any){return {data:null,error:{code:error.code,message:error.message}}}
  }}
}

