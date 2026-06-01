/**
 * 📄 Descrição: Serviço de relatórios financeiros — DRE, DFC, Extrato, Balanço e Indicadores
 * 🧱 Contexto: Módulo de relatórios do Meu Financeiro
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06 (atualizado 2026-04-22 — Bloco 40)
 * ⚙️ Tecnologias: TypeScript, Supabase
 * 🔍 Dependências: @supabase/supabase-js
 * ✅ Revisado: Sim
 */

import { supabase } from '@/lib/supabase'

export interface DRELinha {
  descricao: string
  valor: number
  percentual?: number
  tipo: 'receita' | 'despesa' | 'subtotal' | 'total'
  nivel: number
}

// DRE estruturado gerencial (9 grupos) — alinhado com personal-website dre-report.service
export interface DREEstruturado {
  receitasOperacionais: number         // RECEITAS_OPERACIONAIS (ROB)
  impostosFaturamento: number          // IMPOSTOS_FATURAMENTO
  receitaLiquida: number               // ROB - impostos
  custosOperacionais: number           // CUSTOS_OPERACIONAIS (CPV/CSV)
  margemBruta: number                  // RL - custos
  margemBrutaPercent: number | null
  despesasVariaveis: number            // DESPESAS_VARIAVEIS
  margemContribuicao: number           // MB - variáveis
  margemContribuicaoPercent: number | null
  despesasFixas: number                // DESPESAS_FIXAS
  ebitda: number                       // MC - fixas (Resultado Operacional)
  ebitdaPercent: number | null
  receitasNaoOperacionais: number      // RECEITAS_NAO_OPERACIONAIS
  despesasNaoOperacionais: number      // DESPESAS_NAO_OPERACIONAIS
  resultadoAntesIR: number             // EBT
  impostosLucro: number                // IMPOSTOS_LUCRO
  distribuicaoLucros: number           // DISTRIBUICAO_LUCROS
  resultadoLiquido: number
  margemLiquidaPercent: number | null
}

export interface DRERelatorio {
  periodo: { inicio: string; fim: string }
  regime: 'CAIXA' | 'COMPETENCIA'
  linhas: DRELinha[]
  totalReceitas: number
  totalDespesas: number
  resultado: number
  estruturado: DREEstruturado
  categorias: {
    id: string
    nome: string
    tipo: 'RECEITA' | 'DESPESA'
    dreGroup: string | null
    total: number
    percentual: number
    subcategorias: { id: string; nome: string; total: number }[]
  }[]
}

export interface DFCLinha {
  data: string
  descricao: string
  entrada: number
  saida: number
  saldo: number
  tipo: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  status: string
  conta: string
  categoria?: string
}

export interface DFCRelatorio {
  periodo: { inicio: string; fim: string }
  linhas: DFCLinha[]
  totalEntradas: number
  totalSaidas: number
  saldoFinal: number
  saldoInicial: number
}

export interface ExtratoLinha {
  id: string
  data: string
  descricao: string
  valor: number
  tipo: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  status: string
  categoria?: string
  conta: string
  saldoAcumulado: number
}

// ─── Balanço Patrimonial (v1 simplificado) ──────────────────────────────────
export interface BalancoRelatorio {
  data: string
  ativoCirculante: number
  passivoCirculante: number
  passivoNaoCirculante: number
  passivoTotal: number
  patrimonioLiquido: number
}

// ─── Indicadores Gerenciais ──────────────────────────────────────────────────
export type IndicatorUnit = 'R$' | '%' | 'ratio'

export interface IndicatorDto {
  key: string
  label: string
  value: number | null
  unit: IndicatorUnit
}

export interface IndicatorsSectionDto {
  title: string
  indicators: IndicatorDto[]
}

