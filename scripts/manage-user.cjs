// Local administrator CLI. Never expose this through an HTTP endpoint.
const {Pool}=require('pg'),bcrypt=require('bcryptjs'),fs=require('node:fs'),{randomUUID}=require('node:crypto');
(async()=>{
 const [action,email,nameOrFile,passwordFile]=process.argv.slice(2);
 if(!['create','reset-password','approve'].includes(action)||!email?.includes('@'))throw new Error('Usage: manage-user.cjs create EMAIL NAME PASSWORD_FILE | reset-password EMAIL PASSWORD_FILE | approve EMAIL');
 const url=new URL(process.env.ADMIN_DATABASE_URL||'');
 if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw new Error('Run on the database server through loopback');
 const pool=new Pool({connectionString:url.toString()});
 const db=await pool.connect();
 try{
  let hash;
  if(action!=='approve'){
   const password=fs.readFileSync(action==='create'?passwordFile:nameOrFile,'utf8').replace(/\r?\n$/,'');
   if(password.length<12||Buffer.byteLength(password)>72)throw new Error('Use 12 or more characters and at most 72 UTF-8 bytes');
   hash=await bcrypt.hash(password,12);
  }
  await db.query('BEGIN');let id;
  if(action==='create'){
   id=randomUUID();await db.query(`INSERT INTO auth.users(id,email,encrypted_password,email_confirmed_at,raw_user_meta_data,created_at,updated_at) VALUES($1,lower($2),$3,now(),$4,now(),now())`,[id,email,hash,JSON.stringify({name:nameOrFile})]);
  }else{
   const found=await db.query('SELECT id FROM auth.users WHERE lower(email)=lower($1) AND deleted_at IS NULL FOR UPDATE',[email]);
   if(found.rows.length!==1)throw new Error('Account not found or ambiguous');id=found.rows[0].id;
   if(action==='approve')await db.query('UPDATE auth.users SET email_confirmed_at=coalesce(email_confirmed_at,now()),updated_at=now() WHERE id=$1',[id]);
   else await db.query('UPDATE auth.users SET encrypted_password=$1,updated_at=now() WHERE id=$2',[hash,id]);
  }
  await db.query('DELETE FROM app_private.sessions WHERE user_id=$1',[id]);await db.query('COMMIT');
  console.log('Account updated locally; existing sessions revoked.');
 }catch(e){await db.query('ROLLBACK');throw e}finally{db.release();await pool.end()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
