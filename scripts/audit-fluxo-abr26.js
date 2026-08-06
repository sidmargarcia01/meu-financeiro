/**
 * Script de auditoria: compara dados do fluxo gerencial com transações reais ABR/26
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function audit() {
  // 1. Buscar todas as transações CONFIRMADO/CONCILIADO em ABR/26 por due_date
  const { data: txs, error } = await supabase
    .from('transactions')
    .select('id, description, amount, type, status, due_date, competence_date, payment_date, category_id')
    .in('status', ['CONFIRMADO', 'CONCILIADO'])
    .in('type', ['RECEITA', 'DESPESA'])
    .gte('due_date', '2026-04-01')
    .lte('due_date', '2026-04-30')
    .order('due_date')

  if (error) { console.error('Erro:', error); return }

  console.log(`\n=== TRANSAÇÕES ABR/26 (due_date) ===`)
  console.log(`Total: ${txs.length}`)

  let recTotal = 0, despTotal = 0
  for (const t of txs) {
    const v = Math.abs(Number(t.amount))
    if (t.type === 'RECEITA') recTotal += v
    else despTotal += v
    console.log(`  ${t.due_date} | ${t.type.padEnd(8)} | ${t.status.padEnd(10)} | ${String(t.amount).padStart(12)} | ${t.description}`)
  }
  console.log(`\nReceitas (abs): R$ ${recTotal.toFixed(2)}`)
  console.log(`Despesas (abs): R$ ${despTotal.toFixed(2)}`)
  console.log(`Resultado:      R$ ${(recTotal - despTotal).toFixed(2)}`)

  // 2. Buscar categorias para verificar dre_group
  const catIds = [...new Set(txs.map(t => t.category_id).filter(Boolean))]
  if (catIds.length > 0) {
    const { data: cats } = await supabase
      .from('categories')
      .select('id, name, dre_group, parent_id')
      .in('id', catIds)
    console.log(`\n=== CATEGORIAS COM DRE_GROUP ===`)
    for (const c of (cats || [])) {
      console.log(`  ${c.name} => dre_group: ${c.dre_group || 'NULL'} | parent: ${c.parent_id || 'NULL'}`)
    }
    const semDre = (cats || []).filter(c => !c.dre_group)
    console.log(`\nCategorias SEM dre_group: ${semDre.length}`)
    const comDre = (cats || []).filter(c => c.dre_group)
    console.log(`Categorias COM dre_group: ${comDre.length}`)
  }

  // 3. Verificar saldo via sumConfirmedBefore
  const { data: allBefore } = await supabase
    .from('transactions')
    .select('amount, type')
    .in('status', ['CONFIRMADO', 'CONCILIADO'])
    .lt('due_date', '2026-05-01')

  const saldoFimAbr = (allBefore || []).reduce((s, t) => s + Number(t.amount), 0)
  console.log(`\n=== SALDOS ===`)
  console.log(`Saldo acumulado até fim ABR/26: R$ ${saldoFimAbr.toFixed(2)}`)

  const { data: allBeforeAbr } = await supabase
    .from('transactions')
    .select('amount, type')
    .in('status', ['CONFIRMADO', 'CONCILIADO'])
    .lt('due_date', '2026-04-01')

  const saldoInicioAbr = (allBeforeAbr || []).reduce((s, t) => s + Number(t.amount), 0)
  console.log(`Saldo acumulado até inicio ABR/26: R$ ${saldoInicioAbr.toFixed(2)}`)

  // 4. Verificar se tem receitas sem categoria que inflam os valores
  const semCat = txs.filter(t => !t.category_id)
  console.log(`\n=== TRANSAÇÕES SEM CATEGORIA ===`)
  console.log(`Total sem categoria: ${semCat.length}`)
  let recSemCat = 0, despSemCat = 0
  for (const t of semCat) {
    const v = Math.abs(Number(t.amount))
    if (t.type === 'RECEITA') recSemCat += v
    else despSemCat += v
  }
  console.log(`Receitas sem cat (abs): R$ ${recSemCat.toFixed(2)}`)
  console.log(`Despesas sem cat (abs): R$ ${despSemCat.toFixed(2)}`)
}

audit().catch(console.error)
