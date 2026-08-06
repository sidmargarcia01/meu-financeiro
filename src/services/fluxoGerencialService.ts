/**
 * 📄 Descrição: Serviço de Fluxo de Caixa Gerencial — matriz mensal REALIZADO / AV / AH
 * 🧱 Contexto: Módulo Movimentações, rota /api/reports/fluxo-gerencial
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-07-14
 * ⚙️ Tecnologias: TypeScript, Supabase
 * 🔍 Dependências: transactionRepository, classifyDespesaFallback
 * ✅ Revisado: Sim
 */

import { transactionRepository } from '@/repositories/transactionRepository'
import { accountRepository } from '@/repositories/accountRepository'
import { classifyDespesaFallback } from '@/services/dreClassifier'
import type { DreGroup } from '@/schemas/categorySchema'

export interface MesFluxo {
  mes: number
  ano: number
}

export interface ValorFluxo {
  realizado: number
  av: number | null
  ah: number | null
}

export interface FluxoLinha {
  id: string
  label: string
  tipo: 'grupo' | 'calculado' | 'categoria' | 'subcategoria'
  nivel: number
  parentId?: string
  destaque: boolean
  avTipo: 'receita' | 'deducao' | 'resultado' | 'saldo' | 'nao_aplica'
  valores: ValorFluxo[]
}

export interface FluxoGerencialRelatorio {
  periodo: { inicio: string; fim: string }
  regime: 'CAIXA' | 'COMPETENCIA'
  meses: MesFluxo[]
  linhas: FluxoLinha[]
}

interface CategoriaNode {
  id: string
  nome: string
  tipo: 'RECEITA' | 'DESPESA'
  dreGroup: DreGroup | null
  parentId: string | null
  total: number
  subcategorias: Map<string, CategoriaNode>
}

interface BucketMes {
  receitaFaturamento: number
  custosOperacionais: number
  despesasVariaveis: number
  despesasFixas: number
  investimentos: number
  receitasNaoOperacionais: number
  despesasNaoOperacionais: number
  impostosLucro: number
  distribuicaoLucros: number
  receitasSemCategoria: number
  despesasSemCategoria: number
  saldoFinalReal: number
  categorias: Map<string, CategoriaNode>
}

const MES_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function primeiroDiaDoMes(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}-01`
}

function ultimoDiaDoMes(ano: number, mes: number): string {
  const d = new Date(ano, mes, 0)
  return d.toISOString().split('T')[0]
}

function gerarMeses(inicio: string, fim: string): MesFluxo[] {
  const [anoInicio, mesInicio] = inicio.split('-').map(Number)
  const [anoFim, mesFim] = fim.split('-').map(Number)
  const meses: MesFluxo[] = []

  let ano = anoInicio
  let mes = mesInicio

  while (ano < anoFim || (ano === anoFim && mes <= mesFim)) {
    meses.push({ ano, mes })
    mes++
    if (mes > 12) {
      mes = 1
      ano++
    }
  }

  return meses
}

function chaveMes(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}`
}

function buildParentCategoryMap(transactions: any[]): Map<string, { nome: string; dreGroup: DreGroup | null }> {
  const map = new Map<string, { nome: string; dreGroup: DreGroup | null }>()
  const parentIds = new Set<string>()

  for (const tx of transactions) {
    const cat = tx.categories as any
    if (cat?.parent_id) parentIds.add(cat.parent_id)
  }

  for (const tx of transactions) {
    const cat = tx.categories as any
    if (cat && parentIds.has(cat.id) && !map.has(cat.id)) {
      map.set(cat.id, { nome: cat.name, dreGroup: cat.dre_group ?? null })
    }
  }

  return map
}

