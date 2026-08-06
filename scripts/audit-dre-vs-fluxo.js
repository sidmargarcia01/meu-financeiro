require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  // 1. Buscar categorias pai com dre_group
  const { data: allCats } = await s.from('categories').select('id, name, parent_id, dre_group, type')
  const parentCats = (allCats || []).filter(c => !c.parent_id)
  const subCats = (allCats || []).filter(c => c.parent_id)

  console.log('=== CATEGORIAS PAI COM DRE_GROUP ===')
  for (const c of parentCats.filter(c => c.dre_group)) {
    const subs = subCats.filter(sc => sc.parent_id === c.id)
    console.log(`  ${c.name} → ${c.dre_group} (${subs.length} filhas)`)
    for (const sc of subs) {
      console.log(`    ↳ ${sc.name} (dre_group próprio: ${sc.dre_group || 'NULL'})`)
    }
  }

  // 2. Buscar transações ABR/26 (mesmo período dos screenshots)
  const { data: txs } = await s.from('transactions')
    .select('id, description, amount, type, status, due_date, category_id')
    .in('type', ['RECEITA', 'DESPESA'])
    .in('status', ['CONFIRMADO', 'CONCILIADO'])
    .gte('due_date', '2026-04-01')
    .lte('due_date', '2026-04-30')

  const catMap = new Map((allCats || []).map(c => [c.id, c]))

  // 3. Simular classificação como DRE faz (usa parent dre_group)
  const dreBuckets = { custos: 0, variaveis: 0, fixas: 0, investimentos: 0, recOp: 0, recNaoOp: 0, despNaoOp: 0 }
  // 4. Simular classificação como Fluxo Gerencial faz (usa cat.dre_group direto)
  const fluxoBuckets = { custos: 0, variaveis: 0, fixas: 0, investimentos: 0, recOp: 0, semCat: 0 }

  for (const tx of (txs || [])) {
    const cat = catMap.get(tx.category_id)
    const valor = Math.abs(Number(tx.amount))
    const isReceita = tx.type === 'RECEITA'

    // Resolve parent dre_group (como DRE faz)
    let resolvedDreGroup = null
    if (cat) {
      if (cat.parent_id) {
        const parent = catMap.get(cat.parent_id)
        resolvedDreGroup = parent?.dre_group || null
      } else {
        resolvedDreGroup = cat.dre_group || null
      }
    }

    // Direct dre_group (como Fluxo faz)
    const directDreGroup = cat?.dre_group || null

    // Classificação DRE
    if (isReceita) {
      if (resolvedDreGroup === 'RECEITAS_OPERACIONAIS' || !resolvedDreGroup) dreBuckets.recOp += valor
      else if (resolvedDreGroup === 'RECEITAS_NAO_OPERACIONAIS') dreBuckets.recNaoOp += valor
    } else {
      switch (resolvedDreGroup) {
        case 'CUSTOS_OPERACIONAIS': dreBuckets.custos += valor; break
        case 'DESPESAS_VARIAVEIS': dreBuckets.variaveis += valor; break
        case 'DESPESAS_FIXAS': dreBuckets.fixas += valor; break
        case 'INVESTIMENTOS': dreBuckets.investimentos += valor; break
        case 'DESPESAS_NAO_OPERACIONAIS': dreBuckets.despNaoOp += valor; break
        default: dreBuckets.variaveis += valor; break // fallback
      }
    }

    // Classificação Fluxo (bug: usa directDreGroup ao invés de resolvedDreGroup)
    if (isReceita) {
      fluxoBuckets.recOp += valor
    } else {
      if (directDreGroup) {
        switch (directDreGroup) {
          case 'CUSTOS_OPERACIONAIS': fluxoBuckets.custos += valor; break
          case 'DESPESAS_VARIAVEIS': fluxoBuckets.variaveis += valor; break
          case 'DESPESAS_FIXAS': fluxoBuckets.fixas += valor; break
          case 'INVESTIMENTOS': fluxoBuckets.investimentos += valor; break
          default: fluxoBuckets.semCat += valor
        }
      } else {
        // sem dre_group: cai no fallback ou sem categoria
        fluxoBuckets.semCat += valor
      }
    }
  }

  console.log('\n=== COMPARATIVO ABR/26 ===')
  console.log('           DRE (correto)      FLUXO (com bug)')
  console.log(`Receita:   R$ ${dreBuckets.recOp.toFixed(2).padStart(10)}   R$ ${fluxoBuckets.recOp.toFixed(2).padStart(10)}`)
  console.log(`Custos Op: R$ ${dreBuckets.custos.toFixed(2).padStart(10)}   R$ ${fluxoBuckets.custos.toFixed(2).padStart(10)}`)
  console.log(`Desp Var:  R$ ${dreBuckets.variaveis.toFixed(2).padStart(10)}   R$ ${fluxoBuckets.variaveis.toFixed(2).padStart(10)}`)
  console.log(`Desp Fix:  R$ ${dreBuckets.fixas.toFixed(2).padStart(10)}   R$ ${fluxoBuckets.fixas.toFixed(2).padStart(10)}`)
  console.log(`Invest:    R$ ${dreBuckets.investimentos.toFixed(2).padStart(10)}   R$ ${fluxoBuckets.investimentos.toFixed(2).padStart(10)}`)
  console.log(`Sem Cat:   ---                R$ ${fluxoBuckets.semCat.toFixed(2).padStart(10)}`)

  // Contar quantas tx de subcategorias cujo parent tem dre_group
  let subsSemResolucao = 0
  let subsComDreGroupNoParent = 0
  for (const tx of (txs || [])) {
    const cat = catMap.get(tx.category_id)
    if (cat?.parent_id) {
      const parent = catMap.get(cat.parent_id)
      if (parent?.dre_group) {
        subsComDreGroupNoParent++
        if (!cat.dre_group) subsSemResolucao++
      }
    }
  }
  console.log(`\n=== SUBCATEGORIAS COM PARENT DRE_GROUP ===`)
  console.log(`Total subcats com parent.dre_group: ${subsComDreGroupNoParent}`)
  console.log(`Destas, sem dre_group próprio: ${subsSemResolucao} ← BUG: Fluxo não herda do pai`)
}
run().catch(console.error)
