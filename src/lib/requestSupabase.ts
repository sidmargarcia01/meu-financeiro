import { AsyncLocalStorage } from 'node:async_hooks'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Each request gets its own client and JWT. Never share mutable auth state.
const clients = new AsyncLocalStorage<SupabaseClient>()

export function createRequestClient(token?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
    }
  )
}

export function runWithSupabase<T>(client: SupabaseClient, callback: () => T): T {
  return clients.run(client, callback)
}

export function getRequestSupabase(): SupabaseClient {
  const client = clients.getStore()
  if (!client) throw new Error('Consulta financeira sem contexto autenticado')
  return client
}

// Compatibility facade for repositories; resolves the client at call time.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = getRequestSupabase()
    const value = Reflect.get(client, property)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
