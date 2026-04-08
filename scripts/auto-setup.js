/**
 * Script de configuração automática do ambiente
 * Execute: node scripts/auto-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('=== Configuração Automática do Ambiente ===\n');

// Verificar arquivo .env.local atual
let envContent = '';
if (fs.existsSync('.env.local')) {
  envContent = fs.readFileSync('.env.local', 'utf8');
  console.log('Arquivo .env.local encontrado e será atualizado');
} else {
  console.log('Criando novo arquivo .env.local');
}

// Função para adicionar ou atualizar variável
function setEnvVar(content, varName, value) {
  const regex = new RegExp(`^${varName}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${varName}=${value}`);
  } else {
    return content + (content.endsWith('\n') ? '' : '\n') + `${varName}=${value}`;
  }
}

// Configurar variáveis necessárias
console.log('Configurando variáveis de ambiente...\n');

// JWT Secrets (valores padrão seguros)
envContent = setEnvVar(envContent, 'JWT_SECRET', 'meu-financeiro-jwt-secret-2024-super-seguro-a1b2c3d4e5f6');
envContent = setEnvVar(envContent, 'JWT_REFRESH_SECRET', 'meu-financeiro-refresh-secret-2024-mais-seguro-x7y8z9w0q1r2');

// App config
envContent = setEnvVar(envContent, 'NEXT_PUBLIC_APP_URL', 'http://localhost:3001');
envContent = setEnvVar(envContent, 'NODE_ENV', 'development');

// Rate limiting
envContent = setEnvVar(envContent, 'RATE_LIMIT_REQUESTS', '100');
envContent = setEnvVar(envContent, 'RATE_LIMIT_WINDOW_MS', '900000');

// File upload
envContent = setEnvVar(envContent, 'MAX_FILE_SIZE_MB', '10');
envContent = setEnvVar(envContent, 'UPLOAD_DIR', './uploads');

// Salvar arquivo
fs.writeFileSync('.env.local', envContent);
console.log('Arquivo .env.local atualizado com sucesso!\n');

// Verificar variáveis do Supabase
const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL=');
const hasSupabaseAnon = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=');
const hasSupabaseService = envContent.includes('SUPABASE_SERVICE_ROLE_KEY=');
const hasDatabaseUrl = envContent.includes('DATABASE_URL=');

console.log('=== Status das Variáveis ===');
console.log('JWT Secrets: CONFIGURADO');
console.log('App Config: CONFIGURADO');
console.log('NEXT_PUBLIC_SUPABASE_URL:', hasSupabaseUrl ? 'OK' : 'PRECISA CONFIGURAR');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', hasSupabaseAnon ? 'OK' : 'PRECISA CONFIGURAR');
console.log('SUPABASE_SERVICE_ROLE_KEY:', hasSupabaseService ? 'OK' : 'PRECISA CONFIGURAR');
console.log('DATABASE_URL:', hasDatabaseUrl ? 'OK' : 'PRECISA CONFIGURAR');

if (!hasSupabaseUrl || !hasSupabaseAnon || !hasSupabaseService || !hasDatabaseUrl) {
  console.log('\n=== Próximos Passos ===');
  console.log('1. Conecte a extensão Supabase no VS Code:');
  console.log('   - Ctrl+Shift+P');
  console.log('   - "Supabase: Link Project"');
  console.log('   - Cole sua URL e Service Role Key');
  
  console.log('\n2. Ou configure manualmente no .env.local:');
  console.log('   - Acesse: https://supabase.com/dashboard');
  console.log('   - Settings > API: copie URL e chaves');
  console.log('   - Settings > Database: copie Connection string');
  
  console.log('\n3. Depois de configurar, execute:');
  console.log('   npm run prisma:push');
  console.log('   npm run dev');
} else {
  console.log('\n=== Tudo Configurado! ===');
  console.log('Execute os comandos:');
  console.log('npm run prisma:push');
  console.log('npm run dev');
  console.log('Acesse: http://localhost:3001/cadastros/categorias');
}

// Criar script para testar APIs
const testScript = `/**
 * Script para testar APIs após configuração
 */

require('dotenv').config({ path: '.env.local' });

async function testAPIs() {
  console.log('=== Testando APIs ===\\n');
  
  const baseUrl = 'http://localhost:3001/api';
  const apis = ['categories', 'cost-centers', 'projects', 'tags', 'contacts', 'payment-methods'];
  
  for (const api of apis) {
    try {
      const response = await fetch(\`\${baseUrl}/\${api}\`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(\`\${api}: \${response.status} \${response.ok ? 'OK' : 'ERROR'}\`);
    } catch (error) {
      console.log(\`\${api}: NETWORK ERROR - \${error.message}\`);
    }
  }
}

testAPIs().catch(console.error);
`;

fs.writeFileSync('scripts/test-apis.js', testScript);
console.log('\nScript de teste criado: scripts/test-apis.js');
console.log('Execute após configurar: node scripts/test-apis.js');
