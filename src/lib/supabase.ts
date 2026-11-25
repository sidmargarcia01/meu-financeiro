/**
 * CAMADA: Config
 * MÓDULO: Supabase
 * RESPONSABILIDADE: Configurar e exportar cliente Supabase
 * NÃO DEVE: Conter lógica de negócio ou manipulação de dados
 * DEPENDE DE: @supabase/supabase-js
 */

// Legacy test import; production uses the authenticated PostgreSQL context.
export { supabase } from './requestSupabase'
