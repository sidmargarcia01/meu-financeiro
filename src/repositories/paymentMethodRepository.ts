/**
 * CAMADA: Repository
 * MÓDULO: Cadastros - Formas de Pagamento
 * RESPONSABILIDADE: Acesso ao banco de dados para formas de pagamento
 * NÃO DEVE: Conter regras de negócio ou validação
 * DEPENDE DE: Supabase client
 */

import { getSupabaseServer } from '@/lib/serverSupabase'

export const paymentMethodRepository = {
  async create(userId: string, data: {
    name: string
    type: string
  }) {
    const supabase = getSupabaseServer()
    const { data: result, error } = await supabase
      .from('payment_methods')
      .insert({ ...data, user_id: userId })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return result
  },

  async findAllByUser(userId: string) {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw new Error(error.message)
    return data ?? []
  },

  async findById(id: string, userId: string) {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) return null
    return data
  },

  async findByNameAndUser(name: string, userId: string) {
    const supabase = getSupabaseServer()
    const { data } = await supabase
      .from('payment_methods')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', name)
      .maybeSingle()

    return data
  },

  async update(id: string, userId: string, data: {
    name?: string
    type?: string
  }) {
    const supabase = getSupabaseServer()
    const { data: result, error } = await supabase
      .from('payment_methods')
      .update(data)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return result
  },

  async delete(id: string, userId: string) {
    const supabase = getSupabaseServer()
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  },

  async hasTransactions(_id: string, _userId: string): Promise<boolean> {
    // A tabela transactions não possui FK para payment_methods no schema atual
    return false
  }
}
