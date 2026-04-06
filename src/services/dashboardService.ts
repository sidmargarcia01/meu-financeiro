/**
 * CAMADA: Service
 * MÓDULO: Dashboard
 * RESPONSABILIDADE: Agregar dados de múltiplos repositórios para o dashboard
 * NÃO DEVE: Acessar banco de dados diretamente, importar Prisma ou Supabase,
 *            reimplementar regras já existentes em outros services
 * DEPENDE DE: accountRepository, transactionRepository
 */

import { accountRepository } from '@/repositories/accountRepository'
import { transactionRepository } from '@/repositories/transactionRepository'

class DashboardService {
  // ─── WIDGET 1: SALDO CONSOLIDADO ───────────────────────────────────────────

  async getSaldoConsolidado(userId: string) {
    // Buscar todas as contas ativas
    const accounts = await accountRepository.findAllByUser(userId, false)
    
    if (accounts.length === 0) {
      return {
        total_projetado: 0,
        total_confirmado: 0,
        por_conta: []
      }
    }
    
    // Para cada conta, buscar saldos
    const porConta = await Promise.all(
      accounts.map(async account => {
        // Buscar saldo projetado (todas as transações)
        const projetado = await transactionRepository.sumByAccount(account.id)
        
        // Buscar saldo confirmado (apenas transações confirmadas)
        const confirmado = await transactionRepository.sumByAccount(account.id, ['CONFIRMADO', 'CONCILIADO'])
        
        return {
          account_id: account.id,
          account_name: account.name,
          projetado,
          confirmado,
          currency: account.currency || 'BRL'
        }
      })
    )
    
    // Calcular totais
    const total_projetado = porConta.reduce((sum, conta) => sum + conta.projetado, 0)
    const total_confirmado = porConta.reduce((sum, conta) => sum + conta.confirmado, 0)
    
    return {
      total_projetado,
      total_confirmado,
      por_conta: porConta
    }
  }

  // ─── WIDGET 2: RESUMO MENSAL ──────────────────────────────────────────────

  async getResumoMensal(userId: string, mes?: number, ano?: number) {
    // Usar mês e ano correntes se não informados
    const agora = new Date()
    const mesAtual = mes || agora.getMonth() + 1
    const anoAtual = ano || agora.getFullYear()
    
    // Buscar resumo do mês corrente
    const resumoAtual = await transactionRepository.getMonthlySummary(userId, mesAtual, anoAtual)
    
    // Buscar resumo do mês anterior para comparativo
    let mesAnterior = mesAtual - 1
    let anoAnterior = anoAtual
    
    if (mesAnterior === 0) {
      mesAnterior = 12
      anoAnterior = anoAtual - 1
    }
    
    const resumoAnterior = await transactionRepository.getMonthlySummary(userId, mesAnterior, anoAnterior)
    
    // Calcular variações percentuais
    const variacaoReceitas = resumoAnterior.receitas > 0 
      ? ((resumoAtual.receitas - resumoAnterior.receitas) / resumoAnterior.receitas) * 100 
      : 0
    
    const variacaoDespesas = resumoAnterior.despesas > 0 
      ? ((resumoAtual.despesas - resumoAnterior.despesas) / resumoAnterior.despesas) * 100 
      : 0
    
    return {
      receitas: resumoAtual.receitas,
      despesas: resumoAtual.despesas,
      saldo: resumoAtual.receitas - resumoAtual.despesas,
      comparativo: {
        variacao_receitas: variacaoReceitas,
        variacao_despesas: variacaoDespesas
      }
    }
  }

  // ─── WIDGET 3: FLUXO DE CAIXA ────────────────────────────────────────────

  async getFluxoCaixa(userId: string, meses: number = 6) {
    const mesesArray = []
    const agora = new Date()
    
    // Gerar array com os últimos N meses
    for (let i = meses - 1; i >= 0; i--) {
      const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
      mesesArray.push({
        mes: data.getMonth() + 1,
        ano: data.getFullYear()
      })
    }
    
    // Para cada mês, buscar dados
    const dadosMeses = await Promise.all(
      mesesArray.map(async ({ mes, ano }) => {
        const resumo = await transactionRepository.getMonthlySummary(userId, mes, ano)
        
        return {
          mes,
          ano,
          receitas: resumo.receitas,
          despesas: resumo.despesas,
          saldo: resumo.receitas - resumo.despesas
        }
      })
    )
    
    return {
      meses: dadosMeses
    }
  }

  // ─── WIDGET 4: LANÇAMENTOS PRÓXIMOS ──────────────────────────────────────

  async getLancamentosProximos(userId: string) {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    // Calcular o range de datas: de 30 dias atrás até 7 dias à frente
    const dataInicio = new Date(hoje)
    dataInicio.setDate(dataInicio.getDate() - 30)
    
    const dataFim = new Date(hoje)
    dataFim.setDate(dataFim.getDate() + 7)
    
    // Buscar lançamentos pendentes no período
    const lancamentos = await transactionRepository.findUpcoming(userId, {
      status: 'PENDENTE',
      dateFrom: dataInicio.toISOString().split('T')[0],
      dateTo: dataFim.toISOString().split('T')[0]
    })
    
    // Separar vencidos dos próximos
    const vencidos = lancamentos.filter(l => {
      const dataVencimento = new Date(l.dueDate)
      dataVencimento.setHours(0, 0, 0, 0)
      return dataVencimento < hoje
    })
    
    const proximos7Dias = lancamentos.filter(l => {
      const dataVencimento = new Date(l.dueDate)
      dataVencimento.setHours(0, 0, 0, 0)
      return dataVencimento >= hoje && dataVencimento <= dataFim
    })
    
    return {
      vencidos,
      proximos_7_dias: proximos7Dias
    }
  }

  // ─── WIDGET 5: DISTRIBUIÇÃO POR CATEGORIA ────────────────────────────────

  async getDistribuicaoCategorias(userId: string, mes: number, ano: number) {
    // Buscar somatório por categoria de despesas
    const dadosCategorias = await transactionRepository.sumByCategory(userId, {
      type: 'DESPESA',
      mes,
      ano
    })
    
    // Calcular total de despesas
    const totalDespesas = dadosCategorias.reduce((sum, cat) => sum + cat.total, 0)
    
    // Calcular percentual de cada categoria
    const categorias = dadosCategorias.map(cat => ({
      category_id: cat.category_id,
      category_name: cat.category_name,
      total: cat.total,
      percentual: totalDespesas > 0 ? Math.round((cat.total / totalDespesas) * 100) : 0
    }))
    
    // Ordenar do maior para o menor
    categorias.sort((a, b) => b.total - a.total)
    
    return {
      total_despesas: totalDespesas,
      categorias
    }
  }
}

export const dashboardService = new DashboardService()
