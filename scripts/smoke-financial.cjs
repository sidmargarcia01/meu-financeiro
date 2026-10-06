// Real HTTP/Auth/database smoke test. Creates only disposable users and cleans their data.
// Secrets are supplied by CI; no tokens, passwords or financial records are logged.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const base = process.env.SMOKE_APP_URL || 'http://127.0.0.1:3000';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const users = [];
let checks = 0;
function pass(name) { checks++; console.log('PASS ' + name); }
async function request(path, token, method='GET', body) {
  const response = await fetch(base + path, {method, redirect:'manual', headers:{'Content-Type':'application/json', ...(token?{Authorization:'Bearer '+token,Cookie:'sb-access-token='+token}:{})}, ...(body?{body:JSON.stringify(body)}:{})});
  const data = await response.json().catch(()=>null);
  assert.ok(response.ok, `${method} ${path}: HTTP ${response.status}; ${data?.error || 'invalid response'}`);
  return data;
}
(async()=>{
 if (!url || !key || !service) throw new Error('Smoke requires Supabase URL, public key and server key');
 if (new URL(url).hostname !== 'ctjzuolergnrsrijvsjw.supabase.co') throw new Error('Unexpected Supabase project');
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 if(process.env.SMOKE_REQUIRE_RLS==='true'){
  const publicClient=createClient(url,key,{auth:{persistSession:false}});
  let ready=false;
  for(let attempt=0;attempt<90;attempt++){
   const probe=await publicClient.from('accounts').select('id').limit(0);
   if(probe.error?.code==='42501'){ready=true;break;}
   if(attempt===0)console.log('Waiting for coordinated database security migration');
   await new Promise(resolve=>setTimeout(resolve,2000));
  }
  assert.ok(ready,'Database security migration is not active');
 }
 try {
  for(let i=0;i<2;i++){
   const email=`audit-smoke-${randomUUID()}@example.invalid`, password=randomUUID()+'Aa1!';
   const result=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{name:'Auditoria temporária'}});
   if(result.error) throw new Error('Unable to provision isolated test user: '+result.error.message);
   users.push({id:result.data.user.id,email,password});
  }
  const [a,b]=await Promise.all(users.map(u=>request('/api/auth',null,'POST',{email:u.email,password:u.password})));
  const ta=a.session.access_token,tb=b.session.access_token;pass('Supabase login through application API');
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
  const saved=await request('/api/collections/planejamento',ta);
  await request('/api/collections/planejamento',ta,'PUT',{items:[{id:'audit',nome:'Teste'}],version:saved.version});
  assert.equal((await request('/api/collections/planejamento',ta)).items.length,1);
  assert.equal((await request('/api/collections/planejamento',tb)).items.length,0);pass('planning persistence and isolation');
  if(process.env.SMOKE_REQUIRE_RLS==='true'){
   const c=createClient(url,key,{global:{headers:{Authorization:'Bearer '+tb}},auth:{persistSession:false}});
   const foreign=await c.from('accounts').select('id').eq('id',account.id);assert.ifError(foreign.error);assert.equal(foreign.data.length,0);
   const publicClient=createClient(url,key,{auth:{persistSession:false}});
   const publicRead=await publicClient.from('accounts').select('id').limit(0);assert.ok(publicRead.error);pass('database RLS and anonymous privileges');
   const match={id:expense.id,fitid:'audit-'+randomUUID(),date:'2026-02-02',amount:-300};
   await request('/api/reconciliation/confirm',ta,'POST',{accountId:account.id,matches:[match]});
   await request('/api/reconciliation/confirm',ta,'POST',{accountId:account.id,matches:[match]});pass('OFX reconciliation is idempotent');
  }
  console.log(`${checks} live integration checks passed`);
 } finally {
  for(const user of users){
   const profile=await admin.from('users').delete().eq('id',user.id);
   const auth=await admin.auth.admin.deleteUser(user.id);
   if(profile.error || auth.error) throw new Error('Temporary user cleanup failed; inspect CI run before retrying');
  }
  console.log('Temporary users and owned data removed');
 }
})().catch(error=>{console.error(error.message);process.exitCode=1});
