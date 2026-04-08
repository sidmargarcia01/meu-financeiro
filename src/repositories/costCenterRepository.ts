/**
 * CAMADA: Repository
 * MÓDULO: Cadastros - Centros de Custo
 * RESPONSABILIDADE: Acesso ao banco de dados para centros de custo
 * NÃO DEVE: Conter regras de negócio ou validação
 * DEPENDE DE: Supabase client
 */

import { supabaseServer } from '@/lib/serverSupabase'

export const costCenterRepository = {
  async create(userId: string, data: {
    name: string
    description?: string
  }) {
    const supabase = supabaseServer
    const { data: result, error } = await supabase
      .from('cost_centers')
      .insert({ ...data, user_id: userId })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return result
  },

  async findAllByUser(userId: string) {
    const supabase = supabaseServer
    const { data, error } = await supabase
      .from('cost_centers')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw new Error(error.message)
    return data ?? []
  },

  async findById(id: string, userId: string) {
    const supabase = supabaseServer
    const { data, error } = await supabase
      .from('cost_centers')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) return null
    return data
  },

  async findByNameAndUser(name: string, userId: string) {
    const supabase = supabaseServer
    const { data } = await supabase
      .from('cost_centers')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', name)
      .maybeSingle()

    return data
  },

  async update(id: string, userId: string, data: { 
    name?: string
    description?: string 
  }) {
    const supabase = supabaseServer
    const { data: result, error } = await supabase
      .from('cost_centers')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return result
  },

  async delete(id: string, userId: string) {
    const supabase = supabaseServer
    const { error } = await supabase
      .from('cost_centers')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  },

  async hasTransactions(id: string, userId: string): Promise<boolean> {
    const supabase = supabaseServer
    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('cost_center_id', id)
      .eq('user_id', userId)

    return (count ?? 0) > 0
  }
}
