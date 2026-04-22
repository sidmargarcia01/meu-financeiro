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
      const resultado = await categoryService.criarCategoriasPadrao(user.id)
      return NextResponse.json(resultado, { status: 201 })
    } catch (error) {
      console.error('[api/categories/importar-padrao POST]', error)
      return NextResponse.json({ error: 'Erro ao importar categorias padrão' }, { status: 500 })
    }
  })
}
