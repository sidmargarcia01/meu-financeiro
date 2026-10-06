// Prevent accidental environment exports or privileged JWTs from entering the repository.
const fs=require('node:fs');const {execFileSync}=require('node:child_process');
const paths=execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split(/\r?\n/);
const failures=[];
for(const file of paths){
 if(!fs.existsSync(file))continue;
 if(/(^|\/)\.env/.test(file)&&!['.env.example','.env.local.example'].includes(file)){failures.push(file);continue;}
 const data=fs.readFileSync(file,'utf8');
 for(const match of data.matchAll(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)){
  try{const claims=JSON.parse(Buffer.from(match[0].split('.')[1],'base64url'));
   if(claims.role==='service_role')failures.push(file);
  }catch{/* Non-JWT text is not a credential. */}
 }
}
if(failures.length){console.error('Remove privileged credentials or environment exports from: '+[...new Set(failures)].join(', '));process.exitCode=1;}
else console.log('No tracked environment exports or privileged JWTs');