function usarFallbackInvestimento(dreGroup: DreGroup | null, nomeCategoria: string): 'INVESTIMENTO' | false {
  if (dreGroup === 'INVESTIMENTOS') return 'INVESTIMENTO'
  const investimentoKeywords = ['investimento', 'equipamento', 'maquinario', 'veiculo', 'imovel', 'software', 'licenca']
  const nome = nomeCategoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return investimentoKeywords.some(k => nome.includes(k)) ? 'INVESTIMENTO' : false
}

function classificarDespesa(dreGroup: DreGroup | null, nomeCategoria: string): 'CUSTO' | 'FIXA' | 'VARIAVEL' | 'INVESTIMENTO' {
  if (dreGroup === 'INVESTIMENTOS') return 'INVESTIMENTO'
  const ehInvestimento = usarFallbackInvestimento(dreGroup, nomeCategoria)
  if (ehInvestimento === 'INVESTIMENTO') return 'INVESTIMENTO'
  const fallback = classifyDespesaFallback(nomeCategoria)
  return fallback === 'NAO_CLASSIFICADO' ? 'VARIAVEL' : fallback
}

function agruparTransacoes(
  transactions: any[],
  meses: MesFluxo[],
  parentCatMap: Map<string, { nome: string; dreGroup: DreGroup | null }>,
  usarDreGroup: boolean,
  dateField: 'due_date' | 'competence_date' = 'due_date'
): Map<string, BucketMes> {
  const buckets = new Map<string, BucketMes>()

  for (const m of meses) {
    buckets.set(chaveMes(m.ano, m.mes), {
      receitaFaturamento: 0,
      custosOperacionais: 0,
      despesasVariaveis: 0,
      despesasFixas: 0,
      investimentos: 0,
      receitasNaoOperacionais: 0,
      despesasNaoOperacionais: 0,
      impostosLucro: 0,
      distribuicaoLucros: 0,
      receitasSemCategoria: 0,
      despesasSemCategoria: 0,
      saldoFinalReal: 0,
      categorias: new Map<string, CategoriaNode>(),
    })
  }

  for (const tx of transactions) {
    const cat = tx.categories as any
    const tipo: 'RECEITA' | 'DESPESA' = tx.type
    const data = (tx[dateField] as string) || (tx.due_date as string)
    const [anoStr, mesStr] = data.split('-')
    const key = `${anoStr}-${mesStr}`
    const bucket = buckets.get(key)
    if (!bucket) continue

    const valor = Math.abs(Number(tx.amount) || 0)

    const ehReceita = tipo === 'RECEITA'
    const dreGroup: DreGroup | null = cat?.dre_group ?? null

    if (usarDreGroup) {
      switch (dreGroup) {
        case 'RECEITAS_OPERACIONAIS':
          bucket.receitaFaturamento += valor
          break
        case 'IMPOSTOS_FATURAMENTO':
          // Tratado como filha negativa da receita quando expandida
          break
        case 'CUSTOS_OPERACIONAIS':
          bucket.custosOperacionais += valor
          break
        case 'DESPESAS_VARIAVEIS':
          bucket.despesasVariaveis += valor
          break
        case 'DESPESAS_FIXAS':
          bucket.despesasFixas += valor
          break
        case 'INVESTIMENTOS':
          bucket.investimentos += valor
          break
        case 'RECEITAS_NAO_OPERACIONAIS':
          bucket.receitasNaoOperacionais += valor
          break
        case 'DESPESAS_NAO_OPERACIONAIS':
          bucket.despesasNaoOperacionais += valor
          break
        case 'IMPOSTOS_LUCRO':
          bucket.impostosLucro += valor
          break
        case 'DISTRIBUICAO_LUCROS':
          bucket.distribuicaoLucros += valor
          break
        default:
          if (ehReceita) bucket.receitasSemCategoria += valor
          else bucket.despesasSemCategoria += valor
      }
    } else {
      if (ehReceita) {
        bucket.receitaFaturamento += valor
      } else {
        const classificacao = classificarDespesa(dreGroup, cat?.name || 'Sem Categoria')
        switch (classificacao) {
          case 'CUSTO':
            bucket.custosOperacionais += valor
            break
          case 'VARIAVEL':
            bucket.despesasVariaveis += valor
            break
          case 'FIXA':
            bucket.despesasFixas += valor
            break
          case 'INVESTIMENTO':
            bucket.investimentos += valor
            break
        }
      }
    }

    // Agregar por categoria para contas filhas
    const catId = cat ? (cat.parent_id || cat.id) : `sem-categoria-${tipo}`
    if (!bucket.categorias.has(catId)) {
      let catNome: string
      let catDreGroup: DreGroup | null
      let parentId: string | null

      if (!cat) {
        catNome = 'Sem Categoria'
        catDreGroup = null
        parentId = null
      } else if (cat.parent_id) {
        const parentInfo = parentCatMap.get(cat.parent_id)
        catNome = parentInfo?.nome || cat.name
        catDreGroup = parentInfo?.dreGroup ?? null
        parentId = cat.parent_id
      } else {
        catNome = cat.name
        catDreGroup = cat.dre_group ?? null
        parentId = null
      }

      bucket.categorias.set(catId, {
        id: catId,
        nome: catNome,
        tipo,
        dreGroup: catDreGroup,
        parentId,
        total: 0,
        subcategorias: new Map<string, CategoriaNode>(),
      })
    }

    const catNode = bucket.categorias.get(catId)!
    catNode.total += ehReceita ? valor : -valor

    if (cat?.parent_id) {
      if (!catNode.subcategorias.has(cat.id)) {
        catNode.subcategorias.set(cat.id, {
          id: cat.id,
          nome: cat.name,
          tipo,
          dreGroup: cat.dre_group ?? null,
          parentId: cat.parent_id,
          total: 0,
          subcategorias: new Map(),
        })
      }
      const sub = catNode.subcategorias.get(cat.id)!
      sub.total += ehReceita ? valor : -valor
    }
  }

  return buckets
}

