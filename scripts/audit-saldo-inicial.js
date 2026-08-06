require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data: accounts } = await s.from('accounts').select('id, name, type, initial_balance, initial_balance_date, is_active')
  console.log('=== CONTAS ===')
  let totalInitial = 0
  for (const a of (accounts || [])) {
    console.log(`${a.name.padEnd(25)} saldo: ${String(a.initial_balance).padEnd(12)} data: ${a.initial_balance_date || 'NULL'} ativa: ${a.is_active}`)
    if (a.is_active) totalInitial += Number(a.initial_balance)
  }
  console.log(`\nTotal saldo inicial (contas ativas): R$ ${totalInitial.toFixed(2)}`)

  // Somar transações antes de ABR/26
  const { data: txBefore } = await s.from('transactions').select('amount').in('status', ['CONFIRMADO', 'CONCILIADO']).lt('due_date', '2026-04-01')
  const sumBefore = (txBefore || []).reduce((s, t) => s + Number(t.amount), 0)
  console.log(`\nSoma transações confirmadas antes de 01/04/2026: R$ ${sumBefore.toFixed(2)}`)
  console.log(`Saldo real esperado em 01/04/2026: R$ ${(totalInitial + sumBefore).toFixed(2)}`)

  // Verificar contas com initial_balance_date antes de 01/04/2026
  const contasAntesAbr = (accounts || []).filter(a => a.is_active && a.initial_balance_date && a.initial_balance_date < '2026-04-01')
  console.log(`\nContas com saldo inicial antes de ABR/26: ${contasAntesAbr.length}`)
  for (const a of contasAntesAbr) {
    console.log(`  ${a.name}: R$ ${a.initial_balance} (data: ${a.initial_balance_date})`)
  }
}
run().catch(console.error)
