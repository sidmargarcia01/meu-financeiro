/**
 * CAMADA: Pages
 * MÓDULO: Dashboard
 * RESPONSABILIDADE: Dashboard principal com resumo financeiro
 * NÃO DEVE: Conter lógica de API
 * DEPENDE DE: React, Next.js, Tailwind CSS, Lucide Icons
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react'

interface DashboardData {
  summary: {
    totalBalance: number
    projectedBalance: number
    monthIncome: number
    monthExpense: number
    monthNet: number
    lastMonthIncome: number
    lastMonthExpense: number
    lastMonthNet: number
    incomeVariation: number
    expenseVariation: number
    netVariation: number
  }
  categories: Array<{
    categoryId: string
    categoryName: string
    categoryColor?: string
    categoryIcon?: string
    total: number
    percentage: number
    transactionCount: number
  }>
  accounts: Array<{
    accountId: string
    accountName: string
    accountType: string
    currentBalance: number
    projectedBalance: number
    monthIncome: number
    monthExpense: number
  }>
  recent: Array<{
    id: string
    description: string
    amount: number
    type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
    status: 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO'
    dueDate: string
    accountName: string
    categoryName?: string
    tags?: string[]
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showBalances, setShowBalances] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }
        throw new Error('Erro ao carregar dados')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'RECEITA':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'DESPESA':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      case 'TRANSFERENCIA':
        return <CreditCard className="h-4 w-4 text-blue-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMADO':
        return 'text-green-600 bg-green-100'
      case 'PENDENTE':
        return 'text-yellow-600 bg-yellow-100'
      case 'CONCILIADO':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    )
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
            <p className="text-gray-600">{error || 'Não foi possível carregar os dados'}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Header Actions */}
      <div className="flex justify-end mb-6 space-x-4">
        <button
          onClick={() => setShowBalances(!showBalances)}
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          {showBalances ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
        
        <button
          onClick={handleLogout}
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Saldo Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {showBalances ? formatCurrency(data.summary.totalBalance) : '•••••'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Receitas do Mês</p>
              <p className="text-2xl font-bold text-gray-900">
                {showBalances ? formatCurrency(data.summary.monthIncome) : '•••••'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Despesas do Mês</p>
              <p className="text-2xl font-bold text-gray-900">
                {showBalances ? formatCurrency(data.summary.monthExpense) : '•••••'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PiggyBank className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Saldo Projetado</p>
              <p className="text-2xl font-bold text-gray-900">
                {showBalances ? formatCurrency(data.summary.projectedBalance) : '•••••'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contas */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Minhas Contas</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.accounts.map((account) => (
                  <div key={account.accountId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{account.accountName}</h3>
                      <p className="text-sm text-gray-500">{account.accountType}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {showBalances ? formatCurrency(account.currentBalance) : '•••••'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {showBalances ? formatCurrency(account.projectedBalance) : '•••••'} projetado
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Transações Recentes */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Transações Recentes</h2>
              <button className="p-2 rounded-md text-indigo-600 hover:bg-indigo-50">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {data.recent.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-xs text-gray-500">{transaction.accountName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {showBalances ? formatCurrency(transaction.amount) : '•••'}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
