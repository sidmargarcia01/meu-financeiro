/**
 * CAMADA: Routes
 * MÓDULO: Settings
 * RESPONSABILIDADE: GET e PUT /api/settings — configurações do usuário
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, UserRepository, Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { withValidation } from '@/middlewares/validation'
import { supabase } from '@/lib/supabase'
import { userSettingsSchema } from '@/models/user'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      const defaults = {
        enable_competence_date: false,
        require_cost_center: false,
        require_project: false,
        require_contact: false,
        require_tag: false,
        require_subcategory: false,
        installment_default: 'VALOR_PARCELA',
      }

      const settings = data ?? defaults

      return NextResponse.json({
        enableCompetenceDate: settings.enable_competence_date,
        requireCostCenter: settings.require_cost_center,
        requireProject: settings.require_project,
        requireContact: settings.require_contact,
        requireTag: settings.require_tag,
        requireSubcategory: settings.require_subcategory,
        installmentDefault: settings.installment_default,
      })
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    return withValidation(req, userSettingsSchema, async (req, data) => {
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            enable_competence_date: data.enableCompetenceDate,
            require_cost_center: data.requireCostCenter,
            require_project: data.requireProject,
            require_contact: data.requireContact,
            require_tag: data.requireTag,
            require_subcategory: data.requireSubcategory,
            installment_default: data.installmentDefault,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })

        if (error) throw error

        return NextResponse.json({ success: true, settings: data })
      } catch (error) {
        return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
      }
    })
  })
}
