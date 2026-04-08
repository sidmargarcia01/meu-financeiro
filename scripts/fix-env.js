/**
 * Script para corrigir e verificar variáveis de ambiente
 */

const fs = require('fs');
const path = require('path');

console.log('=== Verificando e Corrigindo .env.local ===\n');

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  console.log('Conteúdo atual do .env.local:');
  console.log('='.repeat(50));
  console.log(envContent);
  console.log('='.repeat(50));
  
  // Verificar se DATABASE_URL existe e está corretamente formatada
  const hasDatabaseUrl = envContent.includes('DATABASE_URL=');
  const databaseUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
  
  if (!hasDatabaseUrl) {
    console.log('\nERRO: DATABASE_URL não encontrada');
    console.log('Adicione esta linha ao .env.local:');
    console.log('DATABASE_URL=postgresql://postgres:[senha]@db.[projeto].supabase.co:5432/postgres');
  } else if (databaseUrlMatch) {
    console.log('\nDATABASE_URL encontrada:', databaseUrlMatch[1].substring(0, 50) + '...');
    
    // Verificar se tem placeholder [senha] ou [projeto]
    if (databaseUrlMatch[1].includes('[senha]') || databaseUrlMatch[1].includes('[projeto]')) {
      console.log('ATENÇÃO: DATABASE_URL tem placeholders que precisam ser substituídos');
    }
  }
  
  // Verificar outras variáveis críticas
  const criticalVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ];
  
  console.log('\n=== Verificação de Variáveis Críticas ===');
  criticalVars.forEach(varName => {
    const hasVar = envContent.includes(`${varName}=`);
    console.log(`${varName}: ${hasVar ? 'OK' : 'FALTANDO'}`);
  });
  
  // Tentar carregar as variáveis de ambiente
  console.log('\n=== Testando Carregamento das Variáveis ===');
  require('dotenv').config({ path: '.env.local' });
  
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'CARREGADA' : 'NÃO CARREGADA');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'CARREGADA' : 'NÃO CARREGADA');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CARREGADA' : 'NÃO CARREGADA');
  
  if (!process.env.DATABASE_URL) {
    console.log('\n=== SOLUÇÃO ===');
    console.log('A DATABASE_URL não está sendo carregada corretamente.');
    console.log('Verifique se:');
    console.log('1. O arquivo .env.local está na raiz do projeto');
    console.log('2. Não há espaços extras antes de DATABASE_URL=');
    console.log('3. Não há caracteres especiais na linha');
    
    // Criar versão corrigida
    const correctedContent = envContent
      .split('\n')
      .filter(line => line.trim() !== '')
      .join('\n')
      .replace(/\s*=\s*/g, '=');
    
    fs.writeFileSync('.env.local.fixed', correctedContent);
    console.log('\nArquivo corrigido salvo como .env.local.fixed');
    console.log('Substitua o .env.local original pelo .env.local.fixed');
  }
  
} catch (error) {
  console.log('ERRO ao ler .env.local:', error.message);
  console.log('Verifique se o arquivo existe e tem permissão de leitura');
}
