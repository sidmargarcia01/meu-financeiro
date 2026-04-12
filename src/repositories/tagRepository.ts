/**
 * CAMADA: Repository
 * MÓDULO: Cadastros - Tags
 * RESPONSABILIDADE: Acesso ao banco de dados para tags
 * NÃO DEVE: Conter regras de negócio ou validação
 * DEPENDE DE: Supabase client
 */

import { getSupabaseServer } from '@/lib/serverSupabase'

export const tagRepository = {
  async create(userId: string, data: {
    name: string
    color?: string | null
  }) {
    const supabase = getSupabaseServer()
    const { data: result, error } = await supabase
      .from('tags')
      .insert({ ...data, user_id: userId })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return result
  },

  async findAllByUser(userId: string) {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (error) throw new Error(error.message)
    return data ?? []
  },

  async findById(id: string, userId: string) {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('tags')
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
      .from('tags')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', name)
      .maybeSingle()

    return data
  },

  async update(id: string, userId: string, data: {
    name?: string
    color?: string | null
  }) {
    const supabase = getSupabaseServer()
    const { data: result, error } = await supabase
      .from('tags')
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
      .from('tags')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  },

  async hasTransactions(id: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseServer()
    const { count } = await supabase
      .from('transaction_tags')
      .select('id', { count: 'exact', head: true })
      .eq('tag_id', id)

    // Note: transaction_tags não tem user_id, mas a RLS garante o isolamento
    return (count ?? 0) > 0
  }
}
