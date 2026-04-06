/**
 * CAMADA: Repository
 * MÓDULO: Recurrence
 * RESPONSABILIDADE: Acesso ao banco de dados para recorrências
 * NÃO DEVE: Conter regras de negócio ou validação
 * DEPENDE DE: Supabase
 */

import { supabase } from '@/lib/supabase'

export interface Recurrence {
  id: string
  userId: string
  type: 'PARCELADA' | 'FIXA'
  frequency?: 'SEMANAL' | 'MENSAL' | 'ANUAL'
  totalInstallments?: number
  currentInstallment?: number
  endDate?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class RecurrenceRepository {
  // Criar recorrência
  async create(data: {
    userId: string
    type: 'PARCELADA' | 'FIXA'
    frequency?: 'SEMANAL' | 'MENSAL' | 'ANUAL'
    totalInstallments?: number
    currentInstallment?: number
    endDate?: Date
    isActive?: boolean
  }): Promise<Recurrence> {
    const { data: recurrence, error } = await supabase
      .from('recurrences')
      .insert({
        user_id: data.userId,
        type: data.type,
        frequency: data.frequency,
        total_installments: data.totalInstallments,
        current_installment: data.currentInstallment || 1,
        end_date: data.endDate?.toISOString().split('T')[0],
        is_active: data.isActive ?? true
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: recurrence.id,
      userId: recurrence.user_id,
      type: recurrence.type,
      frequency: recurrence.frequency,
      totalInstallments: recurrence.total_installments,
      currentInstallment: recurrence.current_installment,
      endDate: recurrence.end_date ? new Date(recurrence.end_date) : undefined,
      isActive: recurrence.is_active,
      createdAt: new Date(recurrence.created_at),
      updatedAt: new Date(recurrence.updated_at)
    }
  }

  // Buscar recorrência por ID
  async findById(id: string, userId: string): Promise<Recurrence | null> {
    const { data: recurrence, error } = await supabase
      .from('recurrences')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    if (error || !recurrence) return null
    
    return {
      id: recurrence.id,
      userId: recurrence.user_id,
      type: recurrence.type,
      frequency: recurrence.frequency,
      totalInstallments: recurrence.total_installments,
      currentInstallment: recurrence.current_installment,
      endDate: recurrence.end_date ? new Date(recurrence.end_date) : undefined,
      isActive: recurrence.is_active,
      createdAt: new Date(recurrence.created_at),
      updatedAt: new Date(recurrence.updated_at)
    }
  }

  // Atualizar recorrência
  async update(
    id: string,
    userId: string,
    data: Partial<{
      currentInstallment?: number
      isActive?: boolean
      endDate?: Date
    }>
  ): Promise<Recurrence> {
    const { data: recurrence, error } = await supabase
      .from('recurrences')
      .update({
        current_installment: data.currentInstallment,
        is_active: data.isActive,
        end_date: data.endDate?.toISOString().split('T')[0]
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: recurrence.id,
      userId: recurrence.user_id,
      type: recurrence.type,
      frequency: recurrence.frequency,
      totalInstallments: recurrence.total_installments,
      currentInstallment: recurrence.current_installment,
      endDate: recurrence.end_date ? new Date(recurrence.end_date) : undefined,
      isActive: recurrence.is_active,
      createdAt: new Date(recurrence.created_at),
      updatedAt: new Date(recurrence.updated_at)
    }
  }

  // Excluir recorrência
  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('recurrences')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  }
}
