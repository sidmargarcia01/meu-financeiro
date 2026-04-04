/**
 * CAMADA: Config
 * MÓDULO: Prisma
 * RESPONSABILIDADE: Configurar e exportar cliente Prisma
 * NÃO DEVE: Conter lógica de negócio ou consultas diretas
 * DEPENDE DE: @prisma/client
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
