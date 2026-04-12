/**
 * Script para configurar a extensão Supabase no VS Code
 */

const fs = require('fs');
const path = require('path');

console.log('=== Configurando Extensão Supabase ===\n');

// Informações do projeto Supabase
const supabaseConfig = {
  projectId: 'ctjzuolergnrsrijvsjw',
  url: 'https://ctjzuolergnrsrijvsjw.supabase.co',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0anp1b2xlcmducnNyaWp2c2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4NjgzMywiZXhwIjoyMDkwODYyODMzfQ.iOBfh-E_sRVdJv8Vk6iifNxZbz_RYr8Cm4iU8aizr3c'
};

console.log('1. INFORMAÇÕES DO PROJETO SUPABASE:');
console.log(`   Project ID: ${supabaseConfig.projectId}`);
console.log(`   URL: ${supabaseConfig.url}`);
console.log(`   Service Key: ${supabaseConfig.serviceKey.substring(0, 50)}...`);

console.log('\n2. INSTALANDO EXTENSÃO SUPABASE...');
console.log('Execute no terminal VS Code:');
console.log('Ctrl+Shift+P > "Extensions: Install Extensions"');
console.log('Procure por: "Supabase"');
console.log('Instale a extensão oficial: "Supabase"');

console.log('\n3. CONECTANDO O PROJETO:');
console.log('Passos para conectar:');
console.log('a) Ctrl+Shift+P > "Supabase: Link Project"');
console.log('b) Cole a URL do projeto:');
console.log(`   ${supabaseConfig.url}`);
console.log('c) Cole a Service Role Key:');
console.log(`   ${supabaseConfig.serviceKey}`);
console.log('d) Selecione o diretório do projeto');

console.log('\n4. VERIFICANDO CONEXÃO:');
console.log('Após conectar, verifique se:');
console.log('- Ícone do Supabase aparece no sidebar');
console.log('- Database > Tables mostra as tabelas');
console.log('- Authentication > Users mostra usuários');

console.log('\n5. CONFIGURANDO AUTENTICAÇÃO:');
console.log('No painel Supabase > Authentication > Settings:');
console.log('- Site URL: http://localhost:3001');
console.log('- Redirect URLs: http://localhost:3001/auth/callback');
console.log('- Email templates: Configure conforme necessário');

console.log('\n6. CONFIGURANDO RLS (ROW LEVEL SECURITY):');
console.log('Execute no SQL Editor do Supabase:');
console.log(`
-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Criar policies
CREATE POLICY "Users can view their own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- Repetir para outras tabelas...
`);

console.log('\n7. TESTANDO A CONEXÃO:');
console.log('Execute: node scripts/test-db-connection.js');

// Criar arquivo de configuração do VS Code
const vscodeConfig = {
  "supabase.projectId": supabaseConfig.projectId,
  "supabase.db.url": supabaseConfig.url,
  "supabase.db.serviceKey": supabaseConfig.serviceKey,
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
};

console.log('\n8. CONFIGURAÇÃO VS CODE:');
console.log('Adicione ao seu settings.json:');
console.log(JSON.stringify(vscodeConfig, null, 2));

// Criar arquivo .vscode/settings.json se não existir
const vscodeDir = '.vscode';
const settingsFile = path.join(vscodeDir, 'settings.json');

if (!fs.existsSync(vscodeDir)) {
  fs.mkdirSync(vscodeDir);
}

if (!fs.existsSync(settingsFile)) {
  fs.writeFileSync(settingsFile, JSON.stringify(vscodeConfig, null, 2));
  console.log('\nArquivo .vscode/settings.json criado!');
} else {
  console.log('\nArquivo .vscode/settings.json já existe. Verifique as configurações.');
}

console.log('\n=== PRÓXIMOS PASSOS ===');
console.log('1. Instale a extensão Supabase no VS Code');
console.log('2. Conecte o projeto usando as informações acima');
console.log('3. Configure autenticação no painel Supabase');
console.log('4. Habilite RLS policies');
console.log('5. Teste a aplicação');