export interface IndicatorsReportResponse {
  sections: IndicatorsSectionDto[]
  period: { startDate: string; endDate: string }
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function pct(num: number, den: number): number | null {
  return den !== 0 ? (num / den) * 100 : null
}
function ratio(num: number, den: number): number | null {
  return den !== 0 ? num / den : null
}

export class ReportService {
  async gerarDRE(
    userId: string,
    inicio: string,
    fim: string,
    regime: 'CAIXA' | 'COMPETENCIA' = 'CAIXA'
  ): Promise<DRERelatorio> {
    const dateField = regime === 'COMPETENCIA' ? 'competence_date' : 'due_date'
    const statusFilter = regime === 'CAIXA'
      ? ['CONFIRMADO', 'CONCILIADO']
      : ['PENDENTE', 'CONFIRMADO', 'CONCILIADO']

    // Pré-carrega categorias pai para obter dre_group correto via subcategorias
    const { data: parentCats } = await supabase
      .from('categories')
      .select('id, name, dre_group')
      .eq('user_id', userId)
      .is('parent_id', null)

    const parentCatMap = new Map<string, { name: string; dreGroup: string | null }>()
      ; (parentCats || []).forEach((pc: any) => {
        parentCatMap.set(pc.id, { name: pc.name, dreGroup: pc.dre_group ?? null })
      })

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id, description, amount, type, status,
        due_date, competence_date, payment_date,
        categories(id, name, type, parent_id, dre_group)
      `)
      .eq('user_id', userId)
      .in('type', ['RECEITA', 'DESPESA'])
      .in('status', statusFilter)
      .gte(dateField, inicio)
      .lte(dateField, fim)
      .order(dateField)

    if (error) throw error

    const categoriaMap = new Map<string, {
      id: string; nome: string; tipo: 'RECEITA' | 'DESPESA'
      dreGroup: string | null; parentId?: string; total: number
      subcategorias: Map<string, { id: string; nome: string; total: number }>
    }>()

    let totalReceitas = 0
    let totalDespesas = 0

    for (const tx of (transactions || [])) {
      const cat = tx.categories as any
      const tipo: 'RECEITA' | 'DESPESA' = tx.type as any

      // Fallback: transações sem categoria aparecem em "Sem Categoria" (não são silenciadas)
      const catId = cat ? (cat.parent_id || cat.id) : `sem-categoria-${tipo}`

      if (!categoriaMap.has(catId)) {
        let catNome: string
        let dreGroup: string | null
        if (!cat) {
          catNome = 'Sem Categoria'
          dreGroup = null
        } else if (cat.parent_id) {
          // Para subcategorias: busca nome e dre_group do PAI via parentCatMap
          const parentInfo = parentCatMap.get(cat.parent_id)
          catNome = parentInfo?.name || cat.name
          dreGroup = parentInfo?.dreGroup ?? null
        } else {
          catNome = cat.name
          dreGroup = cat.dre_group ?? null
        }
        categoriaMap.set(catId, { id: catId, nome: catNome, tipo, dreGroup, total: 0, subcategorias: new Map() })
      }

      // Sempre usar Math.abs para neutralizar sinal do BD
      const txValue = Math.abs(Number(tx.amount) || 0)

      const catEntry = categoriaMap.get(catId)!
      catEntry.total += txValue

      if (cat?.parent_id) {
        if (!catEntry.subcategorias.has(cat.id)) {
          catEntry.subcategorias.set(cat.id, { id: cat.id, nome: cat.name, total: 0 })
        }
        catEntry.subcategorias.get(cat.id)!.total += txValue
      }

      if (tipo === 'RECEITA') totalReceitas += txValue
      else totalDespesas += txValue
    }

    const categorias = Array.from(categoriaMap.values()).map(c => ({
      id: c.id,
      nome: c.nome,
      tipo: c.tipo,
      dreGroup: c.dreGroup,
      total: c.total,
      percentual: c.tipo === 'RECEITA'
        ? totalReceitas > 0 ? (c.total / totalReceitas) * 100 : 0
        : totalDespesas > 0 ? (c.total / totalDespesas) * 100 : 0,
      subcategorias: Array.from(c.subcategorias.values()),
    }))

    const resultado = totalReceitas - totalDespesas

    // ── DRE Estruturado (9 grupos gerenciais) ────────────────────────────────
    const sumGroup = (g: string) =>
      categorias.filter(c => c.dreGroup === g).reduce((s, c) => s + Math.abs(c.total), 0)
    const pctRL = (v: number, rl: number) => rl !== 0 ? (v / rl) * 100 : null

    // Verificar separadamente para RECEITA e DESPESA (evita falso positivo)
    const hasReceitaDreGroup = categorias.some(c =>
      c.tipo === 'RECEITA' && c.dreGroup !== null && c.dreGroup !== undefined
    )
    const hasDespesaDreGroup = categorias.some(c =>
      c.tipo === 'DESPESA' && c.dreGroup !== null && c.dreGroup !== undefined
    )

    let receitasOperacionais: number
    let impostosFaturamento: number
    let custosOperacionais: number
    let despesasVariaveis: number
    let despesasFixas: number
    let receitasNaoOperacionais: number
    let despesasNaoOperacionais: number
    let impostosLucro: number
    let distribuicaoLucros: number

    // Soma de itens sem dreGroup (null) — fallback p/ totais do path estruturado
    const semDreGroupReceita = categorias
      .filter(c => c.tipo === 'RECEITA' && !c.dreGroup)
      .reduce((s, c) => s + Math.abs(c.total), 0)
    const semDreGroupDespesa = categorias
      .filter(c => c.tipo === 'DESPESA' && !c.dreGroup)
      .reduce((s, c) => s + Math.abs(c.total), 0)

    // ── Receitas ─────────────────────────────────────────────────────────────
    if (hasReceitaDreGroup) {
      // Itens sem dreGroup vão para receitas operacionais (melhor estimativa)
      receitasOperacionais = sumGroup('RECEITAS_OPERACIONAIS') + semDreGroupReceita
      impostosFaturamento = sumGroup('IMPOSTOS_FATURAMENTO')
      receitasNaoOperacionais = sumGroup('RECEITAS_NAO_OPERACIONAIS')
    } else {
      receitasOperacionais = totalReceitas
      impostosFaturamento = 0
      receitasNaoOperacionais = 0
    }

    // ── Despesas ─────────────────────────────────────────────────────────────
    if (hasDespesaDreGroup) {
      // Usar classificação por dre_group configurada no banco
      // Itens sem dreGroup vão para despesas variáveis (melhor estimativa)
      custosOperacionais = sumGroup('CUSTOS_OPERACIONAIS')
      despesasVariaveis = sumGroup('DESPESAS_VARIAVEIS') + semDreGroupDespesa
      despesasFixas = sumGroup('DESPESAS_FIXAS')
      despesasNaoOperacionais = sumGroup('DESPESAS_NAO_OPERACIONAIS')
      impostosLucro = sumGroup('IMPOSTOS_LUCRO')
      distribuicaoLucros = sumGroup('DISTRIBUICAO_LUCROS')
    } else {
      // Fallback por palavras-chave — default é VARIÁVEL (operacional)
      const despesasCategorias = categorias.filter(c => c.tipo === 'DESPESA')

      // Custos Operacionais (CPV/CSV): produção, mercadoria, matéria-prima
      const custosKeywords = [
        'mercadoria', 'produto para revenda', 'revenda', 'produção', 'producao',
        'matéria-prima', 'materia-prima', 'matéria prima', 'materia prima',
        'embalagem', 'custo de produção', 'cpv', 'csv'
      ]

      // Despesas Fixas: estruturais, não variam com volume
      const fixasKeywords = [
        'aluguel', 'salário', 'salario', 'salarios', 'folha', 'folha de pagamento',
        'pró-labore', 'pro-labore', 'prolabore', 'inss', 'fgts', 'férias', 'ferias',
        '13º', '13o', 'contabilidade', 'contador', 'financiamento', 'amortização',
        'amortizacao', 'depreciação', 'depreciacao', 'juros', 'empréstimo',
        'emprestimo', 'leasing', 'debenture', 'seguro', 'plano de saúde',
        'plano de saude', 'benefício', 'beneficio', 'transporte de funcionário',
        'vale transporte', 'vale alimentação', 'vale refeição', 'licença', 'licenca',
        'anuidade', 'sindico', 'síndico'
      ]

      let totalCustos = 0
      let totalFixas = 0
      let totalVariaveis = 0

      despesasCategorias.forEach(c => {
        const nome = c.nome.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos para comparação
        const valor = Math.abs(c.total)

        // Normalizar também as keywords para comparação sem acento
        const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

        if (custosKeywords.some(k => nome.includes(normalizar(k)))) {
          totalCustos += valor
        } else if (fixasKeywords.some(k => nome.includes(normalizar(k)))) {
          totalFixas += valor
        } else {
          // DEFAULT: despesa variável (operacional — água, energia, serviços, etc.)
          totalVariaveis += valor
        }
      })

      custosOperacionais = totalCustos
      despesasVariaveis = totalVariaveis
      despesasFixas = totalFixas
      despesasNaoOperacionais = 0
      impostosLucro = 0
      distribuicaoLucros = 0
    }

    const receitaLiquida = receitasOperacionais - impostosFaturamento
    const margemBruta = receitaLiquida - custosOperacionais
    const margemBrutaPercent = pctRL(margemBruta, receitaLiquida)
    const margemContribuicao = margemBruta - despesasVariaveis
    const margemContribuicaoPercent = pctRL(margemContribuicao, receitaLiquida)
    const ebitda = margemContribuicao - despesasFixas
    const ebitdaPercent = pctRL(ebitda, receitaLiquida)
    const resultadoAntesIR = ebitda + receitasNaoOperacionais - despesasNaoOperacionais
    const resultadoLiquido = resultadoAntesIR - impostosLucro - distribuicaoLucros
    const margemLiquidaPercent = pctRL(resultadoLiquido, receitaLiquida)

    const estruturado: DREEstruturado = {
      receitasOperacionais, impostosFaturamento, receitaLiquida,
      custosOperacionais, margemBruta, margemBrutaPercent,
      despesasVariaveis, margemContribuicao, margemContribuicaoPercent,
      despesasFixas, ebitda, ebitdaPercent,
      receitasNaoOperacionais, despesasNaoOperacionais, resultadoAntesIR,
      impostosLucro, distribuicaoLucros, resultadoLiquido, margemLiquidaPercent,
    }

    const linhas: DRELinha[] = [
      { descricao: 'RECEITAS', valor: totalReceitas, tipo: 'subtotal', nivel: 0 },
      ...categorias.filter(c => c.tipo === 'RECEITA').map(c => ({
        descricao: c.nome, valor: c.total,
        percentual: c.percentual, tipo: 'receita' as const, nivel: 1
      })),
      { descricao: 'DESPESAS', valor: totalDespesas, tipo: 'subtotal', nivel: 0 },
      ...categorias.filter(c => c.tipo === 'DESPESA').map(c => ({
        descricao: c.nome, valor: c.total,
        percentual: c.percentual, tipo: 'despesa' as const, nivel: 1
      })),
      { descricao: 'RESULTADO (LUCRO/PREJUÍZO)', valor: resultado, tipo: 'total', nivel: 0 },
    ]

    return { periodo: { inicio, fim }, regime, linhas, totalReceitas, totalDespesas, resultado, estruturado, categorias }
  }

  async gerarDFC(userId: string, inicio: string, fim: string): Promise<DFCRelatorio> {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id, description, amount, type, status,
        due_date, payment_date,
        accounts(name),
        categories(name)
      `)
      .eq('user_id', userId)
      .in('status', ['CONFIRMADO', 'CONCILIADO'])
      .gte('due_date', inicio)
      .lte('due_date', fim)
      .order('due_date')

