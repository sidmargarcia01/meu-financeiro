/**
 * Script para testar conexão com o banco de dados Supabase
 */

const { createClient } = require('@supabase/supabase-js');

async function testDatabaseConnection() {
  console.log('=== Testando Conexão com Banco de Dados ===\n');
  
  const supabaseUrl = 'https://ctjzuolergnrsrijvsjw.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0anp1b2xlcmducnNyaWp2c2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4NjgzMywiZXhwIjoyMDkwODYyODMzfQ.iOBfh-E_sRVdJv8Vk6iifNxZbz_RYr8Cm4iU8aizr3c';
  
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 50) + '...');
  
  try {
    console.log('\nTestando conexão com Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Testar consulta simples
    console.log('Executando consulta de teste...');
    const { data, error } = await supabase
      .from('pg_stat_activity')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('ERRO na consulta:', error.message);
      
      // Tentar verificar se a tabela users existe
      console.log('\nVerificando se tabela users existe...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (userError) {
        console.log('ERRO na tabela users:', userError.message);
        
        if (userError.message.includes('relation') && userError.message.includes('does not exist')) {
          console.log('\nSOLUÇÃO: As tabelas não existem. Execute as migrações do Prisma.');
          console.log('Tente: npx prisma db push --force-reset');
        }
      } else {
        console.log('Tabela users: OK');
      }
    } else {
      console.log('Conexão com banco: OK');
      console.log('Dados:', data);
    }
    
    // Testar criação de tabela simples
    console.log('\nTestando criação de tabela...');
    const { data: createData, error: createError } = await supabase
      .rpc('create_table_if_not_exists', {
        table_name: 'test_connection',
        table_definition: `
          CREATE TABLE test_connection (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      });
    
    if (createError) {
      console.log('ERRO na criação:', createError.message);
    } else {
      console.log('Criação de tabela: OK');
    }
    
  } catch (error) {
    console.log('ERRO geral:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\nSOLUÇÃO POSSÍVEL:');
      console.log('1. Verifique sua conexão com a internet');
      console.log('2. Verifique se o projeto Supabase está ativo');
      console.log('3. Tente usar a URL direta em vez do pooler');
    }
  }
}

testDatabaseConnection().catch(console.error);
