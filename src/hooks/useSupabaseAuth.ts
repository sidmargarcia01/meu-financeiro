/**
 * 📄 Descrição: Hook de autenticação Supabase para gerenciar sessão do usuário
 * 🧱 Contexto: Autenticação e gerenciamento de estado do usuário no frontend
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-04
 * ⚙️ Tecnologias: React, Supabase, TypeScript
 * 🔍 Dependências: @supabase/supabase-js
 * ✅ Revisado: Não
 */

'use client'

import { useState, useEffect } from 'react'
import { User, Session, AuthError, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UseSupabaseAuthReturn {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

export function useSupabaseAuth(): UseSupabaseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)

  useEffect(() => {
    // Obter sessão inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          setError(error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
          // Setar cookie para autenticar chamadas de API server-side (withAuth middleware)
          if (typeof document !== 'undefined') {
            if (session?.access_token) {
              const maxAge = session.expires_in ?? 3600
              document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`
            } else {
              document.cookie = 'sb-access-token=; path=/; max-age=0'
            }
          }
        }
      } catch (err) {
        console.error('Erro ao obter sessão inicial:', err)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Escutar mudanças na autenticação e sincronizar cookie
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (typeof document !== 'undefined') {
        if (session?.access_token) {
          const maxAge = session.expires_in ?? 3600
          document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`
        } else {
          document.cookie = 'sb-access-token=; path=/; max-age=0'
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error)
      } else if (data.session?.access_token && typeof document !== 'undefined') {
        const maxAge = data.session.expires_in ?? 3600
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`
      }

      return { error }
    } catch (err) {
      const authError = new Error('Erro ao fazer login') as AuthError
      setError(authError)
      return { error: authError }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setError(null)

      console.log('🚀 Starting signup...', { email, name })

      // Usar API com fallback para criação de usuário
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })

      console.log('📡 Response status:', response.status)

      const data = await response.json()
      console.log('📦 Response data:', data)

      if (!response.ok) {
        console.error('❌ Signup failed:', data.error)
        const authError = new Error(data.error || data.details || 'Erro ao criar conta') as AuthError
        setError(authError)
        return { error: authError }
      }

      console.log('✅ Signup successful')
      return { error: null }
    } catch (err: any) {
      console.error('💥 Signup exception:', err)
      const authError = new Error(err.message || 'Erro ao criar conta') as AuthError
      setError(authError)
      return { error: authError }
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) {
        setError(error)
      }

      return { error }
    } catch (err) {
      const authError = new Error('Erro ao redefinir senha') as AuthError
      setError(authError)
      return { error: authError }
    }
  }

  return {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword
  }
}
