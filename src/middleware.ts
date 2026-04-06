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

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rotas protegidas que requerem autenticação
  const protectedRoutes = [
    '/dashboard', '/transactions', '/registers', '/reports',
    '/investments', '/business', '/settings', '/tools',
    '/api/accounts', '/api/transactions', '/api/categories',
    '/api/dashboard', '/api/settings', '/api/reports',
    '/api/investments', '/api/cost-centers', '/api/projects',
    '/api/contacts', '/api/tags', '/api/import',
  ]
  
  // Rotas de autenticação que não devem ser acessadas quando logado
  const authRoutes = ['/login', '/register', '/cadastro', '/recuperar-senha']

  const { pathname } = req.nextUrl

  // Verificar se está tentando acessar rota protegida sem autenticação
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!session) {
      // Redirecionar para login
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Verificar se está tentando acessar rota de auth quando já está logado
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (session) {
      // Redirecionar para dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // API routes que requerem autenticação
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Adicionar ID do usuário ao header para uso nas APIs
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', session.user.id)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return res
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
