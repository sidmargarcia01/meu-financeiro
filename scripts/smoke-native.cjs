// Real HTTP/Auth/database smoke test. Creates only disposable users and cleans their data.
// Secrets are supplied by CI; no tokens, passwords or financial records are logged.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const base = process.env.SMOKE_APP_URL || 'http://127.0.0.1:3221';
const adminUrl = process.env.SMOKE_ADMIN_DATABASE_URL;
const runtimeUrl = process.env.DATABASE_URL;
let admin;
const users = [];
let checks = 0;
function pass(name) { checks++; console.log('PASS ' + name); }
async function request(path, token, method='GET', body) {
  const response = await fetch(base + path, {method, redirect:'manual', headers:{'Content-Type':'application/json', ...(token?{Authorization:'Bearer '+token,Cookie:'mf-session='+token}:{})}, ...(body?{body:JSON.stringify(body)}:{})});
  const data = await response.json().catch(()=>null);
  assert.ok(response.ok, `${method} ${path}: HTTP ${response.status}; ${data?.error || 'invalid response'}`);
  return data;
}
(async()=>{
 if (!adminUrl || !new URL(adminUrl).pathname.endsWith('_smoke_20261125')) throw new Error('Requires explicitly isolated smoke database');
 admin=new Pool({connectionString:adminUrl});
 try {
  for(let i=0;i<2;i++){
   const email=`audit-smoke-${randomUUID()}@example.invalid`, password=randomUUID()+'Aa1!';
   const id=randomUUID();
   await admin.query(`INSERT INTO auth.users(id,email,encrypted_password,email_confirmed_at,raw_user_meta_data,created_at,updated_at) VALUES($1,$2,$3,now(),$4,now(),now())`,[id,email,await bcrypt.hash(password,10),JSON.stringify({name:'Teste isolado'})]);
   users.push({id,email,password});
  }
  const tokens=[];
  for(const u of users){
    const response=await fetch(base+'/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:u.email,password:u.password})});
    assert.equal(response.status,200,'Native password login');
    assert.ok(response.headers.get('set-cookie').includes('HttpOnly'));
    tokens.push(response.headers.get('set-cookie').match(/mf-session=([a-f0-9]+)/)[1]);
  }
  const [ta,tb]=tokens;pass('native password login with HttpOnly sessions');
  const anon=await fetch(base+'/api/accounts',{redirect:'manual'});assert.equal(anon.status,401);pass('unauthenticated API is denied');
  const account=await request('/api/accounts',ta,'POST',{name:'Auditoria A',type:'CORRENTE',initialBalance:1000,initialBalanceDate:'2026-01-01',currency:'BRL'});
  const destination=await request('/api/accounts',ta,'POST',{name:'Auditoria B',type:'CORRENTE',initialBalance:0,currency:'BRL'});
  assert.deepEqual(await request('/api/accounts',tb),[]);pass('second user cannot see first users accounts');
  const cat=await request('/api/categories',ta,'POST',{name:'Auditoria despesa',type:'DESPESA'});
  const expense=await request('/api/transactions',ta,'POST',{description:'Despesa de teste',accountId:account.id,categoryId:cat.id,type:'DESPESA',amount:300,dueDate:'2026-01-15',status:'PENDENTE'});
  assert.equal(expense.amount,-300);
  await request(`/api/transactions/${expense.id}?action=confirm`,ta,'PATCH');pass('expense creation and confirmation');
  await request('/api/transactions',ta,'POST',{description:'Transferência teste',accountId:account.id,type:'TRANSFERENCIA',amount:100,dueDate:'2026-01-15',transferData:{destinationAccountId:destination.id}});
  const balances=await request('/api/accounts?balances=true',ta);
  assert.equal(balances.reduce((sum,x)=>sum+Number(x.confirmedBalance),0),700);pass('transfer preserves combined balance including opening balance');
  await request('/api/transactions',ta,'POST',{description:'Parcelas teste',accountId:account.id,categoryId:cat.id,type:'DESPESA',amount:40,dueDate:'2026-01-31',isRecurring:true,recurrenceData:{type:'PARCELADA',totalInstallments:3,firstDueDate:'2026-01-31'}});
  const rows=await request('/api/transactions?all=true',ta);
  const installments=rows.filter(x=>x.description.startsWith('Parcelas teste'));
  assert.deepEqual(installments.map(x=>x.due_date).sort(),['2026-01-31','2026-02-28','2026-03-31']);pass('month-end installments persist correctly');
  await request('/api/investments',ta,'POST',{name:'Ativo teste A',type:'ACOES',quantity:2,averagePrice:50,currentPrice:60});
  await request('/api/investments',ta,'POST',{name:'Ativo teste B',type:'FII',quantity:3,averagePrice:40,currentPrice:50});
  const portfolio=await request('/api/investments?portfolio=true',ta);
  assert.equal(portfolio.totalInvested,220);assert.equal(portfolio.currentValue,270);
  assert.ok(portfolio.investments.every(i=>typeof i.quantity==='number'&&typeof i.totalInvested==='number'));
  pass('PostgreSQL decimals remain numbers and investment totals add correctly');
  const saved=await request('/api/collections/planejamento',ta);
  await request('/api/collections/planejamento',ta,'PUT',{items:[{id:'audit',nome:'Teste'}],version:saved.version});
  const persisted=await request('/api/collections/planejamento',ta);
  assert.equal(persisted.items.length,1);
  await request('/api/collections/planejamento',ta,'PUT',{items:[{id:'audit',nome:'Atualizado'}],version:persisted.version});
  assert.equal((await request('/api/collections/planejamento',ta)).items[0].nome,'Atualizado');
  assert.equal((await request('/api/collections/planejamento',tb)).items.length,0);pass('planning persistence and isolation');
  const runtime=new Pool({connectionString:runtimeUrl});
  const c=await runtime.connect();
  try{
    await c.query('BEGIN');await c.query('SET LOCAL ROLE financeiro_app');
    await c.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[users[1].id]);
    assert.equal((await c.query('SELECT id FROM public.accounts WHERE id=$1',[account.id])).rowCount,0);
    await c.query('ROLLBACK');pass('PostgreSQL RLS blocks cross-user access');
    await c.query('BEGIN');await c.query('SET LOCAL ROLE financeiro_app');
    await c.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[users[1].id]);
    await assert.rejects(c.query('UPDATE public.users SET plan_id=plan_id WHERE id=$1',[users[1].id]),error=>error.code==='42501');
    await c.query('ROLLBACK');pass('native privileges prevent users from changing their own plan');
  }finally{c.release();await runtime.end()}
  const match={id:expense.id,fitid:'audit-'+randomUUID(),date:'2026-02-02',amount:-300};
  await request('/api/reconciliation/confirm',ta,'POST',{accountId:account.id,matches:[match]});
  await request('/api/reconciliation/confirm',ta,'POST',{accountId:account.id,matches:[match]});pass('OFX reconciliation is idempotent');
  for(const path of ['/api/dashboard','/api/reports/dre','/api/reports/dfc','/api/reports/indicadores','/api/reports/extrato']){await request(path,ta);pass('read '+path)}
  await request('/api/auth/logout',ta,'POST');
  assert.equal((await fetch(base+'/api/accounts',{headers:{Cookie:'mf-session='+ta}})).status,401);pass('logout revokes local session');
  console.log(`${checks} live integration checks passed`);
 } finally {
  // The entire test database is disposable; no production rows are modified.
  if(admin)await admin.end();
 }
})().catch(error=>{console.error(error.message);process.exitCode=1});
