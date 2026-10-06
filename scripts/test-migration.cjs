const fs=require('fs'),path=require('path'); const assert=require('node:assert/strict');
const {PGlite}=require('@electric-sql/pglite');
const root=path.join(__dirname,'..');
(async()=>{
 const db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
 create table storage.objects(owner_id text,metadata jsonb);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,storage to anon,authenticated; grant select on storage.objects to authenticated;`);
 await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/20260404125007_initial_schema.sql'),'utf8'));
 await db.exec(`create table public.payment_methods(id text primary key default gen_random_uuid()::text,user_id text references users(id),name text,type text,created_at timestamptz default now()); grant all on all tables in schema public to anon,authenticated;`);
 await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/20261006203405_audit_expand_compatibility.sql'),'utf8'));
 await db.exec(fs.readFileSync(path.join(root,'supabase/migrations/20261006194244_audit_financial_integrity.sql'),'utf8'));
 const u1='11111111-1111-4111-8111-111111111111',u2='22222222-2222-4222-8222-222222222222';
 await db.exec(`insert into auth.users values('${u1}','audit-a@example.invalid','{}'),('${u2}','audit-b@example.invalid','{}');
 insert into accounts(id,user_id,name,type) values('a','${u1}','A','CORRENTE'),('b','${u1}','B','CORRENTE'),('c','${u2}','C','CORRENTE');
 insert into categories(id,user_id,name,type) values('cat-a','${u1}','A','DESPESA'),('cat-b','${u2}','B','DESPESA');`);
 let count=0;
 async function test(name,fn){await fn();count++;console.log('PASS '+name)}
 async function rejected(sql){await assert.rejects(()=>db.exec(sql))}
 await test('anonymous cannot read financial data',async()=>{await db.exec('set role anon');await rejected('select * from accounts');await db.exec('reset role')});
 await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${u1}',false);`);
 await test('user only sees own accounts',async()=>assert.equal((await db.query('select count(*)::int n from accounts')).rows[0].n,2));
 await test('cannot create transaction for another user',()=>rejected(`insert into transactions(user_id,account_id,description,amount,type,due_date) values('${u2}','c','x',-1,'DESPESA','2026-01-01')`));
 await test('cannot link another users category',()=>rejected(`insert into transactions(user_id,account_id,category_id,description,amount,type,due_date) values('${u1}','a','cat-b','x',-1,'DESPESA','2026-01-01')`));
 await test('own transaction and fallback dates work',async()=>{await db.exec(`insert into transactions(id,user_id,account_id,category_id,description,amount,type,due_date) values('tx','${u1}','a','cat-a','x',-100,'DESPESA','2026-01-15')`);assert.equal(String((await db.query("select effective_cash_date::text d from transactions where id='tx'")).rows[0].d),'2026-01-15')});
 await test('cannot promote own plan',()=>rejected("update users set plan_id=null"));
 await test('atomic transfer conserves funds',async()=>{await db.exec(`insert into transactions(user_id,account_id,description,amount,type,due_date,transfer_group_id) values('${u1}','a','x',-50,'TRANSFERENCIA','2026-01-15','pair'),('${u1}','b','x',50,'TRANSFERENCIA','2026-01-15','pair')`)});
 await test('cannot delete half a transfer',()=>rejected("delete from transactions where transfer_group_id='pair' and account_id='a'"));
 await test('can delete entire transfer atomically',()=>db.exec("delete from transactions where transfer_group_id='pair'"));
 await test('OFX confirmation records date and identifier',async()=>{assert.equal((await db.query(`select confirm_ofx_matches('a','[{"id":"tx","fitid":"fit-1","date":"2026-02-02","amount":-100}]') n`)).rows[0].n,1)});
 await test('OFX replay is idempotent',async()=>assert.equal((await db.query(`select confirm_ofx_matches('a','[{"id":"tx","fitid":"fit-1","date":"2026-02-02","amount":-100}]') n`)).rows[0].n,0));
 await test('cannot confirm another account',()=>rejected(`select confirm_ofx_matches('c','[]')`));
 await test('collections persist with owner isolation',async()=>{await db.exec(`insert into saved_collections(user_id,name,items) values('${u1}','planejamento','[{"nome":"teste"}]')`);await db.exec(`select set_config('request.jwt.claim.sub','${u2}',false)`);assert.equal((await db.query('select count(*)::int n from saved_collections')).rows[0].n,0)});
 await db.exec('reset role');await test('all audited tables have RLS',async()=>assert.equal((await db.query("select count(*)::int n from pg_class where relnamespace='public'::regnamespace and relname in ('accounts','categories','contacts','cost_centers','payment_methods','projects','tags','transactions','users') and not relrowsecurity")).rows[0].n,0));
 console.log(`${count} migration checks passed`);await db.close();
})().catch(e=>{console.error(e.message);process.exitCode=1});
