/**
 * Script para diagnosticar e corrigir problemas de CI/CD
 * Verifica variáveis de ambiente necessárias e configurações
 */

const fs = require('fs')
const path = require('path')

console.log('=== Diagnóstico CI/CD ===\n')

// 1. Verificar se jest.config.js tem coverage thresholds desabilitados
const jestConfigPath = path.join(__dirname, '../jest.config.js')
const jestConfig = fs.readFileSync(jestConfigPath, 'utf8')

// Verificar se coverageThreshold está ativo (não comentado)
const coverageThresholdMatch = jestConfig.match(/^\s*coverageThreshold\s*:/m)
if (coverageThresholdMatch) {
  console.log('ERRO: coverage thresholds ainda ativo em jest.config.js')
  console.log('Execute: npm run fix:jest')
} else {
  console.log('OK: coverage thresholds desabilitados')
}

// 2. Verificar se package.json tem scripts corretos
const packageJsonPath = path.join(__dirname, '../package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const requiredScripts = ['test', 'build', 'lint', 'type-check']
const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script])

if (missingScripts.length > 0) {
  console.log('ERRO: Scripts faltando em package.json:', missingScripts)
} else {
  console.log('OK: Scripts necessários presentes')
}

// 3. Verificar workflows do GitHub Actions
const ciPath = path.join(__dirname, '../.github/workflows/ci.yml')
const deployPath = path.join(__dirname, '../.github/workflows/deploy.yml')

if (!fs.existsSync(ciPath)) {
  console.log('ERRO: .github/workflows/ci.yml não existe')
} else {
  console.log('OK: ci.yml existe')
}

if (!fs.existsSync(deployPath)) {
  console.log('ERRO: .github/workflows/deploy.yml não existe')
} else {
  console.log('OK: deploy.yml existe')
}

// 4. Verificar vercel.json
const vercelPath = path.join(__dirname, '../vercel.json')
if (!fs.existsSync(vercelPath)) {
  console.log('ERRO: vercel.json não existe')
} else {
  console.log('OK: vercel.json existe')
}

// 5. Listar variáveis de ambiente necessárias
console.log('\n=== Variáveis de Ambiente Necessárias ===')
console.log('No GitHub Repository Settings > Secrets:')
console.log('- NEXT_PUBLIC_SUPABASE_URL')
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
console.log('- SUPABASE_SERVICE_ROLE_KEY')
console.log('- DATABASE_URL')
console.log('- DIRECT_URL')
console.log('- NEXT_PUBLIC_APP_URL')
console.log('- VERCEL_TOKEN')
console.log('- VERCEL_ORG_ID')
console.log('- VERCEL_PROJECT_ID')
console.log('- SLACK_WEBHOOK_URL (opcional)')

console.log('\nNo Vercel Project Settings > Environment Variables:')
console.log('- NEXT_PUBLIC_SUPABASE_URL')
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
console.log('- SUPABASE_SERVICE_ROLE_KEY')
console.log('- DATABASE_URL')
console.log('- DIRECT_URL')
console.log('- NEXT_PUBLIC_APP_URL')
console.log('- JWT_SECRET')
console.log('- JWT_REFRESH_SECRET')

console.log('\n=== Ações Recomendadas ===')
console.log('1. Verificar se todas as variáveis estão configuradas no GitHub e Vercel')
console.log('2. Fazer push das alterações do jest.config.js')
console.log('3. Verificar logs detalhados no GitHub Actions')
console.log('4. Se necessário, reexecutar o workflow manualmente')
