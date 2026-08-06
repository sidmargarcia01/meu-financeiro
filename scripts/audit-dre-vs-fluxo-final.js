require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data: allCats } = await s.from('categories').select('id, name, parent_id, dre_group, type')
  const catMap = new Map((allCats || []).map(c => [c.id, c]))

  const { data: txs } = await s.from('transactions')
    .select('id, description, amount, type, status, due_date, category_id')
    .in('type', ['RECEITA', 'DESPESA'])
    .in('status', ['CONFIRMADO', 'CONCILIADO'])
    .gte('due_date', '2026-04-01')
    .lte('due_date', '2026-04-30')

  // === SIMULAR NOVO FLUXO GERENCIAL ===
  let fRecFat = 0, fCustosOp = 0, fDespVar = 0, fDespFix = 0, fInvest = 0
  let fRecNaoOp = 0, fDespNaoOp = 0, fImpLucro = 0, fDistLucros = 0

  for (const tx of (txs || [])) {
    const cat = catMap.get(tx.category_id)
    const valor = Math.abs(Number(tx.amount))
    const ehReceita = tx.type === 'RECEITA'
    const dreGroup = cat?.dre_group || null

    switch (dreGroup) {
      case 'RECEITAS_OPERACIONAIS': fRecFat += valor; break
      case 'IMPOSTOS_FATURAMENTO': fCustosOp += valor; break  // ← FIX: agora acumula
      case 'CUSTOS_OPERACIONAIS': fCustosOp += valor; break
      case 'DESPESAS_VARIAVEIS': fDespVar += valor; break
      case 'DESPESAS_FIXAS': fDespFix += valor; break
      case 'INVESTIMENTOS': fInvest += valor; break
      case 'RECEITAS_NAO_OPERACIONAIS': fRecNaoOp += valor; break
      case 'DESPESAS_NAO_OPERACIONAIS': fDespNaoOp += valor; break
      case 'IMPOSTOS_LUCRO': fImpLucro += valor; break
      case 'DISTRIBUICAO_LUCROS': fDistLucros += valor; break
      default:
        if (ehReceita) fRecFat += valor      // ← FIX: vai pro faturamento
        else fDespVar += valor               // ← FIX: vai pra variáveis
    }
  }

  const fCustosVariaveis = -(fCustosOp + fDespVar)
  const fMargemContrib = fRecFat + fCustosVariaveis
  const fLucroOpAntes = fMargemContrib + (-fDespFix)
  const fLucroOp = fLucroOpAntes + (-fInvest)
  const fMovNaoOp = fRecNaoOp - fDespNaoOp - fImpLucro - fDistLucros
  const fResultado = fLucroOp + fMovNaoOp

  // === SIMULAR NOVO DRE ===
  const recSemGrupo = (txs || []).filter(t => t.type === 'RECEITA' && !catMap.get(t.category_id)?.dre_group)
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  const despSemGrupo = (txs || []).filter(t => t.type === 'DESPESA' && !catMap.get(t.category_id)?.dre_group)
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0)

  const sumGrp = (type, grp) => (txs || []).filter(t => t.type === type && catMap.get(t.category_id)?.dre_group === grp)
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0)

  const dRecOp = sumGrp('RECEITA', 'RECEITAS_OPERACIONAIS') + recSemGrupo
  const dImpostosFat = sumGrp('DESPESA', 'IMPOSTOS_FATURAMENTO')
  const dRecLiq = dRecOp - dImpostosFat
  const dCustosOp = sumGrp('DESPESA', 'CUSTOS_OPERACIONAIS')
  const dMargemBruta = dRecLiq - dCustosOp
  const dDespVar = sumGrp('DESPESA', 'DESPESAS_VARIAVEIS') + despSemGrupo
  const dMargemContrib = dMargemBruta - dDespVar
  const dDespFix = sumGrp('DESPESA', 'DESPESAS_FIXAS')
  const dEbitda = dMargemContrib - dDespFix
  const dInvest = sumGrp('DESPESA', 'INVESTIMENTOS')
  const dLucroOp = dEbitda - dInvest
  const dRecNaoOp = sumGrp('RECEITA', 'RECEITAS_NAO_OPERACIONAIS')
  const dDespNaoOp = sumGrp('DESPESA', 'DESPESAS_NAO_OPERACIONAIS')
  const dResultadoAntesIR = dLucroOp + dRecNaoOp - dDespNaoOp
  const dImpLucro = sumGrp('DESPESA', 'IMPOSTOS_LUCRO')
  const dDistLucros = sumGrp('DESPESA', 'DISTRIBUICAO_LUCROS')
  const dResultado = dResultadoAntesIR - dImpLucro - dDistLucros

  console.log('╔══════════════════════════════════════════════════════════════════╗')
  console.log('║   COMPARATIVO DRE vs FLUXO GERENCIAL — ABR/2026 (PÓS-FIX)      ║')
  console.log('╠══════════════════════════════════════════════════════════════════╣')
  console.log('║ Linha                         │    DRE        │    FLUXO        ║')
  console.log('╠═══════════════════════════════╪═══════════════╪═════════════════╣')
  console.log(`║ Receita/Faturamento           │ ${pad(dRecOp)} │ ${pad(fRecFat)} ║`)
  console.log(`║ (-) Impostos Fat              │ ${pad(-dImpostosFat)} │ (em Custos Var) ║`)
  console.log(`║ Receita Líquida               │ ${pad(dRecLiq)} │ (não tem)       ║`)
  console.log(`║ (-) Custos Op (CPV)           │ ${pad(-dCustosOp)} │ (em Custos Var) ║`)
  console.log(`║ Margem Bruta                  │ ${pad(dMargemBruta)} │ (não tem)       ║`)
  console.log(`║ (-) Despesas Variáveis        │ ${pad(-dDespVar)} │ (em Custos Var) ║`)
  console.log(`║ CUSTOS VARIÁVEIS (combinado)  │ ${pad(-(dImpostosFat+dCustosOp+dDespVar))} │ ${pad(fCustosVariaveis)} ║`)
  console.log(`║ MARGEM DE CONTRIBUIÇÃO        │ ${pad(dMargemContrib)} │ ${pad(fMargemContrib)} ║`)
  console.log(`║ (-) Despesas Fixas            │ ${pad(-dDespFix)} │ ${pad(-fDespFix)} ║`)
  console.log(`║ EBITDA / Lucro antes invest   │ ${pad(dEbitda)} │ ${pad(fLucroOpAntes)} ║`)
  console.log(`║ (-) Investimentos             │ ${pad(-dInvest)} │ ${pad(-fInvest)} ║`)
  console.log(`║ LUCRO OPERACIONAL             │ ${pad(dLucroOp)} │ ${pad(fLucroOp)} ║`)
  console.log(`║ (+) Rec Não Op                │ ${pad(dRecNaoOp)} │ ${pad(fRecNaoOp)} ║`)
  console.log(`║ (-) Desp Não Op               │ ${pad(-dDespNaoOp)} │ ${pad(-fDespNaoOp)} ║`)
  console.log(`║ Mov Não Operacionais          │ ${pad(dRecNaoOp-dDespNaoOp)} │ ${pad(fMovNaoOp)} ║`)
  console.log(`║ ═══════════════════════════════╪═══════════════╪═════════════════║`)
  console.log(`║ ★ RESULTADO LÍQUIDO           │ ${pad(dResultado)} │ ${pad(fResultado)} ║`)
  console.log(`║ Match?                        │ ${dResultado === fResultado ? '✅ SIM' : '❌ NÃO (' + (fResultado - dResultado).toFixed(2) + ')'} ${''.padEnd(9)}║`)
  console.log('╚══════════════════════════════════════════════════════════════════╝')
}

function pad(v) { return ('R$ ' + v.toFixed(2)).padStart(13) }
run().catch(console.error)
