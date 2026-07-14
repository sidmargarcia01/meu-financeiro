/**
 * 📄 Descrição: Classificador DRE por fallback de palavras-chave para categorias sem `dre_group`
 * 🧱 Contexto: Compartilhado entre DRE e Fluxo de Caixa Gerencial
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-07-14
 * ⚙️ Tecnologias: TypeScript
 * 🔍 Dependências: Nenhuma externa
 * ✅ Revisado: Sim
 */

export type FallbackClassificacao = 'CUSTO' | 'FIXA' | 'VARIAVEL' | 'NAO_CLASSIFICADO'

const custosKeywords = [
  'mercadoria', 'produto para revenda', 'revenda', 'produção', 'producao',
  'matéria-prima', 'materia-prima', 'matéria prima', 'materia prima',
  'embalagem', 'custo de produção', 'cpv', 'csv'
]

const fixasKeywords = [
  'aluguel', 'salário', 'salario', 'salarios', 'folha', 'folha de pagamento',
  'pró-labore', 'pro-labore', 'prolabore', 'inss', 'fgts', 'férias', 'ferias',
  '13º', '13o', 'contabilidade', 'contador', 'financiamento', 'amortização',
  'amortizacao', 'depreciação', 'depreciacao', 'juros', 'empréstimo',
  'emprestimo', 'leasing', 'debenture', 'seguro', 'plano de saúde',
  'plano de saude', 'benefício', 'beneficio', 'transporte de funcionário',
  'vale transporte', 'vale alimentação', 'vale refeição', 'licença', 'licenca',
  'anuidade', 'sindico', 'síndico'
]

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Classifica uma despesa sem `dre_group` em Custo, Fixa ou Variável
 * com base no nome da categoria.
 */
export function classifyDespesaFallback(nomeCategoria: string): FallbackClassificacao {
  const nome = normalizar(nomeCategoria)

  if (custosKeywords.some(k => nome.includes(normalizar(k)))) {
    return 'CUSTO'
  }

  if (fixasKeywords.some(k => nome.includes(normalizar(k)))) {
    return 'FIXA'
  }

  // Default do projeto: variável (operacional)
  return 'VARIAVEL'
}

/**
 * Verifica se uma categoria de investimento é reconhecida por nome,
 * caso ainda não tenha `dre_group = INVESTIMENTOS`.
 */
export function classifyInvestimentoFallback(nomeCategoria: string): boolean {
  const nome = normalizar(nomeCategoria)
  const investimentoKeywords = [
    'investimento', 'equipamento', 'maquinario', 'maquinário', 'veiculo', 'veículo',
    'imovel', 'imóvel', 'software', 'licenca', 'licença', 'implementação', 'implementacao'
  ]
  return investimentoKeywords.some(k => nome.includes(normalizar(k)))
}
