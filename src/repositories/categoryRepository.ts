/**
 * CAMADA: Repository
 * MÓDULO: Category
 * RESPONSABILIDADE: Acesso ao banco de dados para categorias
 * NÃO DEVE: Conter regras de negócio ou validação
 * DEPENDE DE: Supabase, Category models
 */

import { supabase } from '@/lib/supabase'
import { 
  Category, 
  CategoryWithChildren,
  CategoryTree 
} from '@/models/category'

export class CategoryRepository {
  // Criar categoria
  async create(data: {
    userId: string
    name: string
    description?: string
    color?: string
    icon?: string
    parentId?: string
    type: 'RECEITA' | 'DESPESA'
    isActive?: boolean
  }): Promise<Category> {
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        user_id: data.userId,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        parent_id: data.parentId,
        type: data.type,
        is_active: data.isActive ?? true
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: category.id,
      userId: category.user_id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      parentId: category.parent_id,
      type: category.type,
      isActive: category.is_active,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    }
  }

  // Buscar categoria por nome
  async findByName(userId: string, name: string): Promise<Category | null> {
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('name', name)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Não encontrado
      }
      throw error
    }

    return category
  }

  // Buscar categoria por ID
  async findById(id: string, userId: string): Promise<Category | null> {
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    if (error || !category) return null
    
    return {
      id: category.id,
      userId: category.user_id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      parentId: category.parent_id,
      type: category.type,
      isActive: category.is_active,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    }
  }

  // Listar categorias do usuário
  async findAllByUser(userId: string): Promise<Category[]> {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('name', { ascending: true })
    
    if (error) throw error
    
    return (categories || []).map((category: any) => ({
      id: category.id,
      userId: category.user_id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      parentId: category.parent_id,
      type: category.type,
      isActive: category.is_active,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    }))
  }

  // Listar categorias com hierarquia
  async getHierarchy(userId: string): Promise<CategoryWithChildren[]> {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('name', { ascending: true })
    
    if (error) throw error
    
    const allCategories = (categories || []).map((category: any) => ({
      id: category.id,
      userId: category.user_id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      parentId: category.parent_id,
      type: category.type,
      isActive: category.is_active,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    }))
    
    // Construir hierarquia
    const categoryMap = new Map<string, CategoryWithChildren>()
    const rootCategories: CategoryWithChildren[] = []
    
    // Primeiro, criar mapa de todas as categorias
    allCategories.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        children: [],
        level: 0
      })
    })
    
    // Depois, construir hierarquia
    allCategories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!
      
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId)
        if (parent) {
          parent.children.push(categoryWithChildren)
          categoryWithChildren.level = parent.level + 1
        }
      } else {
        rootCategories.push(categoryWithChildren)
      }
    })
    
    return rootCategories
  }

  // Atualizar categoria
  async update(
    id: string,
    userId: string,
    data: Partial<{
      name?: string
      description?: string
      color?: string
      icon?: string
      parentId?: string
      type?: 'RECEITA' | 'DESPESA'
      isActive?: boolean
    }>
  ): Promise<Category> {
    const { data: category, error } = await supabase
      .from('categories')
      .update({
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        parent_id: data.parentId,
        type: data.type,
        is_active: data.isActive
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: category.id,
      userId: category.user_id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      parentId: category.parent_id,
      type: category.type,
      isActive: category.is_active,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    }
  }

  // Excluir categoria
  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  }

  // Verificar se categoria existe
  async exists(id: string, userId: string): Promise<boolean> {
    const { data: category, error } = await supabase
      .from('categories')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    return !error && !!category
  }

  // Buscar categorias por tipo
  async findByType(
    userId: string,
    type: 'RECEITA' | 'DESPESA'
  ): Promise<Category[]> {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    if (error) throw error
    
    return (categories || []).map((category: any) => ({
      id: category.id,
      userId: category.user_id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      parentId: category.parent_id,
      type: category.type,
      isActive: category.is_active,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    }))
  }

  // Buscar categorias pai (sem parent_id)
  async findParentCategories(userId: string): Promise<Category[]> {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .is('parent_id', null)
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('name', { ascending: true })
    
    if (error) throw error
    
    return (categories || []).map((category: any) => ({
      id: category.id,
      userId: category.user_id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      parentId: category.parent_id,
      type: category.type,
      isActive: category.is_active,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    }))
  }

  // Buscar categorias filhas de um pai
  async findChildCategories(parentId: string): Promise<Category[]> {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    if (error) throw error
    
    return (categories || []).map((category: any) => ({
      id: category.id,
      userId: category.user_id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      parentId: category.parent_id,
      type: category.type,
      isActive: category.is_active,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    }))
  }

  // Verificar se categoria possui transações
  async hasTransactions(categoryId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
    
    if (error) throw error
    
    return (count || 0) > 0
  }

  // Verificar se categoria possui filhos
  async hasChildren(categoryId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', categoryId)
      .eq('is_active', true)
    
    if (error) throw error
    
    return (count || 0) > 0
  }

  // Contar categorias do usuário
  async count(userId: string, activeOnly: boolean = true): Promise<number> {
    let query = supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    
    const { count, error } = await query
    
    if (error) throw error
    
    return count || 0
  }

  // Buscar todas as categorias de um usuário
  async findAllByUserAll(userId: string): Promise<Category[]> {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('type', { ascending: true })
      .order('name', { ascending: true })
    
    if (error) throw error
    
    return (categories || []).map((category: any) => ({
      id: category.id,
      userId: category.user_id,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      parentId: category.parent_id,
      type: category.type,
      isActive: category.is_active,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    }))
  }
}
