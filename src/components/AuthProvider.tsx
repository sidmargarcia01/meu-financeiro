/**
 * 📄 Descrição: Provider de autenticação Supabase para React
 * 🧱 Contexto: Context Provider para gerenciar estado de autenticação global
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-04
 * ⚙️ Tecnologias: React, Supabase, TypeScript
 * 🔍 Dependências: @supabase/supabase-js, useSupabaseAuth
 * ✅ Revisado: Não
 */

'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: any
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useSupabaseAuth()

  const value: AuthContextType = {
    ...auth,
    isAuthenticated: !!auth.session
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
