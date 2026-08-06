require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  // Buscar transações JUL/26
  const { data: txs } = await s.from('transactions')
    .select('id, description, amount, type, status, due_date, category_id, account_id')
    .gte('due_date', '2026-07-01')
    .lte('due_date', '2026-07-31')
    .not('type', 'eq', 'TRANSFERENCIA')
    .order('due_date')

  const all = (txs || []).filter(t => {
    const desc = (t.description || '').toLowerCase()
    if (desc.startsWith('transfer') && (desc.includes(' para ') || desc.includes(' de '))) return false
    return true
  })

  // Separar por tipo e status
  const receitas = all.filter(t => t.type === 'RECEITA')
  const despesas = all.filter(t => t.type === 'DESPESA')

  // Calcular totais (Math.abs como a página faz)
  const totalR = receitas.reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  const totalD = despesas.reduce((s, t) => s + Math.abs(Number(t.amount)), 0)

  console.log('=== TOTAIS JUL/26 (todos os status) ===')
  console.log(`Receitas: R$ ${totalR.toFixed(2)} (${receitas.length} tx)`)
  console.log(`Despesas: R$ ${totalD.toFixed(2)} (${despesas.length} tx)`)
  console.log(`Saldo:    R$ ${(totalR - totalD).toFixed(2)}`)

  // Verificar por status
  const statuses = ['PENDENTE', 'AGENDADO', 'CONFIRMADO', 'CONCILIADO']
  console.log('\n=== DETALHAMENTO POR STATUS ===')
  for (const st of statuses) {
    const recSt = receitas.filter(t => t.status === st)
    const despSt = despesas.filter(t => t.status === st)
    const rVal = recSt.reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
    const dVal = despSt.reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
    if (recSt.length + despSt.length > 0) {
      console.log(`  ${st}: Receitas R$ ${rVal.toFixed(2)} (${recSt.length}) | Despesas R$ ${dVal.toFixed(2)} (${despSt.length})`)
    }
  }

  // Totais apenas CONFIRMADO + CONCILIADO
  const recConf = receitas.filter(t => ['CONFIRMADO', 'CONCILIADO'].includes(t.status))
  const despConf = despesas.filter(t => ['CONFIRMADO', 'CONCILIADO'].includes(t.status))
  const totalRConf = recConf.reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  const totalDConf = despConf.reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  console.log(`\n=== TOTAIS SÓ CONFIRMADO+CONCILIADO ===`)
  console.log(`Receitas: R$ ${totalRConf.toFixed(2)} (${recConf.length} tx)`)
  console.log(`Despesas: R$ ${totalDConf.toFixed(2)} (${despConf.length} tx)`)
  console.log(`Saldo:    R$ ${(totalRConf - totalDConf).toFixed(2)}`)

  // Verificar inconsistências de sinal
  const badSign = all.filter(t => {
    const amt = Number(t.amount)
    return (t.type === 'RECEITA' && amt < 0) || (t.type === 'DESPESA' && amt > 0)
  })
  console.log(`\n=== SINAL INCONSISTENTE EM JUL/26 ===`)
  console.log(`Total: ${badSign.length}`)
  for (const t of badSign) {
    console.log(`  ${t.due_date} | ${t.type} | amount=${t.amount} | "${t.description}"`)
  }

  // Verificar taxas de cartão
  const { data: cats } = await s.from('categories').select('id, name')
  const catMap = new Map((cats || []).map(c => [c.id, c.name]))
  
  console.log('\n=== TAXAS DE CARTÃO (categoria) ===')
  const taxas = despesas.filter(t => {
    const catName = catMap.get(t.category_id)
    return catName && catName.toLowerCase().includes('taxa')
  })
  let taxaTotal = 0
  for (const t of taxas) {
    const v = Math.abs(Number(t.amount))
    taxaTotal += v
    console.log(`  ${t.due_date} | R$ ${v.toFixed(2)} | ${t.status} | "${t.description}" | cat: ${catMap.get(t.category_id)}`)
  }
  console.log(`Total taxas: R$ ${taxaTotal.toFixed(2)} (${taxas.length} tx)`)
  console.log(`% do total despesas: ${((taxaTotal / totalD) * 100).toFixed(1)}%`)

  // Verificar transferências que passam no filtro
  console.log('\n=== TRANSFERÊNCIAS NÃO FILTRADAS ===')
  const transfers = (txs || []).filter(t => {
    const desc = (t.description || '').toLowerCase()
    return desc.includes('transfer') && !t.type.includes('TRANSFERENCIA')
  })
  for (const t of transfers) {
    console.log(`  ${t.due_date} | ${t.type} | amount=${t.amount} | "${t.description}"`)
  }
  console.log(`Total: ${transfers.length}`)
}
run().catch(console.error)
