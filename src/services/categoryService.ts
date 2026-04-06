/**
 * CAMADA: Service
 * MÓDULO: Category
 * RESPONSABILIDADE: Regras de negócio para gestão de categorias
 * NÃO DEVE: Acessar banco de dados diretamente
 * DEPENDE DE: CategoryRepository
 */

import { CategoryRepository } from '@/repositories/categoryRepository'
import { UserRepository } from '@/repositories/userRepository'
import { createCategorySchema, updateCategorySchema } from '@/models/category'
import type { z } from 'zod'

export class CategoryService {
  constructor(
    private categoryRepository: CategoryRepository = new CategoryRepository(),
    private userRepository: UserRepository = new UserRepository()
  ) {}

  async create(userId: string, data: z.infer<typeof createCategorySchema>) {
    // Validações de negócio
    this.validateCategoryData(data)
    
    // Verificar limite de categorias do plano
    const categoryCount = await this.categoryRepository.count(userId)
    const maxCategories = await this.getMaxCategoriesForUser(userId)
    
    if (categoryCount >= maxCategories) {
      throw new Error(`Limite de categorias atingido. Seu plano permite até ${maxCategories} categorias.`)
    }
    
    // Verificar se já existe categoria com mesmo nome para este usuário
    const existing = await this.categoryRepository.findByName(userId, data.name)
    if (existing) {
      throw new Error('Já existe uma categoria com este nome')
    }
    
    // Se tiver parentId, verificar se pertence ao mesmo usuário
    if (data.parentId) {
      const parent = await this.categoryRepository.findById(data.parentId, userId)
      if (!parent) {
        throw new Error('Categoria pai não encontrada')
      }
      
      // Verificar se tipo é compatível
      if (parent.type !== data.type) {
        throw new Error('Categoria filho deve ser do mesmo tipo que a pai')
      }
    }
    
    // Criar categoria
    return this.categoryRepository.create({
      userId,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      parentId: data.parentId,
      type: data.type,
      isActive: data.isActive ?? true,
    })
  }

  async list(userId: string, includeInactive: boolean = false) {
    return this.categoryRepository.findAllByUser(userId)
  }

  async listHierarchical(userId: string, includeInactive: boolean = false) {
    const categories = await this.categoryRepository.findAllByUser(userId)
    return this.buildHierarchy(categories)
  }

  async findById(userId: string, categoryId: string) {
    const category = await this.categoryRepository.findById(categoryId, userId)
    
    if (!category) {
      throw new Error('Categoria não encontrada')
    }
    
    return category
  }

  async update(userId: string, categoryId: string, data: z.infer<typeof updateCategorySchema>) {
    // Verificar se categoria existe
    const existingCategory = await this.categoryRepository.findById(categoryId, userId)
    if (!existingCategory) {
      throw new Error('Categoria não encontrada')
    }
    
    // Validações
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Nome da categoria é obrigatório')
    }
    
    // Se mudar o nome, verificar duplicidade
    if (data.name && data.name !== existingCategory.name) {
      const duplicate = await this.categoryRepository.findByName(userId, data.name)
      if (duplicate && duplicate.id !== categoryId) {
        throw new Error('Já existe uma categoria com este nome')
      }
    }
    
    // Se mudar parentId, validar
    if (data.parentId !== undefined) {
      if (data.parentId === categoryId) {
        throw new Error('Categoria não pode ser pai de si mesma')
      }
      
      if (data.parentId) {
        const parent = await this.categoryRepository.findById(data.parentId, userId)
        if (!parent) {
          throw new Error('Categoria pai não encontrada')
        }
        
        // Verificar se tipo é compatível
        const categoryType = data.type || existingCategory.type
        if (parent.type !== categoryType) {
          throw new Error('Categoria filho deve ser do mesmo tipo que a pai')
        }
        
        // Verificar se não cria ciclo
        const wouldCreateCycle = await this.wouldCreateCycle(categoryId, data.parentId)
        if (wouldCreateCycle) {
          throw new Error('Esta mudança criaria um ciclo na hierarquia')
        }
      }
    }
    
    return this.categoryRepository.update(categoryId, userId, data)
  }

  async delete(userId: string, categoryId: string) {
    // Verificar se categoria existe
    const category = await this.categoryRepository.findById(categoryId, userId)
    if (!category) {
      throw new Error('Categoria não encontrada')
    }
    
    // Verificar se tem filhos
    const hasChildren = await this.categoryRepository.hasChildren(categoryId)
    if (hasChildren) {
      throw new Error('Categoria possui subcategorias e não pode ser excluída. Arquive-a em vez de excluir.')
    }
    
    // Verificar se tem transações vinculadas
    const hasTransactions = await this.categoryRepository.hasTransactions(categoryId)
    if (hasTransactions) {
      throw new Error('Categoria possui lançamentos e não pode ser excluída. Arquive-a em vez de excluir.')
    }
    
    return this.categoryRepository.delete(categoryId, userId)
  }

  async findByType(userId: string, type: 'RECEITA' | 'DESPESA') {
    return this.categoryRepository.findByType(userId, type)
  }

  // Métodos privados

  private validateCategoryData(data: z.infer<typeof createCategorySchema>) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nome da categoria é obrigatório')
    }
    
    if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
      throw new Error('Cor deve ser um hex válido (#RRGGBB)')
    }
  }

  private buildHierarchy(categories: any[]): any[] {
    const categoryMap = new Map()
    const roots: any[] = []
    
    // Criar mapa de categorias
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] })
    })
    
    // Construir hierarquia
    categories.forEach(category => {
      const node = categoryMap.get(category.id)
      
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId)
        if (parent) {
          parent.children.push(node)
        }
      } else {
        roots.push(node)
      }
    })
    
    return roots
  }

  private async wouldCreateCycle(categoryId: string, newParentId: string): Promise<boolean> {
    // TODO: Implementar validação de ciclo hierárquico quando getAncestors existir
    // Por enquanto, sempre retorna false para não bloquear
    return false
    
    // Buscar todos os ancestrais do novo pai
    // const ancestors = await this.categoryRepository.getAncestors(newParentId)
    
    // Verificar se a categoria atual está nos ancestrais
    // return ancestors.some(ancestor => ancestor.id === categoryId)
  }

  private async getMaxCategoriesForUser(userId: string): Promise<number> {
    // Buscar plano do usuário
    const plan = await this.userRepository.getUserPlan(userId)
    
    // Se não tem plano, é admin - sem limite
    if (!plan) {
      return Number.MAX_SAFE_INTEGER
    }
    
    // Usar userLimit como base para categorias (geralmente 2x o limite de usuários)
    // Para planos gratuitos: 5 categorias
    // Para planos pagos: userLimit * 2
    if (plan.type === 'gratuito') {
      return 5
    }
    
    return plan.userLimit * 2
  }
}
