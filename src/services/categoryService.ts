/**
 * CAMADA: Service
 * MÓDULO: Cadastros - Categorias
 * RESPONSABILIDADE: Regras de negócio de categorias
 *   - Hierarquia máxima de 2 níveis (categoria + subcategoria)
 *   - Subcategoria herda type do pai
 *   - Proibir exclusão com lançamentos ou subcategorias vinculadas
 *   - Proibir nomes duplicados no mesmo nível
 * NÃO DEVE: Acessar banco diretamente, importar Prisma ou Supabase
 * DEPENDE DE: categoryRepository
 */

import { categoryRepository } from '@/repositories/categoryRepository'
import type { CreateCategoryInput, UpdateCategoryInput, DreGroup } from '@/schemas/categorySchema'

export interface CategoryWithChildren {
  id: string
  name: string
  type: 'RECEITA' | 'DESPESA'
  parent_id: string | null
  dre_group: DreGroup | null
  user_id: string
  children: CategoryWithChildren[]
}

// Modelo padrão de categorias com dreGroup para DRE gerencial
const CATEGORIAS_PADRAO: Array<{
  name: string
  type: 'RECEITA' | 'DESPESA'
  dre_group: DreGroup
}> = [
    // ── Receitas ─────────────────────────────────────────────────────
    { name: 'Receita de Vendas', type: 'RECEITA', dre_group: 'RECEITA_BRUTA' },
    { name: 'Receita de Serviços', type: 'RECEITA', dre_group: 'RECEITA_BRUTA' },
    { name: 'Devoluções e Abatimentos', type: 'RECEITA', dre_group: 'DEDUCAO_RECEITA' },
    { name: 'Impostos sobre Receita', type: 'RECEITA', dre_group: 'DEDUCAO_RECEITA' },
    { name: 'Outras Receitas', type: 'RECEITA', dre_group: 'OUTRAS_RECEITAS' },
    // ── Despesas ─────────────────────────────────────────────────────
    { name: 'Custo de Mercadorias (CMV)', type: 'DESPESA', dre_group: 'CPV' },
    { name: 'Custo de Serviços (CSV)', type: 'DESPESA', dre_group: 'CPV' },
    { name: 'Salários e Encargos', type: 'DESPESA', dre_group: 'DESPESA_OPERACIONAL' },
    { name: 'Aluguel e Condomínio', type: 'DESPESA', dre_group: 'DESPESA_OPERACIONAL' },
    { name: 'Marketing e Publicidade', type: 'DESPESA', dre_group: 'DESPESA_OPERACIONAL' },
    { name: 'Tecnologia e Software', type: 'DESPESA', dre_group: 'DESPESA_OPERACIONAL' },
    { name: 'Despesas Administrativas', type: 'DESPESA', dre_group: 'DESPESA_OPERACIONAL' },
    { name: 'Manutenção e Conservação', type: 'DESPESA', dre_group: 'DESPESA_OPERACIONAL' },
    { name: 'Juros e Encargos Financeiros', type: 'DESPESA', dre_group: 'DESPESA_FINANCEIRA' },
    { name: 'Tarifas Bancárias', type: 'DESPESA', dre_group: 'DESPESA_FINANCEIRA' },
    { name: 'Outras Despesas', type: 'DESPESA', dre_group: 'OUTRAS_DESPESAS' },
  ]

export const categoryService = {
  async create(userId: string, input: CreateCategoryInput) {
    // Se tem parent_id, valida que o pai existe e pertence ao usuário
    if (input.parent_id) {
      const pai = await categoryRepository.findById(input.parent_id, userId)

      if (!pai) throw new Error('Categoria pai não encontrada')

      // Documentado: máximo 2 níveis - subcategoria não pode ter filhos
      if (pai.parent_id) {
        throw new Error('Subcategorias não podem ter filhos')
      }

      // Documentado: subcategoria herda type do pai
      if (pai.type !== input.type) {
        throw new Error('Subcategoria deve ter o mesmo tipo da categoria pai')
      }
    }

    // Verificar duplicidade no mesmo nível
    const duplicado = await categoryRepository.findByNameAndUser(
      input.name, userId, input.parent_id
    )
    if (duplicado) {
      throw new Error('Já existe uma categoria com este nome')
    }

    return categoryRepository.create(userId, input)
  },

  async getAll(userId: string, type?: string): Promise<CategoryWithChildren[]> {
    const flat = await categoryRepository.findAllByUser(userId, type ? { type } : {})

    // Montar hierarquia pai -> filhos
    const map = new Map<string, CategoryWithChildren>()
    const raizes: CategoryWithChildren[] = []

    for (const cat of flat) {
      map.set(cat.id, { ...cat, children: [] })
    }

    for (const cat of flat) {
      const node = map.get(cat.id)!
      if (cat.parent_id) {
        const pai = map.get(cat.parent_id)
        if (pai) pai.children.push(node)
      } else {
        raizes.push(node)
      }
    }

    return raizes
  },

  async update(id: string, userId: string, input: UpdateCategoryInput) {
    const existente = await categoryRepository.findById(id, userId)
    if (!existente) throw new Error('Categoria não encontrada')

    if (input.name) {
      const duplicado = await categoryRepository.findByNameAndUser(
        input.name, userId, existente.parent_id
      )
      if (duplicado && duplicado.id !== id) {
        throw new Error('Já existe uma categoria com este nome')
      }
    }

    return categoryRepository.update(id, userId, input)
  },

  async criarCategoriasPadrao(userId: string) {
    const existentes = await categoryRepository.findAllByUser(userId, {})
    const nomesExistentes = new Set(existentes.map(c => c.name.toLowerCase()))

    const para_criar = CATEGORIAS_PADRAO.filter(
      c => !nomesExistentes.has(c.name.toLowerCase())
    )

    const criadas = []
    for (const cat of para_criar) {
      const nova = await categoryRepository.create(userId, cat)
      criadas.push(nova)
    }

    return { criadas: criadas.length, ignoradas: CATEGORIAS_PADRAO.length - criadas.length }
  },

  async delete(id: string, userId: string) {
    const existente = await categoryRepository.findById(id, userId)

    // RLS garante isolamento, mas verificamos explicitamente
    if (!existente) throw new Error('Categoria não encontrada')

    // Documentado: não pode excluir com lançamentos vinculados
    const temLancamentos = await categoryRepository.hasTransactions(id, userId)
    if (temLancamentos) {
      throw new Error('Não é possível excluir categoria com lançamentos vinculados')
    }

    // Documentado: não pode excluir categoria pai com subcategorias
    const temFilhos = await categoryRepository.hasChildren(id, userId)
    if (temFilhos) {
      throw new Error('Não é possível excluir categoria com subcategorias')
    }

    return categoryRepository.delete(id, userId)
  }
}
