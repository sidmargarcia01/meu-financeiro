/**
 * CAMADA: Routes
 * MÓDULO: Dashboard - Widget Distribuição por Categoria
 * RESPONSABILIDADE: Retornar distribuição de despesas por categoria
 * NÃO DEVE: Conter lógica de cálculo, acessar banco diretamente
 * DEPENDE DE: dashboardService, middleware de autenticação, validação Zod
 */

import { NextRequest, NextResponse } from 'next/server'
import { dashboardService } from '@/services/dashboardService'
import { withAuth } from '@/middlewares/auth'
import { z } from 'zod'

// Schema de validação para query params
const categoriasSchema = z.object({
  mes: z.coerce.number().min(1).max(12),
  ano: z.coerce.number().min(2020).max(2100)
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (request, user) => {
    try {
      // Extrair e validar query params
      const { searchParams } = new URL(request.url)
      const queryParams = {
        mes: searchParams.get('mes'),
        ano: searchParams.get('ano')
      }

      const validation = categoriasSchema.safeParse(queryParams)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Parâmetros inválidos', details: validation.error.errors },
          { status: 400 }
        )
      }

      const { mes, ano } = validation.data

      // Buscar distribuição por categoria
      const categorias = await dashboardService.getDistribuicaoCategorias(user.id, mes, ano)

      return NextResponse.json(categorias)
    } catch (error) {
      console.error('Erro ao buscar distribuição por categoria:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  })
}
