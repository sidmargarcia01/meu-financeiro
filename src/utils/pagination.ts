/**
 * CAMADA: Utils
 * MÓDULO: Paginação
 * RESPONSABILIDADE: Utilitários para paginação cursor-based
 * NÃO DEVE: Conter lógica de negócio
 * DEPENDE DE: Node.js
 */

export interface PaginationOptions {
  limit?: number
  cursor?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationResult<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
  total?: number
}

export interface CursorInfo {
  id: string
  createdAt: string
}

export class CursorPagination {
  static generateCursor(item: CursorInfo): string {
    return Buffer.from(`${item.id}:${item.createdAt}`).toString('base64')
  }

  static parseCursor(cursor: string): CursorInfo | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
      const [id, createdAt] = decoded.split(':')
      
      if (!id || !createdAt) {
        return null
      }
      
      return { id, createdAt }
    } catch {
      return null
    }
  }

  static buildWhereClause(cursor?: string, sortOrder: 'asc' | 'desc' = 'desc'): {
    where: string
    params: any[]
  } {
    if (!cursor) {
      return { where: '', params: [] }
    }

    const cursorInfo = this.parseCursor(cursor)
    if (!cursorInfo) {
      return { where: '', params: [] }
    }

    const operator = sortOrder === 'desc' ? '<' : '>'
    const where = `AND created_at ${operator} ? OR (created_at = ? AND id ${operator} ?)`
    
    return {
      where,
      params: [cursorInfo.createdAt, cursorInfo.createdAt, cursorInfo.id]
    }
  }

  static extractNextCursor<T extends CursorInfo>(
    items: T[],
    limit: number
  ): string | undefined {
    if (items.length <= limit) {
      return undefined
    }

    const lastItem = items[items.length - 1]
    return this.generateCursor(lastItem)
  }

  static applySorting<T extends CursorInfo>(
    items: T[],
    sortOrder: 'asc' | 'desc' = 'desc'
  ): T[] {
    return items.sort((a, b) => {
      const dateCompare = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      
      if (dateCompare !== 0) {
        return sortOrder === 'desc' ? -dateCompare : dateCompare
      }
      
      // Desempate por ID
      const idCompare = a.id.localeCompare(b.id)
      return sortOrder === 'desc' ? -idCompare : idCompare
    })
  }
}

// Função helper para criar opções de paginação a partir de query params
export function createPaginationOptions(query: any): PaginationOptions {
  const limit = Math.min(parseInt(query.limit) || 20, 100) // Máximo 100 itens
  const cursor = query.cursor as string
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'
  
  return { limit, cursor, sortOrder }
}
