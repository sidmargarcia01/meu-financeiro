/**
 * Script para corrigir a conexão do Prisma com Supabase
 */

const fs = require('fs');
const path = require('path');

console.log('=== Corrigindo Conexão Prisma-Supabase ===\n');

// URL direta do banco (não pooler) - formato mais confiável
const directDatabaseUrl = 'postgresql://postgres:e86aba519ed070448381ea41c2788fc3a98f39a4bc4e803290f9694b11ed096f@aws-0-sa-east-1.pooler.supabase.co:5432/postgres';

console.log('URL do banco (direta):', directDatabaseUrl.substring(0, 50) + '...');

// Ler o schema.prisma atual
const schemaPath = './prisma/schema.prisma';
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

console.log('Schema Prisma atual encontrado');

// Criar um schema temporário com URL hardcoded
const tempSchemaPath = './prisma/schema-temp.prisma';
const tempSchemaContent = schemaContent.replace(
  'url      = env("DATABASE_URL")',
  `url      = "${directDatabaseUrl}"`
);

fs.writeFileSync(tempSchemaPath, tempSchemaContent);
console.log('Schema temporário criado:', tempSchemaPath);

// Agora tentar executar o prisma push com o schema temporário
console.log('\nExecutando prisma db push com schema temporário...');

const { execSync } = require('child_process');

try {
  const output = execSync('npx prisma db push --schema=./prisma/schema-temp.prisma', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('Saída do Prisma:');
  console.log(output);
  
  // Se funcionou, restaurar o schema original
  console.log('\nRestaurando schema original...');
  fs.unlinkSync(tempSchemaPath);
  
  console.log('\n=== SUCESSO! ===');
  console.log('Tabelas criadas com sucesso!');
  console.log('Agora execute: npm run dev');
  
} catch (error) {
  console.log('ERRO ao executar prisma db push:');
  console.log(error.stdout || error.message);
  
  // Tentar abordagem alternativa - criar tabelas manualmente via SQL
  console.log('\n=== Tentando Abordagem Alternativa ===');
  console.log('Criando tabelas manualmente via Supabase...');
  
  require('dotenv').config({ path: '.env.local' });
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    'https://ctjzuolergnrsrijvsjw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0anp1b2xlcmducnNyaWp2c2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4NjgzMywiZXhwIjoyMDkwODYyODMzfQ.iOBfh-E_sRVdJv8Vk6iifNxZbz_RYr8Cm4iU8aizr3c'
  );
  
  // SQL para criar as tabelas principais
  const createTablesSQL = `
    -- Categorias
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('RECEITA', 'DESPESA')),
      parent_id TEXT REFERENCES categories(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Cost Centers
    CREATE TABLE IF NOT EXISTS cost_centers (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Projects
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Tags
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      color TEXT,
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Contacts
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Payment Methods
    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'PIX', 'OTHER')),
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  
  console.log('Execute manualmente no painel Supabase > SQL Editor:');
  console.log(createTablesSQL);
  
  // Limpar arquivo temporário
  if (fs.existsSync(tempSchemaPath)) {
    fs.unlinkSync(tempSchemaPath);
  }
}