function calcularLinhaCalculada(
  bucket: BucketMes,
  saldoInicial: number
): {
  receitaFaturamento: number
  custosVariaveis: number
  margemContribuicao: number
  despesasFixas: number
  lucroOperacionalAntesInvestimentos: number
  investimentos: number
  despesaOperacionalTotal: number
  lucroOperacional: number
  movimentacoesNaoOperacionais: number
  resultadoLiquido: number
  pontoEquilibrioAntesInvestimento: number | null
  pontoEquilibrioComInvestimento: number | null
  acertoDoCaixa: number
  saldoInicial: number
  saldoFinal: number
  receitasSemCategoria: number
  despesasSemCategoria: number
} {
  const receitaFaturamento = bucket.receitaFaturamento
  const custosVariaveis = -(bucket.custosOperacionais + bucket.despesasVariaveis)
  const margemContribuicao = receitaFaturamento + custosVariaveis
  const despesasFixas = -bucket.despesasFixas
  const lucroOperacionalAntesInvestimentos = margemContribuicao + despesasFixas
  const investimentos = -bucket.investimentos
  const despesaOperacionalTotal = custosVariaveis + despesasFixas + investimentos
  const lucroOperacional = receitaFaturamento + despesaOperacionalTotal
  const movimentacoesNaoOperacionais =
    bucket.receitasNaoOperacionais - bucket.despesasNaoOperacionais - bucket.impostosLucro - bucket.distribuicaoLucros
  const receitasSemCategoria = bucket.receitasSemCategoria
  const despesasSemCategoria = bucket.despesasSemCategoria
  const resultadoLiquido = lucroOperacional + movimentacoesNaoOperacionais + receitasSemCategoria - despesasSemCategoria

  const pctMC = receitaFaturamento > 0 && margemContribuicao > 0
    ? margemContribuicao / receitaFaturamento
    : null

  const pontoEquilibrioAntesInvestimento = pctMC
    ? Math.abs(despesasFixas) / pctMC
    : null

  const pontoEquilibrioComInvestimento = pctMC
    ? (Math.abs(despesasFixas) + Math.abs(investimentos)) / pctMC
    : null

  const saldoFinal = bucket.saldoFinalReal
  const acertoDoCaixa = saldoFinal - (saldoInicial + resultadoLiquido)

  return {
    receitaFaturamento,
    custosVariaveis,
    margemContribuicao,
    despesasFixas,
    lucroOperacionalAntesInvestimentos,
    investimentos,
    despesaOperacionalTotal,
    lucroOperacional,
    movimentacoesNaoOperacionais,
    resultadoLiquido,
    pontoEquilibrioAntesInvestimento,
    pontoEquilibrioComInvestimento,
    acertoDoCaixa,
    saldoInicial,
    saldoFinal,
    receitasSemCategoria,
    despesasSemCategoria,
  }
}

