/**
 * CAMADA: Repository
 * MÓDULO: User
 * RESPONSABILIDADE: Acesso ao banco de dados para usuários
 * NÃO DEVE: Conter regras de negócio ou validação
 * DEPENDE DE: Supabase, User models
 */

import { supabase } from '@/lib/supabase'
import { User, UserSettings, UserWithSettings } from '@/models/user'

export class UserRepository {
  // Buscar usuário por ID
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null
    
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      planId: data.plan_id,
      defaultCurrency: data.default_currency || 'BRL',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as User
  }

  // Contar transações do mês
  async countTransactionsThisMonth(userId: string): Promise<number> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const { data, error } = await supabase
      .from('transactions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
    
    if (error) throw error
    return data?.length || 0
  }

  // Atualizar usuário
  async update(id: string, data: Partial<{
    name: string
    planId?: string | null
    defaultCurrency: string
  }>): Promise<User> {
    const { data: user, error } = await supabase
      .from('users')
      .update({
        name: data.name,
        plan_id: data.planId,
        default_currency: data.defaultCurrency,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      planId: user.plan_id,
      defaultCurrency: user.default_currency || 'BRL',
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    } as User
  }

  /**
   * CAMADA: Repository
   * MÉTODO: getUserPlan
   * RESPONSABILIDADE: Buscar o plano ativo do usuário pelo user_id
   * NÃO DEVE: Conter lógica de negócio ou validações
   */
  async getUserPlan(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        plan_id,
        plans!inner(
          id,
          name,
          type,
          transaction_limit,
          user_limit,
          storage_limit_mb
        )
      `)
      .eq('id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    if (!data || !data.plan_id) return null
    
    return {
      id: (data.plans as any).id,
      name: (data.plans as any).name,
      type: (data.plans as any).type,
      transactionLimit: (data.plans as any).transaction_limit,
      userLimit: (data.plans as any).user_limit,
      storageLimitMb: (data.plans as any).storage_limit_mb,
      features: (data.plans as any).features || {}
    }
  }

  // Calcular uso de storage do usuário (em bytes)
  async getStorageUsage(userId: string): Promise<number> {
    // Simplificado - retornar valor fixo para testes
    // Em produção, calcularia tamanho real dos anexos e outros dados
    return 10 * 1024 * 1024 // 10MB padrão
  }
}
