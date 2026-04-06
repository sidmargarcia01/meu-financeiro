/**
 * 📄 Descrição: Serviço de Investimentos — carteiras, ativos e posições
 * 🧱 Contexto: Módulo de investimentos do Meu Financeiro
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06
 * ⚙️ Tecnologias: TypeScript, Supabase
 * ✅ Revisado: Sim
 */

import { supabase } from '@/lib/supabase'

export interface Investment {
  id: string
  userId: string
  name: string
  type: 'ACOES' | 'FII' | 'RENDA_FIXA' | 'CRIPTOMOEDA' | 'FUNDO' | 'OUTRO'
  ticker?: string
  quantity: number
  averagePrice: number
  currentPrice?: number
  totalInvested: number
  currentValue?: number
  profitLoss?: number
  profitLossPercent?: number
  broker?: string
  currency: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Portfolio {
  totalInvested: number
  currentValue: number
  profitLoss: number
  profitLossPercent: number
  byType: { type: string; total: number; percentual: number }[]
  investments: Investment[]
}

const TYPE_LABELS: Record<string, string> = {
  ACOES: 'Ações', FII: 'FIIs', RENDA_FIXA: 'Renda Fixa',
  CRIPTOMOEDA: 'Criptomoedas', FUNDO: 'Fundos', OUTRO: 'Outros',
}

export class InvestmentService {
  async list(userId: string): Promise<Investment[]> {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw error
    return (data || []).map(this.map)
  }

  async getPortfolio(userId: string): Promise<Portfolio> {
    const investments = await this.list(userId)
    const active = investments.filter(i => i.isActive)

    const totalInvested = active.reduce((s, i) => s + i.totalInvested, 0)
    const currentValue = active.reduce((s, i) => s + (i.currentValue ?? i.totalInvested), 0)
    const profitLoss = currentValue - totalInvested
    const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0

    const typeMap = new Map<string, number>()
    active.forEach(i => {
      typeMap.set(i.type, (typeMap.get(i.type) ?? 0) + (i.currentValue ?? i.totalInvested))
    })

    const byType = Array.from(typeMap.entries()).map(([type, total]) => ({
      type: TYPE_LABELS[type] || type,
      total,
      percentual: currentValue > 0 ? (total / currentValue) * 100 : 0,
    })).sort((a, b) => b.total - a.total)

    return { totalInvested, currentValue, profitLoss, profitLossPercent, byType, investments: active }
  }

  async create(userId: string, input: {
    name: string; type: string; ticker?: string; quantity: number
    averagePrice: number; currentPrice?: number; broker?: string; currency?: string
  }): Promise<Investment> {
    const totalInvested = input.quantity * input.averagePrice
    const currentValue = input.currentPrice ? input.quantity * input.currentPrice : totalInvested

    const { data, error } = await supabase
      .from('investments').insert({
        user_id: userId, name: input.name, type: input.type,
        ticker: input.ticker, quantity: input.quantity,
        average_price: input.averagePrice, current_price: input.currentPrice,
        total_invested: totalInvested, current_value: currentValue,
        broker: input.broker, currency: input.currency || 'BRL',
      }).select().single()

    if (error) throw error
    return this.map(data)
  }

  async update(userId: string, id: string, input: Partial<{
    name: string; type: string; ticker: string; quantity: number
    averagePrice: number; currentPrice: number; broker: string; isActive: boolean
  }>): Promise<Investment> {
    const updateData: any = { updated_at: new Date().toISOString() }
    if (input.name !== undefined) updateData.name = input.name
    if (input.type !== undefined) updateData.type = input.type
    if (input.ticker !== undefined) updateData.ticker = input.ticker
    if (input.quantity !== undefined) updateData.quantity = input.quantity
    if (input.averagePrice !== undefined) updateData.average_price = input.averagePrice
    if (input.currentPrice !== undefined) {
      updateData.current_price = input.currentPrice
      if (input.quantity !== undefined) {
        updateData.current_value = input.quantity * input.currentPrice
      }
    }
    if (input.broker !== undefined) updateData.broker = input.broker
    if (input.isActive !== undefined) updateData.is_active = input.isActive

    if (input.quantity !== undefined && input.averagePrice !== undefined) {
      updateData.total_invested = input.quantity * input.averagePrice
    }

    const { data, error } = await supabase
      .from('investments').update(updateData)
      .eq('id', id).eq('user_id', userId).select().single()

    if (error) throw error
    if (!data) throw new Error('Investimento não encontrado')
    return this.map(data)
  }

  async delete(userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('investments').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
  }

  private map(d: any): Investment {
    const totalInvested = d.total_invested || 0
    const currentValue = d.current_value ?? totalInvested
    const profitLoss = currentValue - totalInvested
    return {
      id: d.id, userId: d.user_id, name: d.name, type: d.type || 'OUTRO',
      ticker: d.ticker, quantity: d.quantity || 0,
      averagePrice: d.average_price || 0, currentPrice: d.current_price,
      totalInvested, currentValue, profitLoss,
      profitLossPercent: totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0,
      broker: d.broker, currency: d.currency || 'BRL',
      isActive: d.is_active ?? true,
      createdAt: d.created_at, updatedAt: d.updated_at,
    }
  }
}
