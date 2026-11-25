// Run once as database owner against a fresh, isolated PostgreSQL 17 instance.
const {Pool}=require('pg'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 if(!process.env.ADMIN_DATABASE_URL||!process.env.DATABASE_URL)throw new Error('Provide ADMIN_DATABASE_URL and DATABASE_URL');
 const target=new URL(process.env.DATABASE_URL),adminUrl=new URL(process.env.ADMIN_DATABASE_URL);
 if(target.hostname!==adminUrl.hostname||target.pathname!==adminUrl.pathname||target.port!==adminUrl.port)throw new Error('Database targets differ');
 if(target.username!=='financeiro_server'||!target.password)throw new Error('Use the restricted financeiro_server login');
 const db=new Pool({connectionString:process.env.ADMIN_DATABASE_URL});
 try{
  for(const file of ['001-schema.sql','002-runtime.sql'])await db.query(fs.readFileSync(path.join(__dirname,'../database/native',file),'utf8'));
  const password=decodeURIComponent(target.password);
  const sql=(await db.query("SELECT format('ALTER ROLE financeiro_server LOGIN PASSWORD %L',$1::text) AS sql",[password])).rows[0].sql;
  await db.query(sql);console.log('Native database initialized; no customer records seeded.');
 }finally{await db.end()}
})().catch(()=>{console.error('Native initialization failed; inspect the private database log.');process.exitCode=1});
