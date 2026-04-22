/**
 * 📄 Descrição: POST /api/categories/importar-padrao — Importar categorias padrão com dreGroup
 * 🧱 Contexto: Cadastros — modelo pronto para DRE gerencial
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-22
 * ⚙️ Tecnologias: Next.js App Router, TypeScript
 * 🔍 Dependências: categoryService.criarCategoriasPadrao, withAuth
 * ✅ Revisado: Sim
 *
 * CAMADA: Routes
 * MÓDULO: Cadastros - Categorias
 * RESPONSABILIDADE: Importar modelo de categorias pré-configurado com dreGroup
 * NÃO DEVE: Duplicar categorias já existentes
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { categoryService } from '@/services/categoryService'

export async function POST(request: NextRequest) {
  return withAuth(request, async (_req, user) => {
    try {
      console.log('[SEED] Iniciando criarCategoriasPadrao para user:', user.id)
      const resultado = await categoryService.criarCategoriasPadrao(user.id)
      console.log('[SEED] Resultado:', resultado)
      return NextResponse.json(resultado, { status: 201 })
    } catch (error: any) {
      console.error('[SEED] Erro completo:', error)
      console.error('[SEED] Message:', error.message)
      console.error('[SEED] Stack:', error.stack)
      return NextResponse.json(
        { error: 'Erro ao importar categorias padrão', details: error.message },
        { status: 500 }
      )
    }
  })
}
