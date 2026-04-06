/**
 * 📄 Descrição: Serviço de relatórios financeiros — DRE (caixa e competência), DFC e Extrato
 * 🧱 Contexto: Módulo de relatórios do Meu Financeiro
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06
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

export interface DRERelatorio {
  periodo: { inicio: string; fim: string }
  regime: 'CAIXA' | 'COMPETENCIA'
  linhas: DRELinha[]
  totalReceitas: number
  totalDespesas: number
  resultado: number
  categorias: {
    id: string
    nome: string
    tipo: 'RECEITA' | 'DESPESA'
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

export class ReportService {
  async gerarDRE(
    userId: string,
    inicio: string,
    fim: string,
    regime: 'CAIXA' | 'COMPETENCIA' = 'CAIXA'
  ): Promise<DRERelatorio> {
    const dateField = regime === 'COMPETENCIA' ? 'competence_date' : 'due_date'

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id, description, amount, type, status,
        due_date, competence_date, payment_date,
        categories(id, name, type, parent_id)
      `)
      .eq('user_id', userId)
      .in('type', ['RECEITA', 'DESPESA'])
      .gte(dateField, inicio)
      .lte(dateField, fim)
      .order(dateField)

    if (error) throw error

    const categoriaMap = new Map<string, {
      id: string; nome: string; tipo: 'RECEITA' | 'DESPESA'
      parentId?: string; total: number
      subcategorias: Map<string, { id: string; nome: string; total: number }>
    }>()

    let totalReceitas = 0
    let totalDespesas = 0

    for (const tx of (transactions || [])) {
      const cat = tx.categories as any
      if (!cat) continue

      const catId = cat.parent_id || cat.id
      const catNome = cat.parent_id ? cat.name : cat.name
      const tipo: 'RECEITA' | 'DESPESA' = tx.type as any

      if (!categoriaMap.has(catId)) {
        categoriaMap.set(catId, { id: catId, nome: catNome, tipo, total: 0, subcategorias: new Map() })
      }

      const catEntry = categoriaMap.get(catId)!
      catEntry.total += tx.amount

      if (cat.parent_id) {
        if (!catEntry.subcategorias.has(cat.id)) {
          catEntry.subcategorias.set(cat.id, { id: cat.id, nome: cat.name, total: 0 })
        }
        catEntry.subcategorias.get(cat.id)!.total += tx.amount
      }

      if (tipo === 'RECEITA') totalReceitas += tx.amount
      else totalDespesas += tx.amount
    }

    const categorias = Array.from(categoriaMap.values()).map(c => ({
      id: c.id,
      nome: c.nome,
      tipo: c.tipo,
      total: c.total,
      percentual: c.tipo === 'RECEITA'
        ? totalReceitas > 0 ? (c.total / totalReceitas) * 100 : 0
        : totalDespesas > 0 ? (c.total / totalDespesas) * 100 : 0,
      subcategorias: Array.from(c.subcategorias.values()),
    }))

    const resultado = totalReceitas - totalDespesas

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

    return { periodo: { inicio, fim }, regime, linhas, totalReceitas, totalDespesas, resultado, categorias }
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
      .gte('due_date', inicio)
      .lte('due_date', fim)
      .order('due_date')

    if (error) throw error

    let saldo = 0
    const linhas: DFCLinha[] = []

    for (const tx of (transactions || [])) {
      const acc = tx.accounts as any
      const cat = tx.categories as any
      const entrada = tx.type === 'RECEITA' ? tx.amount : 0
      const saida = tx.type === 'DESPESA' ? tx.amount : 0
      saldo += entrada - saida

      linhas.push({
        data: tx.due_date,
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
