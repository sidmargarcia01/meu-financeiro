/**
 * 📄 Endpoint de teste para diagnosticar admin client
 */

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const admin = getSupabaseAdmin()
    
    // Testar conexão
    const { data: plans, error: plansError } = await admin
      .from('plans')
      .select('*')
      .limit(1)
    
    if (plansError) {
      return NextResponse.json({ 
        status: 'error', 
        step: 'fetch_plans',
        error: plansError.message 
      }, { status: 500 })
    }
    
    // Testar inserção (com rollback)
    const testId = 'test-' + Date.now()
    const { error: insertError } = await admin
      .from('users')
      .insert({
        id: testId,
        email: `test${Date.now()}@test.com`,
        name: 'Test User',
        plan_id: 'default'
      })
    
    if (insertError) {
      return NextResponse.json({ 
        status: 'error', 
        step: 'insert_user',
        error: insertError.message,
        details: insertError
      }, { status: 500 })
    }
    
    // Limpar teste
    await admin.from('users').delete().eq('id', testId)
    
    return NextResponse.json({ 
      status: 'ok',
      message: 'Admin client working correctly'
    })
    
  } catch (err: any) {
    return NextResponse.json({ 
      status: 'error', 
      step: 'init_admin',
      error: err.message 
    }, { status: 500 })
  }
}