function normalizarZero(valor: number): number {
  return valor === 0 ? 0 : valor
}

function calcularAV(valor: number, receitaFaturamento: number, avTipo: FluxoLinha['avTipo']): number | null {
  if (receitaFaturamento === 0) return null

  if (avTipo === 'receita') return 100
  if (avTipo === 'deducao') return (Math.abs(valor) / receitaFaturamento) * 100
  if (avTipo === 'saldo') return (Math.abs(valor) / receitaFaturamento) * 100
  if (avTipo === 'nao_aplica') return (Math.abs(valor) / receitaFaturamento) * 100
  return (valor / receitaFaturamento) * 100
}

function calcularAH(valorAtual: number, valorAnterior: number | null): number | null {
  if (valorAnterior === null || valorAnterior === 0) return null
  return ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100
}

function criarLinha(
  id: string,
  label: string,
  tipo: FluxoLinha['tipo'],
  nivel: number,
  avTipo: FluxoLinha['avTipo'],
  valores: number[],
  receitas: number[],
  destaque: boolean,
  parentId?: string
): FluxoLinha {
  return {
    id,
    label,
    tipo,
    nivel,
    parentId,
    destaque,
    avTipo,
    valores: valores.map((valor, i) => ({
      realizado: normalizarZero(valor),
      av: calcularAV(normalizarZero(valor), receitas[i], avTipo),
      ah: null,
    })),
  }
}

function adicionarAH(linhas: FluxoLinha[]): void {
  for (const linha of linhas) {
    for (let i = 1; i < linha.valores.length; i++) {
      const anterior = linha.valores[i - 1].realizado
      const atual = linha.valores[i].realizado
      if (linha.id === 'acerto_do_caixa') {
        linha.valores[i].ah = null
      } else {
        linha.valores[i].ah = calcularAH(atual, anterior)
      }
    }
  }
}

