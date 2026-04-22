/**
 * CAMADA: Repository
 * MÓDULO: Cadastros - Categorias
 * RESPONSABILIDADE: Acesso ao banco de dados para categorias
 * NÃO DEVE: Conter regras de negócio, calcular hierarquia, validar tipo de pai
 * DEPENDE DE: Supabase client
 */

import { getSupabaseServer } from '@/lib/serverSupabase'

export const categoryRepository = {
  async create(userId: string, data: {
    name: string
    type: 'RECEITA' | 'DESPESA'
    parent_id?: string | null
    dre_group?: string | null
  }) {
    console.log('[REPO] Criando categoria:', { name: data.name, type: data.type, dre_group: data.dre_group, user_id: userId })
    const supabase = getSupabaseServer()
    const { data: result, error } = await supabase
      .from('categories')
      .insert({ ...data, user_id: userId })
      .select()
      .single()

    if (error) {
      console.error('[REPO] Erro Supabase:', error.code, error.message, error.details)
      throw new Error(`Supabase error: ${error.code} - ${error.message}`)
    }
    console.log('[REPO] Categoria criada:', result?.id)
    return result
  },

  async findAllByUser(userId: string, filters?: { type?: string }) {
    const supabase = getSupabaseServer()
    let query = supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async findById(id: string, userId: string) {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) return null
    return data
  },

  async findByNameAndUser(name: string, userId: string, parentId?: string | null) {
    const supabase = getSupabaseServer()
    let query = supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', name)

    if (parentId !== undefined) {
      query = parentId
        ? query.eq('parent_id', parentId)
        : query.is('parent_id', null)
    }

    const { data } = await query.maybeSingle()
    return data
  },

  async update(id: string, userId: string, data: { name?: string; dre_group?: string | null }) {
    const supabase = getSupabaseServer()
    const { data: result, error } = await supabase
      .from('categories')
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
      .from('categories')
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
      .eq('category_id', id)
      .eq('user_id', userId)

    return (count ?? 0) > 0
  },

  async hasChildren(id: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseServer()
    const { count } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', id)
      .eq('user_id', userId)

    return (count ?? 0) > 0
  }
}
