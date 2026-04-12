/**
 * Script para verificar configurações de extensões e ambiente
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Verificação de Extensões e Configurações ===\n');

// 1. Verificar extensões VS Code
console.log('1. VERIFICANDO EXTENSÕES VS CODE');
try {
  const extensions = execSync('code --list-extensions', { encoding: 'utf8' });
  const extensionList = extensions.trim().split('\n');
  
  console.log('Extensões instaladas:');
  extensionList.forEach(ext => console.log(`  - ${ext}`));
  
  // Verificar extensões necessárias
  const requiredExtensions = [
    'supabase.supabase',
    'ms-vscode.vscode-typescript-next',
    'bradlc.vscode-tailwindcss',
    'esbenp.prettier-vscode',
    'ms-vscode.vscode-eslint'
  ];
  
  console.log('\nExtensões necessárias:');
  requiredExtensions.forEach(reqExt => {
    const isInstalled = extensionList.some(installed => installed.includes(reqExt.split('.')[1]));
    console.log(`  ${reqExt}: ${isInstalled ? 'INSTALADA' : 'NÃO INSTALADA'}`);
  });
  
} catch (error) {
  console.log('ERRO ao verificar extensões:', error.message);
}

// 2. Verificar configuração do Supabase
console.log('\n2. VERIFICANDO CONFIGURAÇÃO SUPABASE');
try {
  require('dotenv').config({ path: '.env.local' });
  
  const supabaseConfig = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    databaseUrl: process.env.DATABASE_URL
  };
  
  console.log('Configuração Supabase:');
  Object.entries(supabaseConfig).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
  });
  
  if (supabaseConfig.url && supabaseConfig.serviceKey) {
    console.log('\nTestando conexão com Supabase...');
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceKey);
    
    supabase.from('users').select('count').limit(1).then(({ data, error }) => {
      if (error) {
        console.log('  Conexão: ERRO -', error.message);
      } else {
        console.log('  Conexão: OK');
      }
    });
  }
  
} catch (error) {
  console.log('ERRO na configuração Supabase:', error.message);
}

// 3. Verificar configuração GitHub
console.log('\n3. VERIFICANDO CONFIGURAÇÃO GITHUB');
try {
  const gitRemote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
  console.log('Remote origin:', gitRemote);
  
  const gitBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  console.log('Branch atual:', gitBranch);
  
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  console.log('Status:', gitStatus.trim() ? 'Arquivos pendentes' : 'Tudo commitado');
  
} catch (error) {
  console.log('ERRO na configuração GitHub:', error.message);
}

// 4. Verificar configuração Vercel
console.log('\n4. VERIFICANDO CONFIGURAÇÃO VERCEL');
try {
  const vercelConfig = fs.existsSync('vercel.json');
  console.log('vercel.json:', vercelConfig ? 'EXISTE' : 'NÃO EXISTE');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const buildScript = packageJson.scripts?.build;
  console.log('script build:', buildScript ? 'CONFIGURADO' : 'NÃO CONFIGURADO');
  
  if (vercelConfig) {
    const vercelConfigContent = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    console.log('Configuração Vercel:', JSON.stringify(vercelConfigContent, null, 2));
  }
  
} catch (error) {
  console.log('ERRO na configuração Vercel:', error.message);
}

// 5. Verificar arquivos de configuração
console.log('\n5. VERIFICANDO ARQUIVOS DE CONFIGURAÇÃO');
const configFiles = [
  '.env.local',
  '.gitignore',
  'package.json',
  'next.config.js',
  'tsconfig.json',
  'tailwind.config.js',
  '.eslintrc.json',
  '.prettierrc'
];

configFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${file}: ${exists ? 'EXISTE' : 'NÃO EXISTE'}`);
});

console.log('\n=== RECOMENDAÇÕES ===');
console.log('1. Instale extensões VS Code necessárias:');
console.log('   - Supabase: supabase.supabase');
console.log('   - TypeScript: ms-vscode.vscode-typescript-next');
console.log('   - Tailwind CSS: bradlc.vscode-tailwindcss');
console.log('   - Prettier: esbenp.prettier-vscode');
console.log('   - ESLint: ms-vscode.vscode-eslint');

console.log('\n2. Configure Vercel:');
console.log('   - Conecte repositório GitHub');
console.log('   - Configure variáveis de ambiente');
console.log('   - Configure domínio personalizado');

console.log('\n3. Configure Supabase:');
console.log('   - Link projeto VS Code');
console.log('   - Configure autenticação');
console.log('   - Configure RLS policies');