    if (error) throw error

    let saldo = 0
    const linhas: DFCLinha[] = []

    for (const tx of (transactions || [])) {
      const acc = tx.accounts as any
      const cat = tx.categories as any
      const entrada = tx.type === 'RECEITA' ? Math.abs(tx.amount) : 0
      const saida = tx.type === 'DESPESA' ? Math.abs(tx.amount) : 0
      saldo += (tx.type === 'RECEITA' ? tx.amount : tx.type === 'DESPESA' ? tx.amount : 0)

      linhas.push({
        data: tx.payment_date ?? tx.due_date,
        descricao: tx.description,
        entrada,
        saida,
        saldo,
        tipo: tx.type,
        status: tx.status,
        conta: acc?.name || '—',
        categoria: cat?.name,
      })
    }

    const totalEntradas = linhas.reduce((s, l) => s + l.entrada, 0)
    const totalSaidas = linhas.reduce((s, l) => s + l.saida, 0)

    return {
      periodo: { inicio, fim },
      linhas,
      totalEntradas,
      totalSaidas,
      saldoFinal: saldo,
      saldoInicial: 0,
    }
  }

  // ─── Balanço Patrimonial v1 ─────────────────────────────────────────────────
  // Ativo Circulante = saldo positivo das contas ativas (saldo inicial + movimentações pagas)
  // Passivo Circulante = total de DESPESAs pendentes com vencimento <= data
  // PL = AC - PT
  async gerarBalanco(userId: string, data: string): Promise<BalancoRelatorio> {
    const { data: accounts, error: errAcc } = await supabase
      .from('accounts')
      .select('id, initial_balance')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (errAcc) throw errAcc

    const accountIds = (accounts || []).map(a => a.id)

    // Calcular saldo real de cada conta até a data
    let ativoCirculante = 0

    if (accountIds.length > 0) {
      const { data: txPagas } = await supabase
        .from('transactions')
        .select('account_id, amount, type')
        .eq('user_id', userId)
        .in('status', ['CONFIRMADO', 'CONCILIADO'])
        .lte('payment_date', data)
        .in('account_id', accountIds)

      const saldoMap = new Map<string, number>()
      for (const acc of accounts || []) {
        saldoMap.set(acc.id, Number(acc.initial_balance ?? 0))
      }
      for (const tx of txPagas || []) {
        const cur = saldoMap.get(tx.account_id) ?? 0
        saldoMap.set(tx.account_id, cur + (tx.type === 'RECEITA' ? tx.amount : -tx.amount))
      }
      for (const v of saldoMap.values()) {
        if (v > 0) ativoCirculante += v
      }
    }

    // Passivo Circulante = DESPESAs pendentes até a data
    const { data: pendentes } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'DESPESA')
      .eq('status', 'PENDENTE')
      .lte('due_date', data)

