/**
 * CAMADA: Utils
 * MÓDULO: Cache
 * RESPONSABILIDADE: Cache simples para cálculos custosos
 * NÃO DEVE: Conter lógica de negócio
 * DEPENDE DE: Node.js
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutos

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Limpar entradas expiradas
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Gerar chave baseada nos parâmetros
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    
    return `${prefix}:${sortedParams}`
  }
}

// Cache global para uso em toda aplicação
export const globalCache = new SimpleCache()

// Limpar cache periodicamente (executar a cada 10 minutos)
setInterval(() => {
  globalCache.cleanup()
}, 10 * 60 * 1000)
