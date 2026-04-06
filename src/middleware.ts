/**
 * 📄 Descrição: Middleware de autenticação para proteger rotas
 * 🧱 Contexto: Middleware Next.js para validação de sessão Supabase
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-04
 * ⚙️ Tecnologias: Next.js, Supabase, TypeScript
 * 🔍 Dependências: @supabase/supabase-js, next/server
 * ✅ Revisado: Não
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function getUser(accessToken: string) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: { user }, error } = await admin.auth.getUser(accessToken)
  return error ? null : user
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const accessToken = req.cookies.get('sb-access-token')?.value

  // Rotas de autenticação (login/cadastro) — redirecionar se já logado
  const authRoutes = ['/login', '/register', '/cadastro', '/recuperar-senha']
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (accessToken) {
      const user = await getUser(accessToken)
      if (user) return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Rotas de página protegidas — redirecionar se não logado
  const protectedPages = [
    '/dashboard', '/transactions', '/registers', '/reports',
    '/investments', '/business', '/settings', '/tools',
  ]
  if (protectedPages.some(route => pathname.startsWith(route))) {
    if (!accessToken) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    const user = await getUser(accessToken)
    if (!user) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // API routes — verificar e injetar x-user-id / x-user-email
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    if (!accessToken) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const user = await getUser(accessToken)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email ?? '')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
