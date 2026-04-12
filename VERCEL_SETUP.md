
# CONFIGURAÇÃO VERCEL

## 1. Conectar Repositório GitHub
1. Acesse: https://vercel.com
2. Clique em "New Project"
3. Importe o repositório GitHub: sidmargarcia01/meu-financeiro
4. Selecione o branch: develop

## 2. Configurar Build Settings
- Framework Preset: Next.js
- Build Command: npm run build
- Output Directory: .next
- Install Command: npm install

## 3. Configurar Variáveis de Ambiente
No Vercel Dashboard > Settings > Environment Variables, adicione:

NEXT_PUBLIC_SUPABASE_URL=https://ctjzuolergnrsrijvsjw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0anp1b2xlcmducnNyaWp2c2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyODY4MzMsImV4cCI6MjA5MDg2MjgzM30.qfxMn0Rqb-uhRYQTZj3BMxinGGsrAGyaMW0RS62AlG8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0anp1b2xlcmducnNyaWp2c2p3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4NjgzMywiZXhwIjoyMDkwODYyODMzfQ.iOBfh-E_sRVdJv8Vk6iifNxZbz_RYr8Cm4iU8aizr3c
DATABASE_URL=postgresql://postgres:e86aba519ed070448381ea41c2788fc3a98f39a4bc4e803290f9694b11ed096f@aws-0-sa-east-1.pooler.supabase.co:5432/postgres
JWT_SECRET=meu-financeiro-jwt-secret-2024-super-seguro-a1b2c3d4e5f6
JWT_REFRESH_SECRET=meu-financeiro-refresh-secret-2024-mais-seguro-x7y8z9w0q1r2

## 4. Configurar Domínio (Opcional)
- Em Settings > Domains, adicione seu domínio personalizado
- Configure DNS conforme instruções do Vercel

## 5. Deploy Automático
- Configure webhook para deploy automático
- Cada push para develop fará deploy automático
