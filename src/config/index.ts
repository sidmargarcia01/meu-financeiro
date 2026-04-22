/**
 * CAMADA: Config
 * MÓDULO: Environment
 * RESPONSABILIDADE: Centralizar configurações e variáveis de ambiente
 * NÃO DEVE: Conter lógica de negócio ou acesso a dados
 * DEPENDE DE: Nenhuma
 */

// Configurações específicas por ambiente (definidas antes do config para uso nele)
const nodeEnv = process.env.NODE_ENV || 'development'
const isDevelopment = nodeEnv === 'development'
const isProduction = nodeEnv === 'production'
const isTest = nodeEnv === 'test'

// Configurações do ambiente
export const config = {
  // App
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  nodeEnv,
  isDevelopment,
  isProduction,
  isTest,

  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,

  // Database
  databaseUrl: process.env.DATABASE_URL!,
  directUrl: process.env.DIRECT_URL!,

  // JWT
  jwtSecret: process.env.JWT_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,

  // Rate Limiting
  rateLimitRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos

  // Upload
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10'),
  uploadDir: process.env.UPLOAD_DIR || './uploads',

  // Monitoring
  sentryDsn: process.env.SENTRY_DSN,
}

// Validação de variáveis — apenas WARN no console, nunca lançar em module-level
// Isso evita quebrar o build estático do Next.js quando as vars não estão disponíveis
// O erro real ocorre em runtime nas funções que tentam usar os valores
const requiredVars = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', value: config.supabaseUrl },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: config.supabaseAnonKey },
]

const missingVars = requiredVars.filter(v => !v.value || v.value === 'undefined' || v.value === 'null')

if (missingVars.length > 0 && typeof window === 'undefined') {
  const errorMessage = `⚠️ Variáveis de ambiente faltando: ${missingVars.map(v => v.name).join(', ')}`
  // eslint-disable-next-line no-console
  console.warn(errorMessage)
}

// Re-export para compatibilidade
export { isDevelopment, isProduction, isTest }

// Configurações de features (flags)
export const features = {
  enableCompetenceDate: process.env.ENABLE_COMPETENCE_DATE === 'true',
  enableInvestments: process.env.ENABLE_INVESTMENTS === 'true',
  enableReports: process.env.ENABLE_REPORTS === 'true',
  enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true',
}

// Configurações de limites
export const limits = {
  maxTransactionsPerMonth: 1000,
  maxFileSizeBytes: config.maxFileSizeMb * 1024 * 1024,
  maxLoginAttempts: 5,
  sessionTimeoutMinutes: 30,
}

// Configurações de cache
export const cache = {
  defaultTtl: 300, // 5 minutos
  balanceTtl: 60, // 1 minuto
  reportTtl: 1800, // 30 minutos
}

export default config
