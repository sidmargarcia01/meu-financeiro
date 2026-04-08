/**
 * Script para debugar problemas das APIs
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function debugSupabaseConnection() {
  console.log('=== Debug da Conexão Supabase ===\n');
  
  // Verificar variáveis de ambiente
  console.log('Variáveis de Ambiente:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'FALTANDO');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'FALTANDO');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'OK' : 'FALTANDO');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\nERRO: Configure as variáveis do Supabase no .env.local');
    return;
  }
  
  try {
    // Testar conexão com Supabase
    console.log('\nTestando conexão com Supabase...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Verificar se a tabela categories existe
    console.log('Verificando tabela categories...');
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('ERRO na tabela categories:', error.message);
      console.log('Possível solução: Execute as migrações do Prisma');
      console.log('Comando: npm run prisma:push');
    } else {
      console.log('Tabela categories: OK');
    }
    
    // Testar inserção simples
    console.log('\nTestando inserção simples...');
    const testUserId = 'test-user-id';
    const { data: insertData, error: insertError } = await supabase
      .from('categories')
      .insert({
        name: 'Teste Debug',
        type: 'DESPESA',
        user_id: testUserId
      })
      .select()
      .single();
    
    if (insertError) {
      console.log('ERRO na inserção:', insertError.message);
    } else {
      console.log('Inserção teste: OK');
      console.log('Dados inseridos:', insertData);
      
      // Limpar dados de teste
      await supabase
        .from('categories')
        .delete()
        .eq('id', insertData.id);
    }
    
  } catch (error) {
    console.log('ERRO geral:', error.message);
  }
}

debugSupabaseConnection().catch(console.error);
