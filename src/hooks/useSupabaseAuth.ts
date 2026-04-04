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
import { User, Session, AuthError } from '@supabase/supabase-js'
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
        }
      } catch (err) {
        console.error('Erro ao obter sessão inicial:', err)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Escutar mudanças na autenticação
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setError(error)
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      })
      
      if (error) {
        setError(error)
      }
      
      return { error }
    } catch (err) {
      const authError = new Error('Erro ao criar conta') as AuthError
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
