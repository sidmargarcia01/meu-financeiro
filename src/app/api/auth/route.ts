/**
 * CAMADA: Routes
 * MÓDULO: Auth
 * RESPONSABILIDADE: Endpoint de autenticação com Supabase
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withValidation } from '@/middlewares/validation'
import { z } from 'zod'

// Schema para login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Schema para registro
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2).max(100),
  planId: z.string().uuid().optional(),
})

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verificar se é login ou registro
    if (body.name) {
      return await register(request, body)
    } else {
      return await login(request, body)
    }
  } catch (error) {
    console.error('Erro na autenticação:', error)
    return NextResponse.json(
      { error: 'Erro ao processar autenticação' },
      { status: 500 }
    )
  }
}

async function login(request: NextRequest, body: any) {
  const { email, password } = body
  
  // Validar entrada
  const validation = loginSchema.safeParse({ email, password })
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: validation.error.errors },
      { status: 400 }
    )
  }
  
  // Autenticar com Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  })
  
  if (error) {
    return NextResponse.json(
      { error: 'Email ou senha inválidos' },
      { status: 401 }
    )
  }
  
  // Buscar dados completos do usuário
  const { data: userData } = await supabase
    .from('users')
    .select(`
      *,
      plan:plans(*),
      settings:user_settings(*)
    `)
    .eq('id', data.user.id)
    .single()
  
  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      ...userData,
    },
    session: data.session,
  })
}

async function register(request: NextRequest, body: any) {
  const { email, password, name, planId } = body
  
  // Validar entrada
  const validation = registerSchema.safeParse({ email, password, name, planId })
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: validation.error.errors },
      { status: 400 }
    )
  }
  
  // Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
    options: {
      data: {
        name: validation.data.name,
      },
    },
  })
  
  if (authError) {
    return NextResponse.json(
      { error: 'Erro ao criar conta', details: authError.message },
      { status: 400 }
    )
  }
  
  // Criar registro na tabela users
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user!.id,
      name: validation.data.name,
      planId: validation.data.planId || null,
      defaultCurrency: 'BRL',
    })
  
  if (userError) {
    return NextResponse.json(
      { error: 'Erro ao criar perfil', details: userError.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json({
    user: authData.user,
    message: 'Conta criada com sucesso. Verifique seu email para confirmar.',
  })
}

// GET /api/auth/user - Obter usuário atual
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    
    // Verificar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }
    
    // Buscar dados completos do usuário
    const { data: userData } = await supabase
      .from('users')
      .select(`
        *,
        plan:plans(*),
        settings:user_settings(*)
      `)
      .eq('id', user.id)
      .single()
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        ...userData,
      },
    })
  } catch (error) {
    console.error('Erro ao obter usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao obter usuário' },
      { status: 500 }
    )
  }
}

// DELETE /api/auth/logout - Logout
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    
    // Fazer logout no Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return NextResponse.json(
        { error: 'Erro ao fazer logout' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ message: 'Logout realizado com sucesso' })
  } catch (error) {
    console.error('Erro no logout:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    )
  }
}
