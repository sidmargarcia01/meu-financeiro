# GitHub Secrets Configuration

## Secrets necessários para o CI/CD

Acesse: GitHub → Settings → Secrets and variables → Actions → New repository secret

### 1. NEXT_PUBLIC_SUPABASE_URL
- **Valor**: URL do projeto Supabase
- **Onde encontrar**: Supabase → Settings → API → Project URL
- **Exemplo**: https://ctjzuolergnrsrijvsjw.supabase.co

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY  
- **Valor**: Chave pública do Supabase
- **Onde encontrar**: Supabase → Settings → API → anon public
- **Exemplo**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### 3. SUPABASE_SERVICE_ROLE_KEY
- **Valor**: Chave de serviço do Supabase
- **Onde encontrar**: Supabase → Settings → API → service_role  
- **Exemplo**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

## Verificação

Após configurar, verifique se os 3 secrets aparecem em:
Settings → Secrets and variables → Actions

## Pipeline CI/CD

O arquivo `.github/workflows/ci.yml` já está configurado para usar esses secrets nas variáveis de ambiente durante o build e testes.
