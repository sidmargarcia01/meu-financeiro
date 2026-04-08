/**
 * Script para ajudar a configurar o .env.local completo
 */

const fs = require('fs');
const path = require('path');

console.log('=== Configuração do .env.local ===\n');

// Template completo para .env.local
const envTemplate = `# Supabase - CONFIGURE COM SEUS DADOS REAIS
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# Database - CONFIGURE COM SEUS DADOS REAIS
DATABASE_URL=postgresql://postgres:[SUA_SENHA]@db.seu-projeto-id.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[SUA_SENHA]@db.seu-projeto-id.supabase.co:5432/postgres

# JWT Secrets
JWT_SECRET=meu-financeiro-jwt-secret-2024-super-seguro-123456
JWT_REFRESH_SECRET=meu-financeiro-refresh-secret-2024-mais-seguro-789012

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./uploads
`;

console.log('Para configurar seu .env.local, siga estes passos:\n');
console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard');
console.log('2. Selecione seu projeto');
console.log('3. Vá em Settings > API');
console.log('4. Copie:');
console.log('   - Project URL -> NEXT_PUBLIC_SUPABASE_URL');
console.log('   - anon public -> NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('   - service_role -> SUPABASE_SERVICE_ROLE_KEY');
console.log('5. Vá em Settings > Database');
console.log('6. Copie a Connection string -> DATABASE_URL');
console.log('7. Substitua [SUA_SENHA] pela senha real do banco\n');

console.log('Template completo para seu .env.local:\n');
console.log('='.repeat(50));
console.log(envTemplate);
console.log('='.repeat(50));

// Verificar se .env.local existe
if (fs.existsSync('.env.local')) {
  console.log('\nArquivo .env.local já existe.');
  console.log('Adicione as variáveis que estão faltando.');
} else {
  console.log('\nCriando arquivo .env.local com template...');
  fs.writeFileSync('.env.local', envTemplate);
  console.log('Arquivo .env.local criado!');
  console.log('Agora edite o arquivo com suas credenciais reais.');
}

console.log('\nApós configurar, execute:');
console.log('1. npm run prisma:push (para criar as tabelas)');
console.log('2. npm run dev (para reiniciar o servidor)');
console.log('3. Acesse http://localhost:3001/cadastros/categorias');
