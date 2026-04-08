/**
 * Script para ajudar a conectar o VS Code com o Supabase
 * Execute este script no terminal: node scripts/connect-supabase.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Conectando VS Code com Supabase ===\n');

// Verificar se o Prisma está configurado
try {
  console.log('1. Verificando configuração do Prisma...');
  const prismaSchema = fs.readFileSync('./prisma/schema.prisma', 'utf8');
  console.log('   Schema Prisma encontrado');
} catch (error) {
  console.error('   Schema Prisma não encontrado');
  process.exit(1);
}

// Verificar se o .env.local existe
try {
  console.log('2. Verificando arquivo .env.local...');
  const envLocal = fs.readFileSync('./.env.local', 'utf8');
  
  if (envLocal.includes('NEXT_PUBLIC_SUPABASE_URL') && 
      envLocal.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    console.log('   Variáveis do Supabase encontradas');
  } else {
    console.log('   Configure as variáveis do Supabase no .env.local');
    console.log('   Copie .env.local.example para .env.local e preencha seus dados');
  }
} catch (error) {
  console.log('   Arquivo .env.local não encontrado');
  console.log('   Copie .env.local.example para .env.local e preencha seus dados');
}

console.log('\n=== Próximos Passos ===');
console.log('1. Configure seu .env.local com as credenciais do Supabase');
console.log('2. No VS Code, pressione Ctrl+Shift+P');
console.log('3. Digite "Supabase: Link Project"');
console.log('4. Cole sua URL do Supabase (ex: https://seu-projeto.supabase.co)');
console.log('5. Cole sua Service Role Key');
console.log('6. Selecione o diretório do projeto');

console.log('\n=== Para Testar a Conexão ===');
console.log('1. No VS Code, abra o painel do Supabase (ícone no sidebar)');
console.log('2. Clique em "Database" para ver as tabelas');
console.log('3. Verifique se as tabelas do schema.prisma aparecem');

console.log('\n=== Se Tiver Problemas ===');
console.log('1. Verifique se as variáveis de ambiente estão corretas');
console.log('2. Execute: npm run prisma:generate');
console.log('3. Execute: npm run prisma:studio (para testar conexão)');
