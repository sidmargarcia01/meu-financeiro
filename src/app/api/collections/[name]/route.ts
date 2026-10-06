import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { supabase } from '@/lib/requestSupabase'
import { z } from 'zod'

const allowed = new Set(['metas-economia', 'metas-centros', 'planejamento'])
const bodySchema = z.object({ version: z.number().int().nonnegative(), items: z.array(z.record(z.unknown())).max(1000) })

export async function GET(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  return withAuth(request, async (_req, user) => {
    const { name } = await context.params
    if (!allowed.has(name)) return NextResponse.json({ error: 'Coleção inválida' }, { status: 404 })
    const { data, error } = await supabase.from('saved_collections').select('items, version')
      .eq('user_id', user.id).eq('name', name).maybeSingle()
    if (error) return NextResponse.json({ error: 'Não foi possível carregar os dados' }, { status: 500 })
    return NextResponse.json(data ?? { items: [], version: 0 })
  })
}

export async function PUT(request: NextRequest, context: { params: Promise<{ name: string }> }) {
  return withAuth(request, async (req, user) => {
    const { name } = await context.params
    if (!allowed.has(name)) return NextResponse.json({ error: 'Coleção inválida' }, { status: 404 })
    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    const { items, version } = parsed.data
    if (JSON.stringify(items).length > 250000) return NextResponse.json({ error: 'Coleção muito grande' }, { status: 400 })
    const query = version === 0
      ? supabase.from('saved_collections').insert({ user_id: user.id, name, items, version: 1 })
      : supabase.from('saved_collections').update({ items, version: version + 1 })
        .eq('user_id', user.id).eq('name', name).eq('version', version)
    const { data, error } = await query.select('version').maybeSingle()
    if (error || !data) return NextResponse.json({ error: 'Não foi possível salvar. Recarregue para conferir alterações em outra sessão.' }, { status: 409 })
    return NextResponse.json({ version: data.version })
  })
}
