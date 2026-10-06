// Read-only audit harness: executes repository code with in-memory database doubles.
const fs = require('fs');
const path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const ts = require(path.join(root, 'node_modules/typescript'));
const cache = new Map();
let tables = {}, calls = [];
const db = { from(table) {
  let rows = structuredClone(tables[table] || []).map(r => table === "transactions" ? {...r,effective_cash_date:r.payment_date||r.due_date,effective_competence_date:r.competence_date||r.due_date} : r), filters = [], update, single = false, offset=0, end=Infinity;
  const q = { select(){return q}, eq(k,v){filters.push(r=>r[k]===v);return q},
    in(k,v){filters.push(r=>v.includes(r[k]));return q},
    is(k,v){filters.push(r=>(r[k]??null)===v);return q},
    gte(k,v){filters.push(r=>r[k]!=null&&r[k]>=v);return q},
    lte(k,v){filters.push(r=>r[k]!=null&&r[k]<=v);return q},
    lt(k,v){filters.push(r=>r[k]!=null&&r[k]<v);return q},
    order(){return q}, limit(){return q}, range(a,b){offset=a;end=b;return q},
    update(v){update=v;calls.push({table,update:v});return q},
    insert(v){rows=[v];calls.push({table,insert:v});return q},
    single(){single=true;return q},
    then(resolve,reject){let data=rows.filter(r=>filters.every(f=>f(r))).slice(offset,end+1).map(r=>({...r,...update}));return Promise.resolve({data:single?data[0]:data,error:null}).then(resolve,reject)} };
  return q;
}};
function load(file) {
  if((file==='@/lib/supabase'||file==='@/lib/requestSupabase'))return {supabase:db};
  const f=file.startsWith('@/')?path.join(root,'src',file.slice(2)+'.ts'):file;
  if(cache.has(f))return cache.get(f).exports;
  const mod={exports:{}};cache.set(f,mod);
  const code=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  new Function('require','module','exports',code)(s=>s.startsWith('@/')?load(s):require(require.resolve(s,{paths:[root]})),mod,mod.exports);
  return mod.exports;
}
const {ReportService}=load('@/services/reportService');
const {TransactionService}=load('@/services/transactionService');
const {ReconciliationService}=load('@/services/reconciliationService');
const {InvestmentService}=load('@/services/investmentService');
const {dashboardService}=load('@/services/dashboardService');
const {accountRepository}=load('@/repositories/accountRepository');
const {transactionRepository}=load('@/repositories/transactionRepository');
const {FluxoGerencialService}=load('@/services/fluxoGerencialService');
const results=[];
async function check(name,run){try{const {actual,expected}=await run();results.push({name,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)})}catch(e){results.push({name,error:e.message})}}
const user='audit-user', account='a';
const tx=(amount,type,extra={})=>{const r={id:'t',user_id:user,account_id:account,amount,type,status:'CONFIRMADO',due_date:'2026-01-15',payment_date:'2026-01-15',...extra};return {...r,effective_cash_date:r.payment_date||r.due_date,effective_competence_date:r.competence_date||r.due_date}};
const cat=(id,type,group)=>({id,name:id,type,parent_id:null,dre_group:group});
function service(){const created=[]; const repo={countByUserMonth:async()=>0,create:async t=>{created.push(t);return t},createMany:async t=>{created.push(...t);return t}};return {created,repo,s:new TransactionService(repo,{getUserPlan:async()=>null},{create:async()=>({id:'r'})},{findById:async id=>({id,name:id})})}}
(async()=>{
 await check('Extrato: despesa deve manter sinal negativo',async()=>{tables={transactions:[tx(-100,'DESPESA')]};return {actual:(await new ReportService().gerarExtrato(user))[0].valor,expected:-100}});
 await check('Balanco usado nos indicadores: 1000 menos despesa 100',async()=>{tables={accounts:[{id:account,user_id:user,is_active:true,initial_balance:1000}],transactions:[tx(-100,'DESPESA')]};return {actual:(await new ReportService().gerarBalanco(user,'2026-01-31')).ativoCirculante,expected:900}});
 await check('DRE caixa: pagamento em fevereiro nao pertence a janeiro',async()=>{tables={categories:[],transactions:[tx(100,'RECEITA',{payment_date:'2026-02-10'})]};return {actual:(await new ReportService().gerarDRE(user,'2026-01-01','2026-01-31')).totalReceitas,expected:0}});
 await check('DRE misto: categoria sem grupo nao pode desaparecer',async()=>{const cats=[cat('vendas','RECEITA','RECEITAS_OPERACIONAIS'),cat('aluguel','DESPESA','DESPESAS_FIXAS'),cat('outras','DESPESA',null)];tables={categories:cats.map(c=>({...c,user_id:user})),transactions:[tx(1000,'RECEITA',{categories:cats[0]}),tx(-100,'DESPESA',{categories:cats[1]}),tx(-50,'DESPESA',{categories:cats[2]})]};const d=await new ReportService().gerarDRE(user,'2026-01-01','2026-01-31');return {actual:d.estruturado.resultadoLiquido,expected:d.resultado}});
 await check('DFC: incluir saldo inicial da conta',async()=>{tables={accounts:[{id:account,user_id:user,initial_balance:1000}],transactions:[tx(-100,'DESPESA')]};return {actual:(await new ReportService().gerarDFC(user,'2026-01-01','2026-01-31')).saldoFinal,expected:900}});
 await check('OFX: reconhecer despesa de -100 contra debito 100',async()=>{tables={transactions:[tx(-100,'DESPESA')]};const r=await new ReconciliationService().findMatches(user,[{fitid:'f',dtposted:'2026-01-15',trnamt:100,trntype:'DEBIT',memo:''}], account);return {actual:r[0].status,expected:'matched'}});
 await check('OFX: nao reutilizar uma receita em duas linhas',async()=>{tables={transactions:[tx(100,'RECEITA')]};const ofx={dtposted:'2026-01-15',trnamt:100,trntype:'CREDIT',memo:''};const r=await new ReconciliationService().findMatches(user,[{...ofx,fitid:'1'},{...ofx,fitid:'2'}], account);return {actual:r.filter(x=>x.suggestion).length,expected:1}});
 await check('Recorrencia fixa: despesa deve ser negativa',async()=>{const {s,created}=service();await s.createTransaction(user,{description:'aluguel',amount:100,type:'DESPESA',accountId:account,dueDate:'2026-01-15',isRecurring:true,recurrenceData:{type:'FIXA',frequency:'MENSAL'}});return {actual:created[0].amount,expected:-100}});
 await check('Recorrencia fixa: respeitar data final',async()=>{const {s,created}=service();await s.createTransaction(user,{description:'aluguel',amount:100,type:'DESPESA',accountId:account,dueDate:'2026-01-15',isRecurring:true,recurrenceData:{type:'FIXA',frequency:'MENSAL',endDate:'2026-02-15'}});return {actual:created.length,expected:2}});
 await check('Parcelas: vencimento dia 31 deve ajustar fevereiro',async()=>{const {s,created}=service();await s.createInstallmentTransaction({userId:user,description:'x',installmentAmount:100,installments:3,dueDate:'2026-01-31',type:'DESPESA',installmentType:'VALOR_PARCELA'});return {actual:created.map(x=>x.dueDate.toISOString().slice(0,10)),expected:['2026-01-31','2026-02-28','2026-03-31']}});
 await check('Parcelas: soma em centavos conserva valor total',async()=>{const {s,created}=service();await s.createInstallmentTransaction({userId:user,description:'x',totalAmount:100,installments:3,dueDate:'2026-01-15',type:'DESPESA',installmentType:'VALOR_TOTAL'});return {actual:created.reduce((s,x)=>s+Math.round(Math.abs(x.amount)*100),0),expected:10000}});
 await check('Transferencia: nao gerar receita/despesa operacional',async()=>{const {s,created}=service();await s.createTransaction(user,{amount:100,description:'x',type:'TRANSFERENCIA',accountId:account,dueDate:'2026-01-15',transferData:{destinationAccountId:'b'}});return {actual:created.map(x=>x.type),expected:['TRANSFERENCIA','TRANSFERENCIA']}});
 await check('Dashboard: incluir saldo inicial',async()=>{const af=accountRepository.findAllByUser,ts=accountRepository.listWithBalances;accountRepository.listWithBalances=async()=>[{id:account,name:"Conta",projectedBalance:1000,confirmedBalance:1000}];accountRepository.findAllByUser=async()=>[{id:account,name:'Conta',initialBalance:1000}];transactionRepository.sumByAccount=async()=>0;try{return {actual:(await dashboardService.getSaldoConsolidado(user)).total_confirmado,expected:1000}}finally{accountRepository.findAllByUser=af;accountRepository.listWithBalances=ts}});
 await check('Investimento: preco atualizado deve recalcular posicao',async()=>{tables={investments:[{id:'i',user_id:user,quantity:10,average_price:10,total_invested:100,current_value:100}]};return {actual:(await new InvestmentService().update(user,'i',{currentPrice:20})).currentValue,expected:200}});
 await check('Fluxo gerencial: impostos sobre faturamento reduzem resultado',async()=>{const old=[transactionRepository.findAllForPeriodWithCategory,transactionRepository.sumConfirmedBefore,accountRepository.sumInitialBalancesBefore];transactionRepository.findAllForPeriodWithCategory=async()=>[tx(1000,'RECEITA',{categories:cat('vendas','RECEITA','RECEITAS_OPERACIONAIS')}),tx(-100,'DESPESA',{categories:cat('impostos','DESPESA','IMPOSTOS_FATURAMENTO')})];transactionRepository.sumConfirmedBefore=async(u,date)=>date==='2026-01-01'?0:900;accountRepository.sumInitialBalancesBefore=async()=>0;try{const r=await new FluxoGerencialService().gerarMatriz(user,'2026-01-01','2026-01-31');return {actual:r.linhas.find(l=>l.id==='resultado_liquido').valores[0].realizado,expected:900}}finally{[transactionRepository.findAllForPeriodWithCategory,transactionRepository.sumConfirmedBefore,accountRepository.sumInitialBalancesBefore]=old}});
 await check('Controle: DFC soma despesa negativa corretamente sem saldo inicial',async()=>{tables={transactions:[tx(500,'RECEITA'),tx(-100,'DESPESA')]};return {actual:(await new ReportService().gerarDFC(user,'2026-01-01','2026-01-31')).saldoFinal,expected:400}});
 console.log(JSON.stringify(results,null,2));if(results.some(r=>!r.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
