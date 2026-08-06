require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data: allCats } = await s.from('categories').select('id, name, parent_id, dre_group, type')
  const catMap = new Map((allCats || []).map(c => [c.id, c]))

  // Buscar transações ABR/26
  const { data: txs } = await s.from('transactions')
    .select('id, description, amount, type, status, due_date, category_id')
    .in('type', ['RECEITA', 'DESPESA'])
    .in('status', ['CONFIRMADO', 'CONCILIADO'])
    .gte('due_date', '2026-04-01')
    .lte('due_date', '2026-04-30')

  // Identificar transações sem dre_group
  console.log('=== TX SEM DRE_GROUP EM ABR/26 ===')
  let totalSemDreGroup = 0
  const catSemDreGroup = new Map()
  
  for (const tx of (txs || [])) {
    const cat = catMap.get(tx.category_id)
    const dreGroup = cat?.dre_group || null

    if (!dreGroup) {
      totalSemDreGroup += Math.abs(Number(tx.amount))
      const catName = cat?.name || 'SEM CATEGORIA'
      const key = catName
      if (!catSemDreGroup.has(key)) catSemDreGroup.set(key, { name: catName, total: 0, count: 0, type: tx.type, parentId: cat?.parent_id })
      catSemDreGroup.get(key).total += Math.abs(Number(tx.amount))
      catSemDreGroup.get(key).count++
    }
  }

  console.log(`Total sem dre_group: R$ ${totalSemDreGroup.toFixed(2)}`)
  console.log('\nPor categoria:')
  for (const [, v] of [...catSemDreGroup.entries()].sort((a, b) => b[1].total - a[1].total)) {
    const parent = v.parentId ? catMap.get(v.parentId) : null
    console.log(`  ${v.name} (${v.type}) | R$ ${v.total.toFixed(2)} (${v.count}tx) | parent: ${parent?.name || 'NENHUM'} | parent.dre_group: ${parent?.dre_group || 'NULL'}`)
  }

  // Agora simular EXATAMENTE como fluxoGerencialService classifica com usarDreGroup=true
  console.log('\n=== SIMULANDO FLUXO GERENCIAL (usarDreGroup=true) ===')
  const bucket = { receitaFaturamento: 0, custosOp: 0, despVar: 0, despFix: 0, invest: 0, recNaoOp: 0, despNaoOp: 0, impLucro: 0, distLucros: 0, recSemCat: 0, despSemCat: 0 }

  for (const tx of (txs || [])) {
    const cat = catMap.get(tx.category_id)
    const valor = Math.abs(Number(tx.amount))
    const ehReceita = tx.type === 'RECEITA'
    const dreGroup = cat?.dre_group || null  // ← como Fluxo faz (direto do cat)

    switch (dreGroup) {
      case 'RECEITAS_OPERACIONAIS': bucket.receitaFaturamento += valor; break
      case 'IMPOSTOS_FATURAMENTO': break // ignorado no fluxo
      case 'CUSTOS_OPERACIONAIS': bucket.custosOp += valor; break
      case 'DESPESAS_VARIAVEIS': bucket.despVar += valor; break
      case 'DESPESAS_FIXAS': bucket.despFix += valor; break
      case 'INVESTIMENTOS': bucket.invest += valor; break
      case 'RECEITAS_NAO_OPERACIONAIS': bucket.recNaoOp += valor; break
      case 'DESPESAS_NAO_OPERACIONAIS': bucket.despNaoOp += valor; break
      case 'IMPOSTOS_LUCRO': bucket.impLucro += valor; break
      case 'DISTRIBUICAO_LUCROS': bucket.distLucros += valor; break
      default:
        if (ehReceita) bucket.recSemCat += valor
        else bucket.despSemCat += valor
    }
  }

  console.log(`Receita/Faturamento:    R$ ${bucket.receitaFaturamento.toFixed(2)}`)
  console.log(`Custos Operacionais:    R$ ${bucket.custosOp.toFixed(2)}`)
  console.log(`Despesas Variáveis:     R$ ${bucket.despVar.toFixed(2)}`)
  console.log(`Despesas Fixas:         R$ ${bucket.despFix.toFixed(2)}`)
  console.log(`Investimentos:          R$ ${bucket.invest.toFixed(2)}`)
  console.log(`Receitas Não Op:        R$ ${bucket.recNaoOp.toFixed(2)}`)
  console.log(`Despesas Não Op:        R$ ${bucket.despNaoOp.toFixed(2)}`)
  console.log(`Receitas Sem Categoria: R$ ${bucket.recSemCat.toFixed(2)}`)
  console.log(`Despesas Sem Categoria: R$ ${bucket.despSemCat.toFixed(2)}`)

  // Comparar com DRE (resolvendo parent)
  console.log('\n=== SIMULANDO DRE (resolve parent dre_group) ===')
  const dre = { receitaOp: 0, impostosFat: 0, custosOp: 0, despVar: 0, despFix: 0, invest: 0, recNaoOp: 0, despNaoOp: 0, impLucro: 0, distLucros: 0 }

  for (const tx of (txs || [])) {
    const cat = catMap.get(tx.category_id)
    const valor = Math.abs(Number(tx.amount))
    
    // Resolve dre_group (parent fallback)
    let resolvedGroup = cat?.dre_group || null
    if (!resolvedGroup && cat?.parent_id) {
      const parent = catMap.get(cat.parent_id)
      resolvedGroup = parent?.dre_group || null
    }

    switch (resolvedGroup) {
      case 'RECEITAS_OPERACIONAIS': dre.receitaOp += valor; break
      case 'IMPOSTOS_FATURAMENTO': dre.impostosFat += valor; break
      case 'CUSTOS_OPERACIONAIS': dre.custosOp += valor; break
      case 'DESPESAS_VARIAVEIS': dre.despVar += valor; break
      case 'DESPESAS_FIXAS': dre.despFix += valor; break
      case 'INVESTIMENTOS': dre.invest += valor; break
      case 'RECEITAS_NAO_OPERACIONAIS': dre.recNaoOp += valor; break
      case 'DESPESAS_NAO_OPERACIONAIS': dre.despNaoOp += valor; break
      case 'IMPOSTOS_LUCRO': dre.impLucro += valor; break
      case 'DISTRIBUICAO_LUCROS': dre.distLucros += valor; break
      default: break
    }
  }

  console.log(`Receita Operacional:    R$ ${dre.receitaOp.toFixed(2)}`)
  console.log(`Impostos Faturamento:   R$ ${dre.impostosFat.toFixed(2)}`)
  console.log(`Custos Operacionais:    R$ ${dre.custosOp.toFixed(2)}`)
  console.log(`Despesas Variáveis:     R$ ${dre.despVar.toFixed(2)}`)
  console.log(`Despesas Fixas:         R$ ${dre.despFix.toFixed(2)}`)
  console.log(`Investimentos:          R$ ${dre.invest.toFixed(2)}`)
  console.log(`Receitas Não Op:        R$ ${dre.recNaoOp.toFixed(2)}`)
  console.log(`Despesas Não Op:        R$ ${dre.despNaoOp.toFixed(2)}`)

  // Mostrar RESULTADO LÍQUIDO de cada
  const fluxoResultado = bucket.receitaFaturamento - (bucket.custosOp + bucket.despVar + bucket.despFix + bucket.invest) + bucket.recNaoOp - bucket.despNaoOp - bucket.impLucro - bucket.distLucros + bucket.recSemCat - bucket.despSemCat
  const dreResultado = dre.receitaOp - dre.impostosFat - dre.custosOp - dre.despVar - dre.despFix - dre.invest + dre.recNaoOp - dre.despNaoOp - dre.impLucro - dre.distLucros
  console.log(`\nResultado Líquido FLUXO: R$ ${fluxoResultado.toFixed(2)}`)
  console.log(`Resultado Líquido DRE:   R$ ${dreResultado.toFixed(2)}`)
}
run().catch(console.error)
