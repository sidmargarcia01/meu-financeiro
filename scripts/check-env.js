/**
 * Script para verificar e ajudar a configurar variáveis de ambiente
 */

const fs = require('fs');
const path = require('path');

console.log('=== Verificando Variáveis de Ambiente ===\n');

// Verificar se .env.local existe
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  console.log('Arquivo .env.local encontrado');
  
  // Verificar variáveis necessárias
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL'
  ];
  
  const missingVars = [];
  const presentVars = [];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=seu-`)) {
      presentVars.push(varName);
    } else {
      missingVars.push(varName);
    }
  });
  
  console.log('\nVariáveis Presentes:');
  presentVars.forEach(v => console.log(`  ${v}`));
  
  if (missingVars.length > 0) {
    console.log('\nVariáveis Faltantes (precisam ser configuradas):');
    missingVars.forEach(v => console.log(`  ${v}`));
    
    console.log('\n=== Como Configurar ===');
    console.log('1. Abra o arquivo .env.local');
    console.log('2. Adicione as variáveis faltantes:');
    
    if (missingVars.includes('JWT_SECRET')) {
      console.log('   JWT_SECRET=seu-secret-seguro-aqui');
    }
    if (missingVars.includes('JWT_REFRESH_SECRET')) {
      console.log('   JWT_REFRESH_SECRET=seu-refresh-secret-aqui');
    }
    
    console.log('3. Para as variáveis do Supabase, obtenha do painel Supabase:');
    console.log('   - Settings > API');
    console.log('4. Reinicie o servidor: npm run dev');
  } else {
    console.log('\nTodas as variáveis necessárias estão presentes!');
  }
  
} catch (error) {
  console.log('Arquivo .env.local não encontrado');
  console.log('Copie .env.local.example para .env.local e configure suas variáveis');
}
