/**
 * CAMADA: Repository
 * MÓDULO: Cadastros - Contatos
 * RESPONSABILIDADE: Acesso ao banco de dados para contatos
 * NÃO DEVE: Conter regras de negócio ou validação
 * DEPENDE DE: Supabase client
 */

import { getSupabaseServer } from '@/lib/serverSupabase'

export const contactRepository = {
  async create(userId: string, data: {
    name: string
    email?: string | null
    phone?: string | null
  }) {
    const supabase = getSupabaseServer()
    const { data: result, error } = await supabase
      .from('contacts')
      .insert({ ...data, user_id: userId })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return result
  },

  async findAllByUser(userId: string) {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw new Error(error.message)
    return data ?? []
  },

  async findById(id: string, userId: string) {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('contacts')
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
      .from('contacts')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', name)
      .maybeSingle()

    return data
  },

  async update(id: string, userId: string, data: {
    name?: string
    email?: string | null
    phone?: string | null
  }) {
    const supabase = getSupabaseServer()
    const { data: result, error } = await supabase
      .from('contacts')
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
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  },

  async hasTransactions(id: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseServer()
    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('contact_id', id)
      .eq('user_id', userId)

    return (count ?? 0) > 0
  }
}
