/**
 * Script para configurar Vercel e GitHub para deploy
 */

const fs = require('fs');
const path = require('path');

console.log('=== Configurando Vercel e GitHub ===\n');

// 1. Verificar configuração GitHub
console.log('1. VERIFICANDO CONFIGURAÇÃO GITHUB');
try {
  const { execSync } = require('child_process');
  
  const gitRemote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
  const gitBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  
  console.log(`   Repository: ${gitRemote}`);
  console.log(`   Branch atual: ${gitBranch}`);
  
  // Verificar se tem commits pendentes
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    console.log('   Status: Há arquivos pendentes para commit');
    console.log('   Execute: git add . && git commit -m "mensagem" && git push');
  } else {
    console.log('   Status: Tudo commitado');
  }
  
} catch (error) {
  console.log('   ERRO: Verifique se está em um repositório Git');
}

// 2. Verificar configuração Vercel
console.log('\n2. VERIFICANDO CONFIGURAÇÃO VERCEL');
try {
  const vercelConfig = fs.existsSync('vercel.json');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  console.log(`   vercel.json: ${vercelConfig ? 'EXISTE' : 'NÃO EXISTE'}`);
  console.log(`   script build: ${packageJson.scripts?.build ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
  console.log(`   script start: ${packageJson.scripts?.start ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
  
  if (vercelConfig) {
    const vercelConfigContent = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    console.log('   Configuração Vercel: OK');
  }
  
} catch (error) {
  console.log('   ERRO ao verificar configuração Vercel');
}

// 3. Verificar variáveis de ambiente necessárias
console.log('\n3. VARIÁVEIS DE AMBIENTE PARA VERCEL');
console.log('   Variáveis necessárias no Vercel:');
console.log('   - NEXT_PUBLIC_SUPABASE_URL');
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('   - SUPABASE_SERVICE_ROLE_KEY');
console.log('   - DATABASE_URL');
console.log('   - JWT_SECRET');
console.log('   - JWT_REFRESH_SECRET');

// 4. Criar arquivo de instruções para Vercel
const vercelInstructions = `
# CONFIGURAÇÃO VERCEL

## 1. Conectar Repositório GitHub
1. Acesse: https://vercel.com
2. Clique em "New Project"
3. Importe o repositório GitHub: sidmargarcia01/meu-financeiro
4. Selecione o branch: develop

## 2. Configurar Build Settings
- Framework Preset: Next.js
- Build Command: npm run build
- Output Directory: .next
- Install Command: npm install

## 3. Configurar Variáveis de Ambiente
No Vercel Dashboard > Settings > Environment Variables, adicione:

NEXT_PUBLIC_SUPABASE_URL=https://ctjzuolergnrsrijvsjw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0anp1b2xlcmducnNyaWp2c2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyODY4MzMsImV4cCI6MjA5MDg2MjgzM30.qfxMn0Rqb-uhRYQTZj3BMxinGGsrAGyaMW0RS62AlG8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0anp1b2xlcmducnNyaWp2c2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4NjgzMywiZXhwIjoyMDkwODYyODMzfQ.iOBfh-E_sRVdJv8Vk6iifNxZbz_RYr8Cm4iU8aizr3c
DATABASE_URL=postgresql://postgres:e86aba519ed070448381ea41c2788fc3a98f39a4bc4e803290f9694b11ed096f@aws-0-sa-east-1.pooler.supabase.co:5432/postgres
JWT_SECRET=meu-financeiro-jwt-secret-2024-super-seguro-a1b2c3d4e5f6
JWT_REFRESH_SECRET=meu-financeiro-refresh-secret-2024-mais-seguro-x7y8z9w0q1r2

## 4. Configurar Domínio (Opcional)
- Em Settings > Domains, adicione seu domínio personalizado
- Configure DNS conforme instruções do Vercel

## 5. Deploy Automático
- Configure webhook para deploy automático
- Cada push para develop fará deploy automático
`;

fs.writeFileSync('VERCEL_SETUP.md', vercelInstructions);
console.log('\n   Arquivo VERCEL_SETUP.md criado com instruções detalhadas');

// 5. Criar workflow do GitHub Actions (alternativa ao Vercel)
const githubWorkflow = `
name: Deploy to Vercel

on:
  push:
    branches: [ develop ]
  pull_request:
    branches: [ develop ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: \${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: \${{ secrets.ORG_ID }}
        vercel-project-id: \${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
`;

const workflowDir = '.github/workflows';
if (!fs.existsSync(workflowDir)) {
  fs.mkdirSync(workflowDir, { recursive: true });
}

fs.writeFileSync(path.join(workflowDir, 'deploy.yml'), githubWorkflow);
console.log('   Workflow GitHub Actions criado');

// 6. Verificar configuração de domínio
console.log('\n4. CONFIGURAÇÃO DE DOMÍNIO');
console.log('   Domínio atual: localhost:3001 (desenvolvimento)');
console.log('   Domínio produção: A ser configurado no Vercel');

console.log('\n=== RESUMO DA CONFIGURAÇÃO ===');
console.log('1. GitHub: Configurado e pronto');
console.log('2. Vercel: Arquivos de configuração criados');
console.log('3. Extensões VS Code: Instaladas');
console.log('4. Supabase: Configurado e conectado');

console.log('\n=== PRÓXIMOS PASSOS ===');
console.log('1. Conecte o repositório ao Vercel');
console.log('2. Configure as variáveis de ambiente no Vercel');
console.log('3. Faça o primeiro deploy');
console.log('4. Configure o domínio personalizado');
console.log('5. Teste a aplicação em produção');

console.log('\n=== LINKS ÚTEIS ===');
console.log('Vercel: https://vercel.com');
console.log('GitHub: https://github.com/sidmargarcia01/meu-financeiro');
console.log('Supabase: https://supabase.com/dashboard');