    const passivoCirculante = (pendentes || []).reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
    const passivoNaoCirculante = 0
    const passivoTotal = passivoCirculante + passivoNaoCirculante
    const patrimonioLiquido = ativoCirculante - passivoTotal

    return {
      data,
      ativoCirculante,
      passivoCirculante,
      passivoNaoCirculante,
      passivoTotal,
      patrimonioLiquido,
    }
  }

  // ─── Indicadores Gerenciais (Bloco 40) ──────────────────────────────────────
  async gerarIndicadores(
    userId: string,
    inicio: string,
    fim: string
  ): Promise<IndicatorsReportResponse> {
    const [dre, dfc, balanco] = await Promise.all([
      this.gerarDRE(userId, inicio, fim, 'CAIXA'),
      this.gerarDFC(userId, inicio, fim),
      this.gerarBalanco(userId, fim),
    ])

    const e = dre.estruturado
    const rl = e.receitaLiquida > 0 ? e.receitaLiquida : dre.totalReceitas
    const cfo = dfc.totalEntradas - dfc.totalSaidas
    const { ativoCirculante, passivoCirculante, passivoTotal, patrimonioLiquido } = balanco

    // ── Seção Resultado (A — DRE) ────────────────────────────────────────────
    const secaoResultado: IndicatorDto[] = [
      {
        key: 'receita_operacional_bruta',
        label: 'Receita Operacional Bruta',
        value: e.receitasOperacionais || dre.totalReceitas,
        unit: 'R$',
      },
      {
        key: 'receita_liquida',
        label: 'Receita Líquida',
        value: rl,
        unit: 'R$',
      },
      {
        key: 'margem_bruta_percent',
        label: 'Margem Bruta',
        value: e.margemBrutaPercent,
        unit: '%',
      },
      {
        key: 'margem_contribuicao_percent',
        label: 'Margem de Contribuição',
        value: e.margemContribuicaoPercent,
        unit: '%',
      },
      {
        key: 'margem_ebitda_percent',
        label: 'Margem EBITDA',
        value: e.ebitdaPercent,
        unit: '%',
      },
      {
        key: 'margem_liquida_percent',
        label: 'Margem Líquida',
        value: e.margemLiquidaPercent ?? pct(dre.resultado, rl),
        unit: '%',
      },
      {
        key: 'resultado_liquido',
        label: 'Resultado Líquido',
        value: e.resultadoLiquido || dre.resultado,
        unit: 'R$',
      },
    ]

    // ── Seção Estrutura e Solvência ──────────────────────────────────────────
    const secaoEstrutura: IndicatorDto[] = [
      {
        key: 'liquidez_corrente',
        label: 'Liquidez Corrente',
        value: ratio(ativoCirculante, passivoCirculante),
        unit: 'ratio',
      },
      {
        key: 'endividamento',
        label: 'Endividamento',
        value: ratio(passivoTotal, patrimonioLiquido),
        unit: 'ratio',
      },
      {
        key: 'participacao_capital_terceiros',
        label: 'Participação Capital de Terceiros',
        value: pct(passivoTotal, passivoTotal + patrimonioLiquido),
        unit: '%',
      },
    ]

    // ── Seção Caixa ──────────────────────────────────────────────────────────
    const secaoCaixa: IndicatorDto[] = [
      {
        key: 'gco_valor',
        label: 'Geração de Caixa Operacional',
        value: cfo,
        unit: 'R$',
      },
      {
        key: 'gco_sobre_receita_percent',
        label: 'GCO / Receita Líquida',
        value: pct(cfo, rl),
        unit: '%',
      },
      {
        key: 'variacao_caixa',
        label: 'Variação de Caixa',
        value: dfc.saldoFinal - dfc.saldoInicial,
        unit: 'R$',
      },
    ]

    return {
      sections: [
        { title: 'Resultado', indicators: secaoResultado },
        { title: 'Estrutura e Solvência', indicators: secaoEstrutura },
        { title: 'Caixa', indicators: secaoCaixa },
      ],
      period: { startDate: inicio, endDate: fim },
    }
  }

  async gerarExtrato(userId: string, accountId?: string, inicio?: string, fim?: string): Promise<ExtratoLinha[]> {
    let query = supabase
      .from('transactions')
      .select(`
        id, description, amount, type, status,
        due_date, payment_date,
        accounts(name),
        categories(name)
      `)
      .eq('user_id', userId)
      .order('due_date')

    if (accountId) query = query.eq('account_id', accountId)
    if (inicio) query = query.gte('due_date', inicio)
    if (fim) query = query.lte('due_date', fim)

    const { data, error } = await query
    if (error) throw error

    let saldoAcumulado = 0
    return (data || []).map(tx => {
      const acc = tx.accounts as any
      const cat = tx.categories as any
      const valor = tx.type === 'DESPESA' ? -tx.amount : tx.amount
      saldoAcumulado += valor

      return {
        id: tx.id,
        data: tx.due_date,
        descricao: tx.description,
        valor,
        tipo: tx.type,
        status: tx.status,
        categoria: cat?.name,
        conta: acc?.name || '—',
        saldoAcumulado,
      }
    })
  }
}
