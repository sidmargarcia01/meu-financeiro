/**
 * 📄 Endpoint de Diagnóstico do Banco de Dados
 * 🧱 Verifica conexão e tabelas do Supabase
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  // Test 1: Conexão básica
  try {
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('count')
      .single()
    
    results.tests.plans_table = plansError ? 
      { status: 'error', error: plansError.message } : 
      { status: 'ok', count: plans }
  } catch (e: any) {
    results.tests.plans_table = { status: 'error', error: e.message }
  }

  // Test 2: Tabela users
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .single()
    
    results.tests.users_table = usersError ? 
      { status: 'error', error: usersError.message } : 
      { status: 'ok', count: users }
  } catch (e: any) {
    results.tests.users_table = { status: 'error', error: e.message }
  }

  // Test 3: Verificar trigger
  try {
    const { data: trigger, error: triggerError } = await supabase
      .rpc('check_trigger_exists')
    
    results.tests.trigger = triggerError ? 
      { status: 'error', error: triggerError.message } : 
      { status: 'ok', exists: trigger }
  } catch (e: any) {
    results.tests.trigger = { status: 'error', error: e.message, note: 'Function may not exist' }
  }

  // Test 4: Tentar inserir usuário de teste (rollback)
  try {
    const testId = 'test-' + Date.now()
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: testId,
        email: `test${Date.now()}@example.com`,
        name: 'Test User',
        plan_id: 'default'
      })
    
    if (insertError) {
      results.tests.insert_user = { status: 'error', error: insertError.message }
    } else {
      // Remover usuário de teste
      await supabase.from('users').delete().eq('id', testId)
      results.tests.insert_user = { status: 'ok', message: 'Insert and delete successful' }
    }
  } catch (e: any) {
    results.tests.insert_user = { status: 'error', error: e.message }
  }

  return NextResponse.json(results)
}
