require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  // 1. Buscar TODAS as transações confirmadas/conciliadas
  const { data: txs } = await s.from('transactions')
    .select('id, description, amount, type, status, due_date, account_id')
    .in('status', ['CONFIRMADO', 'CONCILIADO'])
    .in('type', ['RECEITA', 'DESPESA'])
    .order('due_date')

  // 2. Verificar inconsistência de sinal vs tipo
  console.log('=== TRANSAÇÕES COM SINAL INCONSISTENTE ===')
  let inconsistentes = 0
  for (const t of (txs || [])) {
    const amount = Number(t.amount)
    const signOk = (t.type === 'RECEITA' && amount >= 0) || (t.type === 'DESPESA' && amount <= 0)
    if (!signOk) {
      inconsistentes++
      console.log(`  [${t.due_date}] ${t.type} amount=${t.amount} "${t.description}"`)
    }
  }
  console.log(`Total inconsistentes: ${inconsistentes}\n`)

  // 3. Calcular saldo com sumConfirmedBefore (soma direta) vs soma normalizada (como Lançamentos faz)
  const dates = ['2026-06-01', '2026-07-01', '2026-08-01']
  
  for (const date of dates) {
    const before = (txs || []).filter(t => t.due_date < date)
    
    // Método sumConfirmedBefore (soma amount diretamente)
    const sumDirect = before.reduce((s, t) => s + Number(t.amount), 0)
    
    // Método normalizado (como listWithBalances faz)
    const sumNormalized = before.reduce((s, t) => {
      const abs = Math.abs(Number(t.amount))
      return s + (t.type === 'RECEITA' ? abs : -abs)
    }, 0)
    
    console.log(`--- Antes de ${date} ---`)
    console.log(`  sumDirect (sumConfirmedBefore): ${sumDirect.toFixed(2)}`)
    console.log(`  sumNormalized (listWithBalances): ${sumNormalized.toFixed(2)}`)
    console.log(`  Diferença: ${(sumDirect - sumNormalized).toFixed(2)}`)
    console.log(`  + initialBalance (6679.03): Direct=${(sumDirect + 6679.03).toFixed(2)} | Normal=${(sumNormalized + 6679.03).toFixed(2)}`)
    console.log()
  }

  // 4. Listar transações com sinal invertido para cada período
  console.log('=== DETALHES DOS INCONSISTENTES POR PERÍODO ===')
  for (const date of dates) {
    const before = (txs || []).filter(t => t.due_date < date)
    const inconsB = before.filter(t => {
      const amount = Number(t.amount)
      return (t.type === 'RECEITA' && amount < 0) || (t.type === 'DESPESA' && amount > 0)
    })
    if (inconsB.length > 0) {
      console.log(`\nAntes de ${date} (${inconsB.length} inconsistentes):`)
      for (const t of inconsB) {
        const diff = Number(t.amount) - (t.type === 'RECEITA' ? Math.abs(Number(t.amount)) : -Math.abs(Number(t.amount)))
        console.log(`  ${t.due_date} | ${t.type} | amount=${t.amount} | impacto_diff=${diff.toFixed(2)} | "${t.description}"`)
      }
    }
  }
}
run().catch(console.error)
