/**
 * CAMADA: Config
 * MÓDULO: Environment
 * RESPONSABILIDADE: Centralizar configurações e variáveis de ambiente
 * NÃO DEVE: Conter lógica de negócio ou acesso a dados
 * DEPENDE DE: Nenhuma
 */

// Configurações do ambiente
export const config = {
  // App
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',

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

// Validação de variáveis obrigatórias em TODOS os ambientes
const requiredVars = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', value: config.supabaseUrl },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: config.supabaseAnonKey },
]

// Em produção, validar também variáveis server-side
if (config.isProduction) {
  requiredVars.push(
    { name: 'SUPABASE_SERVICE_ROLE_KEY', value: config.supabaseServiceRoleKey },
    { name: 'JWT_SECRET', value: config.jwtSecret }
  )
}

const missingVars = requiredVars.filter(v => !v.value || v.value === 'undefined' || v.value === 'null')

if (missingVars.length > 0) {
  const errorMessage = `❌ Variáveis de ambiente obrigatórias faltando: ${missingVars.map(v => v.name).join(', ')}`
  if (config.isDevelopment) {
    // Em desenvolvimento, apenas avisar
    if (typeof window === 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('⚠️ ' + errorMessage)
    }
  } else {
    // Em produção, lançar erro
    throw new Error(errorMessage)
  }
}

// Configurações específicas por ambiente
export const isDevelopment = config.nodeEnv === 'development'
export const isProduction = config.nodeEnv === 'production'
export const isTest = config.nodeEnv === 'test'

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
