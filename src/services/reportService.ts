import { queryAll } from '@/lib/queryAll'
import { signedAmount } from '@/lib/financial'
/**
 * 📄 Descrição: Serviço de relatórios financeiros — DRE, DFC, Extrato, Balanço e Indicadores
 * 🧱 Contexto: Módulo de relatórios do Meu Financeiro
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06 (atualizado 2026-04-22 — Bloco 40)
 * ⚙️ Tecnologias: TypeScript, Supabase
 * 🔍 Dependências: @supabase/supabase-js
 * ✅ Revisado: Sim
 */

import { supabase } from '@/lib/requestSupabase'
import { classifyDespesaFallback } from '@/services/dreClassifier'

export interface DRELinha {
  descricao: string
  valor: number
  percentual?: number
  tipo: 'receita' | 'despesa' | 'subtotal' | 'total'
  nivel: number
}

// DRE estruturado gerencial (10 grupos) — alinhado com personal-website dre-report.service
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
  ebitda: number                       // MC - fixas (Lucro Operacional Antes dos Investimentos)
  ebitdaPercent: number | null
  investimentos: number               // INVESTIMENTOS
  lucroOperacional: number             // EBITDA - investimentos
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
    const dateField = regime === 'COMPETENCIA' ? 'effective_competence_date' : 'effective_cash_date'
    const statusFilter = regime === 'CAIXA'
      ? ['CONFIRMADO', 'CONCILIADO']
      : ['PENDENTE', 'CONFIRMADO', 'CONCILIADO']

    // Pré-carrega categorias pai para obter dre_group correto via subcategorias
    const { data: parentCats } = await queryAll(supabase
      .from('categories')
      .select('id, name, dre_group')
      .eq('user_id', userId)
      .is('parent_id', null))

    const parentCatMap = new Map<string, { name: string; dreGroup: string | null }>()
      ; (parentCats || []).forEach((pc: any) => {
        parentCatMap.set(pc.id, { name: pc.name, dreGroup: pc.dre_group ?? null })
      })

    const { data: transactions, error } = await queryAll(supabase
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
      .order(dateField))

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

    // Classify every category, including mixed legacy/unclassified categories.
    let receitasOperacionais = sumGroup('RECEITAS_OPERACIONAIS')
    const impostosFaturamento = sumGroup('IMPOSTOS_FATURAMENTO')
    let custosOperacionais = sumGroup('CUSTOS_OPERACIONAIS')
    let despesasVariaveis = sumGroup('DESPESAS_VARIAVEIS')
    let despesasFixas = sumGroup('DESPESAS_FIXAS')
    let investimentos = sumGroup('INVESTIMENTOS')
    const receitasNaoOperacionais = sumGroup('RECEITAS_NAO_OPERACIONAIS')
    const despesasNaoOperacionais = sumGroup('DESPESAS_NAO_OPERACIONAIS')
    const impostosLucro = sumGroup('IMPOSTOS_LUCRO')
    const distribuicaoLucros = sumGroup('DISTRIBUICAO_LUCROS')
    for (const c of categorias.filter(c => !c.dreGroup)) {
      if (c.tipo === 'RECEITA') { receitasOperacionais += c.total; continue }
      switch (classifyDespesaFallback(c.nome)) {
        case 'CUSTO': custosOperacionais += c.total; break
        case 'FIXA': despesasFixas += c.total; break
        default: despesasVariaveis += c.total
      }
    }

    const receitaLiquida = receitasOperacionais - impostosFaturamento
    const margemBruta = receitaLiquida - custosOperacionais
    const margemBrutaPercent = pctRL(margemBruta, receitaLiquida)
    const margemContribuicao = margemBruta - despesasVariaveis
    const margemContribuicaoPercent = pctRL(margemContribuicao, receitaLiquida)
    const ebitda = margemContribuicao - despesasFixas
    const ebitdaPercent = pctRL(ebitda, receitaLiquida)
    const lucroOperacional = ebitda - investimentos
    const resultadoAntesIR = lucroOperacional + receitasNaoOperacionais - despesasNaoOperacionais
    const resultadoLiquido = resultadoAntesIR - impostosLucro - distribuicaoLucros
    const margemLiquidaPercent = pctRL(resultadoLiquido, receitaLiquida)

    const estruturado: DREEstruturado = {
      receitasOperacionais, impostosFaturamento, receitaLiquida,
      custosOperacionais, margemBruta, margemBrutaPercent,
      despesasVariaveis, margemContribuicao, margemContribuicaoPercent,
      despesasFixas, ebitda, ebitdaPercent,
      investimentos, lucroOperacional,
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
    const { data: transactions, error } = await queryAll(supabase
      .from('transactions')
      .select(`
        id, account_id, description, amount, type, status,
        due_date, payment_date, effective_cash_date,
        accounts(name),
        categories(name)
      `)
      .eq('user_id', userId)
      .in('status', ['CONFIRMADO', 'CONCILIADO'])
      .gte('effective_cash_date', inicio)
      .lte('effective_cash_date', fim)
      .order('effective_cash_date'))

    if (error) throw error

    const { data: accounts, error: accountsError } = await queryAll(supabase.from('accounts')
      .select('id, initial_balance, initial_balance_date, name').eq('user_id', userId))
    if (accountsError) throw accountsError
    const { data: previous, error: previousError } = await queryAll(supabase.from('transactions')
      .select('account_id, type, amount, payment_date, effective_cash_date').eq('user_id', userId)
      .in('status', ['CONFIRMADO', 'CONCILIADO']).lt('effective_cash_date', inicio))
    if (previousError) throw previousError
    const bases = new Map((accounts || []).map(a => [a.id, a.initial_balance_date]))
    const saldoInicial = (accounts || []).reduce((sum, a) => sum +
      (!a.initial_balance_date || a.initial_balance_date < inicio ? Number(a.initial_balance || 0) : 0), 0)
      + (previous || []).filter(t => !bases.get(t.account_id) || t.effective_cash_date >= bases.get(t.account_id))
        .reduce((sum, t) => sum + signedAmount(t.type, t.amount), 0)
    let saldo = saldoInicial
    const linhas: DFCLinha[] = []

    const events = [
      ...(transactions || []).filter(t => !bases.get(t.account_id) || t.effective_cash_date >= bases.get(t.account_id)).map(t => ({date:t.effective_cash_date,tx:t,opening:0,name:''})),
      ...(accounts || []).filter(a => a.initial_balance_date && a.initial_balance_date >= inicio && a.initial_balance_date <= fim)
        .map(a => ({date:a.initial_balance_date,tx:null,opening:Number(a.initial_balance||0),name:a.name})),
    ].sort((a,b) => a.date.localeCompare(b.date) || (a.tx ? 1 : -1))
    for (const event of events) {
      const tx=event.tx
      if (!tx) {
        saldo += event.opening
        linhas.push({data:event.date,descricao:'Saldo inicial cadastrado',entrada:0,saida:0,saldo,tipo:'TRANSFERENCIA',status:'SALDO_INICIAL',conta:event.name})
        continue
      }
      saldo += signedAmount(tx.type,tx.amount)
      linhas.push({ data:event.date, descricao:tx.description,
        entrada:tx.type==='RECEITA'?Math.abs(tx.amount):0, saida:tx.type==='DESPESA'?Math.abs(tx.amount):0,
        saldo,tipo:tx.type,status:tx.status,conta:(tx.accounts as any)?.name||'—',categoria:(tx.categories as any)?.name })
    }

    const totalEntradas = linhas.reduce((s, l) => s + l.entrada, 0)
    const totalSaidas = linhas.reduce((s, l) => s + l.saida, 0)

    return {
      periodo: { inicio, fim },
      linhas,
      totalEntradas,
      totalSaidas,
      saldoFinal: saldo,
      saldoInicial,
    }
  }

  // ─── Balanço Patrimonial v1 ─────────────────────────────────────────────────
  // Ativo Circulante = saldo positivo das contas ativas (saldo inicial + movimentações pagas)
  // Passivo Circulante = total de DESPESAs pendentes com vencimento <= data
  // PL = AC - PT
  async gerarBalanco(userId: string, data: string): Promise<BalancoRelatorio> {
    const { data: accounts, error: errAcc } = await queryAll(supabase
      .from('accounts')
      .select('id, initial_balance, initial_balance_date')
      .eq('user_id', userId)
      .eq('is_active', true))

    if (errAcc) throw errAcc

    const accountIds = (accounts || []).map(a => a.id)

    // Calcular saldo real de cada conta até a data
    let ativoCirculante = 0
    let saldoDevedor = 0

    if (accountIds.length > 0) {
      const { data: txPagas } = await queryAll(supabase
        .from('transactions')
        .select('account_id, amount, type, effective_cash_date')
        .eq('user_id', userId)
        .in('status', ['CONFIRMADO', 'CONCILIADO'])
        .lte('effective_cash_date', data)
        .in('account_id', accountIds))

      const saldoMap = new Map<string, number>()
      for (const acc of accounts || []) {
        saldoMap.set(acc.id, !acc.initial_balance_date || acc.initial_balance_date <= data ? Number(acc.initial_balance ?? 0) : 0)
      }
      for (const tx of txPagas || []) {
        const base = accounts?.find(a => a.id === tx.account_id)?.initial_balance_date
        if (base && tx.effective_cash_date < base) continue
        const cur = saldoMap.get(tx.account_id) ?? 0
        saldoMap.set(tx.account_id, cur + signedAmount(tx.type, tx.amount))
      }
      for (const v of saldoMap.values()) {
        if (v > 0) ativoCirculante += v
        else saldoDevedor += Math.abs(v)
      }
    }

    // Passivo Circulante = DESPESAs pendentes até a data
    const { data: pendentes } = await queryAll(supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'DESPESA')
      .eq('status', 'PENDENTE')
      .lte('due_date', data))

    const passivoCirculante = saldoDevedor + (pendentes || []).reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
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
    const rl = e.receitaLiquida ?? dre.totalReceitas
    const cfo = dfc.totalEntradas - dfc.totalSaidas
    const { ativoCirculante, passivoCirculante, passivoTotal, patrimonioLiquido } = balanco

    // ── Seção Resultado (A — DRE) ────────────────────────────────────────────
    const secaoResultado: IndicatorDto[] = [
      {
        key: 'receita_operacional_bruta',
        label: 'Receita Operacional Bruta',
        value: e.receitasOperacionais ?? dre.totalReceitas,
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
        label: 'Margem operacional gerencial',
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
        label: 'Resultado gerencial após investimentos e distribuições',
        value: e.resultadoLiquido ?? dre.resultado,
        unit: 'R$',
      },
    ]

    // ── Seção Estrutura e Solvência ──────────────────────────────────────────
    const secaoEstrutura: IndicatorDto[] = [
      {
        key: 'liquidez_corrente',
        label: 'Caixa positivo / Contas vencidas a pagar',
        value: ratio(ativoCirculante, passivoCirculante),
        unit: 'ratio',
      },
      {
        key: 'endividamento',
        label: 'Contas vencidas / Saldo gerencial',
        value: ratio(passivoTotal, patrimonioLiquido),
        unit: 'ratio',
      },
      {
        key: 'participacao_capital_terceiros',
        label: 'Contas vencidas / Caixa positivo',
        value: pct(passivoTotal, passivoTotal + patrimonioLiquido),
        unit: '%',
      },
    ]

    // ── Seção Caixa ──────────────────────────────────────────────────────────
    const secaoCaixa: IndicatorDto[] = [
      {
        key: 'gco_valor',
        label: 'Variação líquida das movimentações',
        value: cfo,
        unit: 'R$',
      },
      {
        key: 'gco_sobre_receita_percent',
        label: 'Movimentação líquida / Receita Líquida',
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
    let txQuery = supabase.from('transactions').select('id,account_id,description,amount,type,status,due_date,payment_date,accounts(name),categories(name)').eq('user_id',userId)
    let accQuery = supabase.from('accounts').select('id,name,initial_balance,initial_balance_date,currency').eq('user_id',userId)
    if (accountId) { txQuery=txQuery.eq('account_id',accountId); accQuery=accQuery.eq('id',accountId) }
    const [{data: rows,error},{data: accounts,error: accError}] = await Promise.all([queryAll(txQuery),queryAll(accQuery)])
    if (error || accError) throw error || accError
    if (new Set(accounts.map(a => a.currency || 'BRL')).size > 1) throw new Error('Selecione uma conta: moedas diferentes não podem ser somadas sem conversão')
    const bases = new Map(accounts.map(a => [a.id,a.initial_balance_date]))
    const dateOf = (t:any) => t.status==='PENDENTE' ? t.due_date : t.payment_date || t.due_date
    const eligible = rows.filter(t => (!fim || dateOf(t)<=fim) && (!bases.get(t.account_id) || dateOf(t)>=bases.get(t.account_id)))
      .sort((a,b)=>dateOf(a).localeCompare(dateOf(b)) || a.id.localeCompare(b.id))
    let movement = 0
    return eligible.map(tx => {
      const date=dateOf(tx)
      const valor=signedAmount(tx.type,tx.amount)
      movement+=valor
      const opening=accounts.filter(a=>!a.initial_balance_date || a.initial_balance_date<=date).reduce((sum,a)=>sum+Number(a.initial_balance||0),0)
      return {id:tx.id,data:date,descricao:tx.description,valor,tipo:tx.type,status:tx.status,
        categoria:(tx.categories as any)?.name,conta:(tx.accounts as any)?.name||'—',saldoAcumulado:opening+movement}
    }).filter(t=>!inicio || t.data>=inicio)
  }
}
