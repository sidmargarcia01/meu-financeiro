/**
 * 📄 Descrição: Middleware de autenticação para proteger rotas
 * 🧱 Contexto: Middleware Next.js para validação de sessão Supabase
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-04
 * ⚙️ Tecnologias: Next.js, Supabase, TypeScript
 * 🔍 Dependências: @supabase/supabase-js, next/server
 * ✅ Revisado: Não
 */

import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          req.cookies.set(name, value)
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
        },
        remove(name: string, options: Record<string, unknown>) {
          req.cookies.set(name, '')
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set(name, '', { ...options, maxAge: 0 } as Parameters<typeof res.cookies.set>[2])
        },
      },
    }
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

    // Adicionar dados do usuário ao header para uso nas APIs
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', session.user.id)
    requestHeaders.set('x-user-email', session.user.email ?? '')

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
