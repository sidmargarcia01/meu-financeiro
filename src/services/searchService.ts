/**
 * 📄 Descrição: Busca global de lançamentos por descrição
 * 🧱 Contexto: Utilizado pelo SearchModal via /api/search
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: TypeScript
 * 🔍 Dependências: transactionRepository
 * ✅ Revisado: Sim
 *
 * CAMADA: Service
 * MÓDULO: Search
 * RESPONSABILIDADE: Busca global de lançamentos por descrição
 * NÃO DEVE: Acessar banco diretamente, importar Prisma ou Supabase,
 *            formatar resultados para UI
 * DEPENDE DE: transactionRepository
 */

import { transactionRepository } from '@/repositories/transactionRepository'

const SEARCH_MIN_LENGTH = 2
const SEARCH_MAX_RESULTS = 20

export const searchService = {
  async search(userId: string, term: string) {
    if (term.trim().length < SEARCH_MIN_LENGTH) {
      throw new Error('Termo de busca deve ter pelo menos 2 caracteres')
    }

    const transactions = await transactionRepository.search(userId, {
      term: term.trim(),
      limit: SEARCH_MAX_RESULTS,
    })

    return {
      transactions: transactions.slice(0, SEARCH_MAX_RESULTS),
      total: transactions.length,
      term: term.trim(),
    }
  },
}