export class FluxoGerencialService {
  async gerarMatriz(
    userId: string,
    inicio: string,
    fim: string,
    regime: 'CAIXA' | 'COMPETENCIA' = 'CAIXA'
  ): Promise<FluxoGerencialRelatorio> {
    const dateField = regime === 'COMPETENCIA' ? 'competence_date' : 'due_date'
    const statusFilter = regime === 'CAIXA'
      ? ['CONFIRMADO', 'CONCILIADO']
      : ['PENDENTE', 'CONFIRMADO', 'CONCILIADO']

    const meses = gerarMeses(inicio, fim)
    if (meses.length === 0) {
      return { periodo: { inicio, fim }, regime, meses: [], linhas: [] }
    }

    const [transactions, txSaldoInicial, saldoInicialContas] = await Promise.all([
      transactionRepository.findAllForPeriodWithCategory(userId, inicio, fim, statusFilter, dateField),
      transactionRepository.sumConfirmedBefore(userId, inicio),
      accountRepository.sumInitialBalancesBefore(userId, inicio),
    ])
    const saldoInicialInicial = txSaldoInicial + saldoInicialContas

    const parentCatMap = buildParentCategoryMap(transactions)

    const hasReceitaDreGroup = transactions.some((tx: any) => {
      const cat = tx.categories as any
      return tx.type === 'RECEITA' && cat?.dre_group === 'RECEITAS_OPERACIONAIS'
    })
    const hasDespesaDreGroup = transactions.some((tx: any) => {
      const cat = tx.categories as any
      return tx.type === 'DESPESA' && cat?.dre_group
    })
    const usarDreGroup = hasReceitaDreGroup || hasDespesaDreGroup

    const buckets = agruparTransacoes(transactions, meses, parentCatMap, usarDreGroup, dateField)

    // Buscar saldo final real de cada mês (transações + saldo inicial das contas)
    await Promise.all(
      meses.map(async ({ ano, mes }) => {
        const ultimoDia = ultimoDiaDoMes(ano, mes)
        const proximoDia = addOneDay(ultimoDia)
        const [txSaldo, contasSaldo] = await Promise.all([
          transactionRepository.sumConfirmedBefore(userId, proximoDia),
          accountRepository.sumInitialBalancesBefore(userId, proximoDia),
        ])
        const key = chaveMes(ano, mes)
        buckets.get(key)!.saldoFinalReal = txSaldo + contasSaldo
      })
    )

    // Calcular linhas principais por mês
    type CalculoMes = ReturnType<typeof calcularLinhaCalculada>
    const calculosPorMes: CalculoMes[] = []
    for (let i = 0; i < meses.length; i++) {
      const m = meses[i]
      const key = chaveMes(m.ano, m.mes)
      const bucket = buckets.get(key)!
      const saldoInicial = i === 0 ? saldoInicialInicial : calculosPorMes[i - 1].saldoFinal
      calculosPorMes.push(calcularLinhaCalculada(bucket, saldoInicial))
    }

    const receitasPorMes = calculosPorMes.map(c => c.receitaFaturamento)

    const linhas: FluxoLinha[] = []

    // Linha fixa superior: LUCRO OPERACIONAL
    linhas.push(criarLinha(
      'lucro_operacional_top',
      'LUCRO OPERACIONAL',
      'calculado',
      0,
      'resultado',
      calculosPorMes.map(c => c.lucroOperacional),
      receitasPorMes,
      true
    ))

    // 1. RECEITA/FATURAMENTO
    linhas.push(criarLinha(
      'receita_faturamento',
      'RECEITA/FATURAMENTO',
      'grupo',
      0,
      'receita',
      calculosPorMes.map(c => c.receitaFaturamento),
      receitasPorMes,
      false
    ))

    // 2. CUSTOS VARIÁVEIS
    linhas.push(criarLinha(
      'custos_variaveis',
      'CUSTOS VARIÁVEIS',
      'grupo',
      0,
      'deducao',
      calculosPorMes.map(c => c.custosVariaveis),
      receitasPorMes,
      false
    ))

    // 3. MARGEM DE CONTRIBUIÇÃO
    linhas.push(criarLinha(
      'margem_contribuicao',
      'MARGEM DE CONTRIBUIÇÃO',
      'calculado',
      0,
      'resultado',
      calculosPorMes.map(c => c.margemContribuicao),
      receitasPorMes,
      true
    ))

    // 4. DESPESAS FIXAS
    linhas.push(criarLinha(
      'despesas_fixas',
      'DESPESAS FIXAS',
      'grupo',
      0,
      'deducao',
      calculosPorMes.map(c => c.despesasFixas),
      receitasPorMes,
      false
    ))

    // 5. LUCRO OPERACIONAL ANTES DOS INVESTIMENTOS
    linhas.push(criarLinha(
      'lucro_operacional_antes_investimentos',
      'LUCRO OPERACIONAL ANTES DOS INVESTIMENTOS',
      'calculado',
      0,
      'resultado',
      calculosPorMes.map(c => c.lucroOperacionalAntesInvestimentos),
      receitasPorMes,
      true
    ))

    // 6. INVESTIMENTOS
    linhas.push(criarLinha(
      'investimentos',
      'INVESTIMENTOS',
      'grupo',
      0,
      'deducao',
      calculosPorMes.map(c => c.investimentos),
      receitasPorMes,
      false
    ))

    // 7. DESPESA OPERACIONAL TOTAL
    linhas.push(criarLinha(
      'despesa_operacional_total',
      'DESPESA OPERACIONAL TOTAL',
      'calculado',
      0,
      'deducao',
      calculosPorMes.map(c => c.despesaOperacionalTotal),
      receitasPorMes,
      true
    ))

    // 8. LUCRO OPERACIONAL (repetido)
    linhas.push(criarLinha(
      'lucro_operacional',
      'LUCRO OPERACIONAL',
      'calculado',
      0,
      'resultado',
      calculosPorMes.map(c => c.lucroOperacional),
      receitasPorMes,
      true
    ))

    // 9. MOVIMENTAÇÕES NÃO OPERACIONAIS
    linhas.push(criarLinha(
      'movimentacoes_nao_operacionais',
      'MOVIMENTAÇÕES NÃO OPERACIONAIS',
      'grupo',
      0,
      'resultado',
      calculosPorMes.map(c => c.movimentacoesNaoOperacionais),
      receitasPorMes,
      false
    ))

    // Linhas de transações sem categoria (só aparecem quando houver valor)
    const temReceitasSemCategoria = calculosPorMes.some(c => c.receitasSemCategoria !== 0)
    if (temReceitasSemCategoria) {
      linhas.push(criarLinha(
        'receitas_sem_categoria',
        'RECEITAS NÃO CLASSIFICADAS',
        'grupo',
        0,
        'nao_aplica',
        calculosPorMes.map(c => c.receitasSemCategoria),
        receitasPorMes,
        false
      ))
    }

    const temDespesasSemCategoria = calculosPorMes.some(c => c.despesasSemCategoria !== 0)
    if (temDespesasSemCategoria) {
      linhas.push(criarLinha(
        'despesas_sem_categoria',
        'DESPESAS NÃO CLASSIFICADAS',
        'grupo',
        0,
        'deducao',
        calculosPorMes.map(c => -c.despesasSemCategoria),
        receitasPorMes,
        false
      ))
    }

    // 10. RESULTADO LÍQUIDO
    linhas.push(criarLinha(
      'resultado_liquido',
      'RESULTADO LÍQUIDO',
      'calculado',
      0,
      'resultado',
      calculosPorMes.map(c => c.resultadoLiquido),
      receitasPorMes,
      true
    ))

    // 11. PONTO DE EQUILÍBRIO ANTES DO INVESTIMENTO
    linhas.push(criarLinha(
      'ponto_equilibrio_antes_investimento',
      'PONTO DE EQUILÍBRIO ANTES DO INVESTIMENTO',
      'calculado',
      0,
      'saldo',
      calculosPorMes.map(c => c.pontoEquilibrioAntesInvestimento ?? 0),
      receitasPorMes,
      false
    ))

    // 12. PONTO DE EQUILÍBRIO COM INVESTIMENTO
    linhas.push(criarLinha(
      'ponto_equilibrio_com_investimento',
      'PONTO DE EQUILÍBRIO COM INVESTIMENTO',
      'calculado',
      0,
      'saldo',
      calculosPorMes.map(c => c.pontoEquilibrioComInvestimento ?? 0),
      receitasPorMes,
      false
    ))

    // 13. ACERTO DO CAIXA
    linhas.push(criarLinha(
      'acerto_do_caixa',
      'ACERTO DO CAIXA',
      'calculado',
      0,
      'nao_aplica',
      calculosPorMes.map(c => c.acertoDoCaixa),
      receitasPorMes,
      false
    ))

    // 14. SALDO INICIAL
    linhas.push(criarLinha(
      'saldo_inicial',
      'SALDO INICIAL',
      'calculado',
      0,
      'saldo',
      calculosPorMes.map(c => c.saldoInicial),
      receitasPorMes,
      true
    ))

    // 15. SALDO FINAL
    linhas.push(criarLinha(
      'saldo_final',
      'SALDO FINAL',
      'calculado',
      0,
      'saldo',
      calculosPorMes.map(c => c.saldoFinal),
      receitasPorMes,
      true
    ))

    // Contas filhas (categorias e subcategorias)
    for (const m of meses) {
      const key = chaveMes(m.ano, m.mes)
      const bucket = buckets.get(key)!
      const idx = meses.indexOf(m)
      const receita = receitasPorMes[idx]

      for (const cat of bucket.categorias.values()) {
        const parentLine = linhas.find(l => l.id === categoriaParaLinhaPai(cat.dreGroup, cat.tipo, usarDreGroup))
        if (!parentLine) continue

        const catId = `cat:${cat.id}:${key}`
        linhas.push({
          id: catId,
          label: cat.nome,
          tipo: 'categoria',
          nivel: 1,
          parentId: parentLine.id,
          destaque: false,
          avTipo: cat.tipo === 'RECEITA' ? 'receita' : 'deducao',
          valores: meses.map((_, i) => ({
            realizado: i === idx ? cat.total : 0,
            av: i === idx ? calcularAV(cat.total, receitasPorMes[i], cat.tipo === 'RECEITA' ? 'receita' : 'deducao') : null,
            ah: null,
          })),
        })

        for (const sub of cat.subcategorias.values()) {
          linhas.push({
            id: `sub:${sub.id}:${key}`,
            label: sub.nome,
            tipo: 'subcategoria',
            nivel: 2,
            parentId: catId,
            destaque: false,
            avTipo: sub.tipo === 'RECEITA' ? 'receita' : 'deducao',
            valores: meses.map((_, i) => ({
              realizado: i === idx ? sub.total : 0,
              av: i === idx ? calcularAV(sub.total, receitasPorMes[i], sub.tipo === 'RECEITA' ? 'receita' : 'deducao') : null,
              ah: null,
            })),
          })
        }
      }
    }

    adicionarAH(linhas.filter(l => l.tipo !== 'categoria' && l.tipo !== 'subcategoria'))

    return { periodo: { inicio, fim }, regime, meses, linhas }
  }
}

