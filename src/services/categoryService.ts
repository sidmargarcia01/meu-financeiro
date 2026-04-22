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

// Modelo padrão de categorias — 9 pais + 46 subcategorias (alinhado com personal-website)
// Estrutura hierárquica: pai com dreGroup, filhos herdam o mesmo grupo
const CATEGORIAS_PADRAO: Array<{
  name: string
  type: 'RECEITA' | 'DESPESA'
  dre_group: DreGroup
  children?: string[]
}> = [
    // ── 1. RECEITAS OPERACIONAIS (ROB) ─────────────────────────────────
    {
      name: 'Receitas Operacionais',
      type: 'RECEITA',
      dre_group: 'RECEITAS_OPERACIONAIS',
      children: [
        'Vendas de produtos',
        'Vendas de serviços',
        'Outras receitas operacionais',
      ],
    },

    // ── 2. RECEITAS NÃO OPERACIONAIS ───────────────────────────────────
    {
      name: 'Receitas não Operacionais',
      type: 'RECEITA',
      dre_group: 'RECEITAS_NAO_OPERACIONAIS',
      children: [
        'Juros recebidos',
        'Rendimentos de aplicações',
        'Outras receitas não operacionais',
      ],
    },

    // ── 3. CUSTOS OPERACIONAIS (CPV/CSP/CMV) ───────────────────────────
    {
      name: 'Custos Operacionais',
      type: 'DESPESA',
      dre_group: 'CUSTOS_OPERACIONAIS',
      children: [
        'Custo dos produtos vendidos (CPV)',
        'Custo dos serviços prestados (CSP)',
        'Custo de mercadorias vendidas (CMV)',
      ],
    },

    // ── 4. DESPESAS VARIÁVEIS → Margem de Contribuição ─────────────────
    {
      name: 'Despesas Variáveis',
      type: 'DESPESA',
      dre_group: 'DESPESAS_VARIAVEIS',
      children: [
        'Comissões sobre vendas',
        'Taxas de cartão de crédito',
        'Fretes sobre vendas',
        'Embalagens',
        'Outras despesas variáveis',
      ],
    },

    // ── 5. DESPESAS FIXAS → EBITDA ─────────────────────────────────────
    {
      name: 'Despesas Fixas',
      type: 'DESPESA',
      dre_group: 'DESPESAS_FIXAS',
      children: [
        'Aluguel',
        'Condomínio',
        'Folha de pagamento',
        'Encargos trabalhistas',
        'Contabilidade',
        'Energia elétrica',
        'Água e esgoto',
        'Telefone e internet',
        'Material de escritório',
        'Material de limpeza',
        'Manutenção e reparos',
        'Seguros',
        'Assinaturas e mensalidades',
        'Marketing e publicidade',
        'Outras despesas fixas',
      ],
    },

    // ── 6. DESPESAS NÃO OPERACIONAIS → EBT ─────────────────────────────
    {
      name: 'Despesas não Operacionais',
      type: 'DESPESA',
      dre_group: 'DESPESAS_NAO_OPERACIONAIS',
      children: [
        'Juros pagos',
        'Multas e encargos bancários',
        'Taxas bancárias',
        'Outras despesas não operacionais',
      ],
    },

    // ── 7. IMPOSTOS SOBRE FATURAMENTO → Receita Líquida ────────────────
    // IMPORTANTE: type = DESPESA (dedução da receita, não receita negativa)
    {
      name: 'Impostos sobre Faturamento',
      type: 'DESPESA',
      dre_group: 'IMPOSTOS_FATURAMENTO',
      children: [
        'Simples Nacional',
        'ISS',
        'ICMS',
        'PIS',
        'COFINS',
        'Outros impostos sobre faturamento',
      ],
    },

    // ── 8. IMPOSTOS SOBRE LUCRO ────────────────────────────────────────
    {
      name: 'Impostos sobre Lucro',
      type: 'DESPESA',
      dre_group: 'IMPOSTOS_LUCRO',
      children: [
        'IRPJ',
        'CSLL',
        'Outros impostos sobre lucro',
      ],
    },

    // ── 9. DISTRIBUIÇÃO DE LUCROS → Resultado Líquido ─────────────────
    {
      name: 'Distribuição de Lucros',
      type: 'DESPESA',
      dre_group: 'DISTRIBUICAO_LUCROS',
      children: [
        'Pró-labore',
        'Distribuição de lucros',
        'Dividendos',
      ],
    },
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

    let criadas = 0
    let ignoradas = 0

    for (const pai of CATEGORIAS_PADRAO) {
      // Verifica se a categoria pai já existe
      if (nomesExistentes.has(pai.name.toLowerCase())) {
        ignoradas += 1 + (pai.children?.length ?? 0)
        continue
      }

      // Cria categoria pai
      const parentCategory = await categoryRepository.create(userId, {
        name: pai.name,
        type: pai.type,
        dre_group: pai.dre_group,
      })
      criadas++

      // Cria subcategorias (filhos) herdando o mesmo type e dre_group
      if (pai.children && pai.children.length > 0) {
        for (const childName of pai.children) {
          if (!nomesExistentes.has(childName.toLowerCase())) {
            await categoryRepository.create(userId, {
              name: childName,
              type: pai.type,
              dre_group: pai.dre_group,
              parent_id: parentCategory.id,
            })
            criadas++
          } else {
            ignoradas++
          }
        }
      }
    }

    return { criadas, ignoradas }
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
