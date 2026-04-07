/**
 * CAMADA: Page/Layout
 * MODULO: App - Authenticated Routes
 * RESPONSABILIDADE: Aplicar MainLayout em todas as rotas autenticadas do grupo
 * NAO DEVE: Conter logica de negocio, acessar APIs diretamente
 * DEPENDE DE: MainLayout, useSupabaseAuth
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { session, loading, signOut } = useSupabaseAuth()

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login')
    }
  }, [loading, session, router])

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (loading || !session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ fontFamily: 'sans-serif', color: '#666' }}>Carregando...</p>
      </div>
    )
  }

  const userName =
    session.user?.user_metadata?.name ??
    session.user?.email?.split('@')[0] ??
    'Usuario'
  const userEmail = session.user?.email ?? ''

  return (
    <MainLayout userName={userName} userEmail={userEmail} onLogout={handleLogout}>
      {children}
    </MainLayout>
  )
}