function categoriaParaLinhaPai(dreGroup: DreGroup | null, tipo: 'RECEITA' | 'DESPESA', usarDreGroup: boolean): string | null {
  if (tipo === 'RECEITA') {
    if (usarDreGroup && !dreGroup) return 'receitas_sem_categoria'
    if (dreGroup === 'RECEITAS_OPERACIONAIS' || dreGroup === 'IMPOSTOS_FATURAMENTO' || !dreGroup) {
      return 'receita_faturamento'
    }
    if (dreGroup === 'RECEITAS_NAO_OPERACIONAIS') return 'movimentacoes_nao_operacionais'
    return null
  }

  if (usarDreGroup && !dreGroup) return 'despesas_sem_categoria'

  switch (dreGroup) {
    case 'CUSTOS_OPERACIONAIS':
    case 'DESPESAS_VARIAVEIS':
      return 'custos_variaveis'
    case 'DESPESAS_FIXAS':
      return 'despesas_fixas'
    case 'INVESTIMENTOS':
      return 'investimentos'
    case 'DESPESAS_NAO_OPERACIONAIS':
    case 'IMPOSTOS_LUCRO':
    case 'DISTRIBUICAO_LUCROS':
      return 'movimentacoes_nao_operacionais'
    case 'IMPOSTOS_FATURAMENTO':
      return 'receita_faturamento'
    default:
      return 'custos_variaveis'
  }
}

function addOneDay(date: string): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export const fluxoGerencialService = new FluxoGerencialService()
export { MES_LABELS }
