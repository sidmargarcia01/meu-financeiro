/**
 * 📄 Descrição: Middleware de autenticação para proteger rotas
 * 🧱 Contexto: Middleware Next.js para validação de sessão Supabase
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-04
 * ⚙️ Tecnologias: Next.js, Supabase, TypeScript
 * 🔍 Dependências: @supabase/supabase-js, next/server
 * ✅ Revisado: Não
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasSession = !!req.cookies.get('sb-access-token')?.value

  // Rotas de autenticação — redirecionar se já tem cookie de sessão
  // IMPORTANTE: usar match preciso (exato ou subrota com /) para evitar que
  // /cadastro corresponda erroneamente a /cadastros/categorias etc.
  const authRoutes = ['/login', '/register', '/cadastro', '/recuperar-senha']
  const isAuthRoute = authRoutes.some(
    route => pathname === route || pathname.startsWith(route + '/')
  )
  if (isAuthRoute) {
    if (hasSession) return NextResponse.redirect(new URL('/dashboard', req.url))
    return NextResponse.next()
  }

  // Rotas de página protegidas — redirecionar se não tem cookie
  const protectedPages = [
    '/dashboard',
    '/movimentacoes',
    '/cadastros',
    '/gestao',
    '/relatorios',
    '/cartoes',
    '/extrato',
    '/ferramentas',
    '/metas',
    '/investimentos',
    '/integracao-contabil',
  ]
  if (protectedPages.some(route => pathname.startsWith(route))) {
    if (!hasSession) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // API routes — remover x-user-id externo por segurança (será reinjetado pelo withAuth)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const requestHeaders = new Headers(req.headers)
    requestHeaders.delete('x-user-id')
    requestHeaders.delete('x-user-email')
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
     * - api/auth (auth API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
