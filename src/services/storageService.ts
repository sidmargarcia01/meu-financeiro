/**
 * CAMADA: Service
 * MÓDULO: Storage
 * RESPONSABILIDADE: Gerenciar uploads e validação de armazenamento
 * NÃO DEVE: Acessar banco de dados diretamente
 * DEPENDE DE: UserRepository, Supabase Storage
 */

import { UserRepository } from '@/repositories/userRepository'

export interface StorageUsage {
  usedMb: number
  limitMb: number
  availableMb: number
  usagePercent: number
}

export class StorageService {
  constructor(
    private userRepository: UserRepository = new UserRepository()
  ) {}

  // Verificar se usuário pode fazer upload
  async canUpload(userId: string, fileSizeBytes: number): Promise<boolean> {
    const usage = await this.getStorageUsage(userId)
    const fileSizeMb = fileSizeBytes / (1024 * 1024)
    
    return usage.availableMb >= fileSizeMb
  }

  // Obter uso de armazenamento do usuário
  async getStorageUsage(userId: string): Promise<StorageUsage> {
    const plan = await this.userRepository.getUserPlan(userId)
    const currentUsage = await this.userRepository.getStorageUsage(userId)
    
    // Se não tem plano, é admin - sem limite
    if (!plan) {
      return {
        usedMb: currentUsage,
        limitMb: Number.MAX_SAFE_INTEGER,
        availableMb: Number.MAX_SAFE_INTEGER - currentUsage,
        usagePercent: 0
      }
    }
    
    const availableMb = Math.max(0, plan.storageLimitMb - currentUsage)
    const usagePercent = plan.storageLimitMb > 0 ? (currentUsage / plan.storageLimitMb) * 100 : 0
    
    return {
      usedMb: currentUsage,
      limitMb: plan.storageLimitMb,
      availableMb,
      usagePercent
    }
  }

  // Validar upload de anexo
  async validateAttachmentUpload(
    userId: string, 
    fileSizeBytes: number, 
    fileName: string
  ): Promise<{ allowed: boolean; error?: string }> {
    // Validar tamanho do arquivo (máximo 10MB por arquivo)
    const maxSizeBytes = 10 * 1024 * 1024
    if (fileSizeBytes > maxSizeBytes) {
      return {
        allowed: false,
        error: 'Arquivo muito grande. Tamanho máximo permitido: 10MB'
      }
    }
    
    // Validar tipo do arquivo
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain', 'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    // Extrair extensão do arquivo
    const extension = fileName.split('.').pop()?.toLowerCase()
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'csv', 'xls', 'xlsx']
    
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        allowed: false,
        error: 'Tipo de arquivo não permitido. Tipos permitidos: JPG, PNG, GIF, PDF, TXT, CSV, XLS, XLSX'
      }
    }
    
    // Verificar limite de armazenamento
    const canUpload = await this.canUpload(userId, fileSizeBytes)
    if (!canUpload) {
      const usage = await this.getStorageUsage(userId)
      return {
        allowed: false,
        error: `Espaço insuficiente. Você tem ${usage.availableMb.toFixed(1)}MB disponível de ${usage.limitMb}MB`
      }
    }
    
    return { allowed: true }
  }

  // Atualizar uso de armazenamento após upload
  async updateStorageUsage(userId: string, deltaBytes: number): Promise<void> {
    // Implementar lógica para atualizar o uso
    // Por enquanto, o UserRepository.getStorageUsage já calcula dinamicamente
    // Futuramente poderíamos ter uma tabela de storage_usage para otimizar
  }
}
