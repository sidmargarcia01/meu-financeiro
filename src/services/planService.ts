/**
 * CAMADA: Service
 * MÓDULO: Plan
 * RESPONSABILIDADE: Regras de negócio para gestão de planos e limites
 * NÃO DEVE: Acessar banco de dados diretamente
 * DEPENDE DE: UserRepository, TransactionRepository
 */

import { UserRepository } from '@/repositories/userRepository'
import { TransactionRepository } from '@/repositories/transactionRepository'

export interface PlanUsage {
  transactions: {
    used: number
    limit: number
    percentage: number
  }
  storage: {
    used: number // em bytes
    limit: number // em bytes
    percentage: number
  }
  users: {
    used: number
    limit: number
    percentage: number
  }
}

export interface Alert {
  type: 'warning' | 'error'
  message: string
  action?: string
}

export class PlanService {
  constructor(
    private userRepository: UserRepository = new UserRepository(),
    private transactionRepository: TransactionRepository = new TransactionRepository()
  ) {}

  async canCreateTransaction(userId: string): Promise<boolean> {
    const currentCount = await this.userRepository.countTransactionsThisMonth(userId)
    const plan = await this.userRepository.getUserPlan(userId)
    
    if (!plan) {
      return true // Admin ou sem plano
    }
    
    return currentCount < plan.transactionLimit
  }

  async canUploadFile(userId: string, fileSizeBytes: number): Promise<boolean> {
    const currentUsage = await this.userRepository.getStorageUsage(userId)
    const plan = await this.userRepository.getUserPlan(userId)
    
    if (!plan || !plan.storageLimitMb) {
      return true // Sem limite de storage
    }
    
    const limitBytes = plan.storageLimitMb * 1024 * 1024
    return (currentUsage + fileSizeBytes) <= limitBytes
  }

  async getUsage(userId: string): Promise<PlanUsage> {
    const [transactionCount, storageUsage, plan] = await Promise.all([
      this.userRepository.countTransactionsThisMonth(userId),
      this.userRepository.getStorageUsage(userId),
      this.userRepository.getUserPlan(userId)
    ])

    const defaultLimits = {
      transactionLimit: 100,
      storageLimitMb: 0,
      userLimit: 0
    }

    const limits = plan || defaultLimits

    return {
      transactions: {
        used: transactionCount,
        limit: limits.transactionLimit,
        percentage: limits.transactionLimit > 0 
          ? Math.round((transactionCount / limits.transactionLimit) * 100)
          : 0
      },
      storage: {
        used: storageUsage,
        limit: (limits.storageLimitMb || 0) * 1024 * 1024,
        percentage: (limits.storageLimitMb || 0) > 0
          ? Math.round((storageUsage / ((limits.storageLimitMb || 0) * 1024 * 1024)) * 100)
          : 0
      },
      users: {
        used: 0, // TODO: Implementar contagem de usuários adicionais
        limit: limits.userLimit,
        percentage: limits.userLimit > 0
          ? Math.round((0 / limits.userLimit) * 100)
          : 0
      }
    }
  }

  async hasFeature(userId: string, feature: string): Promise<boolean> {
    const plan = await this.userRepository.getUserPlan(userId)
    
    if (!plan) {
      return true // Admin tem todas as features
    }
    
    // Se não há objeto features, retorna false para qualquer feature específica
    if (!plan.features) {
      return false
    }
    
    const features = plan.features as Record<string, any>
    return features[feature] === true
  }

  async upgradePlan(userId: string, newPlanId: string): Promise<void> {
    // Verificar se usuário existe
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('Usuário não encontrado')
    }

    // Atualizar plano
    await this.userRepository.update(userId, { planId: newPlanId })
  }

  async canDowngradeToPlan(userId: string, targetPlan: any): Promise<boolean> {
    const currentUsage = await this.getUsage(userId)
    
    // Verificar se transações atuais excedem limite do novo plano
    if (currentUsage.transactions.used > targetPlan.transactionLimit) {
      throw new Error(
        `Não é possível fazer downgrade: você tem ${currentUsage.transactions.used} transações este mês, mas o plano ${targetPlan.name} permite apenas ${targetPlan.transactionLimit}`
      )
    }
    
    // Verificar se storage usado excede limite do novo plano
    if (targetPlan.storageLimitMb > 0 && currentUsage.storage.used > targetPlan.storageLimitMb * 1024 * 1024) {
      const usedMB = Math.round(currentUsage.storage.used / (1024 * 1024))
      throw new Error(
        `Não é possível fazer downgrade: você está usando ${usedMB}MB de storage, mas o plano ${targetPlan.name} permite apenas ${targetPlan.storageLimitMb}MB`
      )
    }
    
    return true
  }

  async getAlerts(userId: string): Promise<Alert[]> {
    const usage = await this.getUsage(userId)
    const alerts: Alert[] = []

    // Alertas de transações
    if (usage.transactions.percentage >= 100) {
      alerts.push({
        type: 'error',
        message: `Você excedeu o limite de transações mensais (${usage.transactions.used}/${usage.transactions.limit})`,
        action: 'upgrade_plan'
      })
    } else if (usage.transactions.percentage >= 90) {
      alerts.push({
        type: 'warning',
        message: `Você está usando ${usage.transactions.percentage}% do limite de transações mensais (${usage.transactions.used}/${usage.transactions.limit})`,
        action: 'upgrade_plan'
      })
    }

    // Alertas de storage
    if (usage.storage.percentage >= 100) {
      alerts.push({
        type: 'error',
        message: `Você excedeu o limite de storage (${Math.round(usage.storage.used / (1024 * 1024))}MB/${Math.round(usage.storage.limit / (1024 * 1024))}MB)`,
        action: 'cleanup_storage'
      })
    } else if (usage.storage.percentage >= 90) {
      alerts.push({
        type: 'warning',
        message: `Você está usando ${usage.storage.percentage}% do limite de storage (${Math.round(usage.storage.used / (1024 * 1024))}MB/${Math.round(usage.storage.limit / (1024 * 1024))}MB)`,
        action: 'cleanup_storage'
      })
    }

    return alerts
  }

  async checkLimits(userId: string, operation: 'transaction' | 'upload', data?: any): Promise<void> {
    switch (operation) {
      case 'transaction':
        if (!(await this.canCreateTransaction(userId))) {
          throw new Error('Limite mensal de transações atingido. Faça upgrade do plano para continuar.')
        }
        break
      
      case 'upload':
        const fileSize = data?.fileSize || 0
        if (!(await this.canUploadFile(userId, fileSize))) {
          throw new Error('Limite de storage atingido. Faça upgrade do plano ou libere espaço.')
        }
        break
      
      default:
        throw new Error('Operação não reconhecida')
    }
  }

  async getPlanInfo(userId: string) {
    const plan = await this.userRepository.getUserPlan(userId)
    const usage = await this.getUsage(userId)
    
    return {
      plan,
      usage,
      alerts: await this.getAlerts(userId)
    }
  }
}
