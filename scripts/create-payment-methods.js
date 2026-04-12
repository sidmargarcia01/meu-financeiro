/**
 * Script para criar a tabela payment_methods no Supabase
 * Usa conexão direta via pg (host db.*.supabase.co)
 */
require('dotenv').config({ path: '.env.local' })

async function createTable() {
  const sql = [
    'CREATE TABLE IF NOT EXISTS payment_methods (',
    '  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,',
    '  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,',
    '  name TEXT NOT NULL,',
    '  type TEXT NOT NULL,',
    '  created_at TIMESTAMPTZ DEFAULT now()',
    ');',
    'CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);'
  ].join('\n')

  // Extrair senha da DATABASE_URL
  const raw = process.env.DATABASE_URL || ''
  const match = raw.match(/postgres:([^@]+)@/)
  const password = match ? match[1] : ''

  // Tentar conexão direta ao Supabase
  try {
    const pg = require('pg')
    const client = new pg.Client({
      host: 'db.ctjzuolergnrsrijvsjw.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: password,
      ssl: { rejectUnauthorized: false }
    })
    await client.connect()
    await client.query(sql)
    console.log('Tabela payment_methods criada com sucesso!')
    await client.end()
    return
  } catch (e) {
    console.log('Conexao direta falhou:', e.message)
  }

  // Tentar via pooler
  try {
    const pg = require('pg')
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
    await client.connect()
    await client.query(sql)
    console.log('Tabela payment_methods criada via pooler!')
    await client.end()
    return
  } catch (e) {
    console.log('Pooler falhou:', e.message)
  }

  console.log('\nExecute o SQL manualmente no Supabase SQL Editor:')
  console.log(sql)
}

createTable()
