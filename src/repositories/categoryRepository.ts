/**
 * CAMADA: Repository
 * MÓDULO: Category
 * RESPONSABILIDADE: Acesso ao banco de dados para categorias
 * NÃO DEVE: Conter regras de negócio ou validação
 * DEPENDE DE: Prisma, Category models
 */

import { prisma } from '@/lib/prisma'

interface Category {
  id: string
  userId: string
  name: string
  type: 'RECEITA' | 'DESPESA'
  parentId?: string
  description?: string
  color?: string
  icon?: string
  isActive?: boolean
  createdAt: Date
}

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
}

export class CategoryRepository {
  // Criar categoria
  async create(data: {
    userId: string
    name: string
    type: 'RECEITA' | 'DESPESA'
    parentId?: string
    description?: string
    color?: string
    icon?: string
    isActive?: boolean
  }): Promise<Category> {
    const category = await prisma.category.create({
      data,
    })
    
    return category as Category
  }

  // Buscar categoria por ID
  async findById(id: string, userId: string): Promise<Category | null> {
    const category = await prisma.category.findFirst({
      where: { 
        id,
        userId 
      },
    })
    
    return category as Category | null
  }

  // Listar categorias do usuário
  async list(
    userId: string, 
    includeInactive: boolean = false
  ): Promise<Category[]> {
    const where: any = { userId }
    if (!includeInactive) where.isActive = true
    
    const categories = await prisma.category.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    })
    
    return categories as Category[]
  }

  // Buscar categorias por tipo
  async findByType(userId: string, type: 'RECEITA' | 'DESPESA'): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      where: {
        userId,
        type
      },
      orderBy: { name: 'asc' }
    })
    
    return categories as Category[]
  }

  // Buscar ancestrais de uma categoria
  async getAncestors(categoryId: string): Promise<Category[]> {
    const ancestors: Category[] = []
    let current = await this.findById(categoryId, '') // userId vazio para buscar qualquer
    
    while (current?.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: current.parentId }
      })
      
      if (parent) {
        ancestors.push(parent as Category)
        current = parent as Category
      } else {
        break
      }
    }
    
    return ancestors
  }

  // Listar categorias em árvore (com hierarquia)
  async listTree(
    userId: string, 
    type?: 'RECEITA' | 'DESPESA'
  ): Promise<CategoryWithChildren[]> {
    const where: any = { userId }
    if (type) where.type = type
    
    // Buscar todas categorias
    const categories = await prisma.category.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    })
    
    // Construir árvore
    const categoryMap = new Map()
    const roots: CategoryWithChildren[] = []
    
    // Criar mapa
    categories.forEach((category: any) => {
      categoryMap.set(category.id, { ...category, children: [] })
    })
    
    // Construir hierarquia
    categories.forEach((category: any) => {
      const categoryWithChildren = categoryMap.get(category.id)
      
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId)
        if (parent) {
          parent.children.push(categoryWithChildren)
        }
      } else {
        roots.push(categoryWithChildren)
      }
    })
    
    return roots
  }

  // Listar categorias raiz (sem pai)
  async listRoot(
    userId: string, 
    type?: 'RECEITA' | 'DESPESA'
  ): Promise<Category[]> {
    const where: any = { 
      userId,
      parentId: null 
    }
    if (type) where.type = type
    
    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    })
    
    return categories as Category[]
  }

  // Listar subcategorias de uma categoria
  async listChildren(parentId: string, userId: string): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      where: { 
        parentId,
        userId 
      },
      orderBy: { name: 'asc' }
    })
    
    return categories as Category[]
  }

  // Atualizar categoria
  async update(
    id: string,
    userId: string,
    data: Partial<{
      name?: string
      type?: 'RECEITA' | 'DESPESA'
      parentId?: string
    }>
  ): Promise<Category> {
    const category = await prisma.category.update({
      where: { 
        id,
        userId 
      },
      data,
    })
    
    return category as Category
  }

  // Excluir categoria
  async delete(id: string, userId: string): Promise<void> {
    await prisma.category.delete({
      where: { 
        id,
        userId 
      },
    })
  }

  // Verificar se categoria tem transações vinculadas
  async hasTransactions(id: string): Promise<boolean> {
    const count = await prisma.transaction.count({
      where: { categoryId: id },
    })
    
    return count > 0
  }

  // Verificar se categoria tem filhos
  async hasChildren(id: string): Promise<boolean> {
    const count = await prisma.category.count({
      where: { parentId: id },
    })
    
    return count > 0
  }

  // Verificar se categoria existe e pertence ao usuário
  async exists(id: string, userId: string): Promise<boolean> {
    const category = await prisma.category.findFirst({
      where: { 
        id,
        userId 
      },
      select: { id: true },
    })
    
    return !!category
  }

  // Buscar categoria por nome
  async findByName(
    name: string, 
    userId: string, 
    type?: 'RECEITA' | 'DESPESA'
  ): Promise<Category | null> {
    const where: any = { 
      name: { 
        equals: name, 
        mode: 'insensitive' 
      },
      userId 
    }
    if (type) where.type = type
    
    const category = await prisma.category.findFirst({
      where,
    })
    
    return category as Category | null
  }

  // Mover subcategorias para outra categoria pai
  async moveChildrenToParent(
    oldParentId: string, 
    newParentId?: string
  ): Promise<void> {
    await prisma.category.updateMany({
      where: { parentId: oldParentId },
      data: { parentId: newParentId },
    })
  }
}

// Exportar instância singleton
export const categoryRepository = new CategoryRepository()
