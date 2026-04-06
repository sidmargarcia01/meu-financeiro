# Vercel Configuration

## Passos para Configurar

### 1. Conectar Repositório
- Acesse: vercel.com → Add New Project → Import Git Repository
- Selecione: meu-financeiro

### 2. Variáveis de Ambiente

Antes do deploy, configure em Environment Variables:

| Variável | Valor | Onde encontrar |
|----------|-------|----------------|
| NEXT_PUBLIC_SUPABASE_URL | https://ctjzuolergnrsrijvsjw.supabase.co | Supabase → Settings → API |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | [chave anon] | Supabase → Settings → API |
| SUPABASE_SERVICE_ROLE_KEY | [chave service] | Supabase → Settings → API |
| DATABASE_URL | [connection string] | Supabase → Settings → Database → URI |
| DIRECT_URL | [direct connection] | Supabase → Settings → Database → Direct |
| NEXT_PUBLIC_APP_URL | https://meu-financeiro.vercel.app | URL gerada pelo Vercel |
| NODE_ENV | production | valor fixo |

**Marque todas as variáveis para:** Production, Preview, Development

### 3. Configurar Deploy Automático
- **Branch de produção**: main
- **Branch de preview**: develop  
- **Auto-deploy**: ativado

### 4. Fazer Deploy Inicial
- Clique em "Deploy"
- Aguarde conclusão
- Verifique se não há erros

### 5. Atualizar NEXT_PUBLIC_APP_URL
- Após primeiro deploy, pegue URL real
- Atualize a variável no painel Vercel
- Atualize também no .env.local

### 6. Verificação Final
- Acesse a URL gerada
- Confirme que a página de login abre corretamente

## Estrutura do Projeto no Vercel

```
meu-financeiro.vercel.app
├── / (página inicial)
├── /login (autenticação)
├── /dashboard (dashboard principal)
└── /api/* (endpoints da API)
```

## Build Configuration

O projeto já está configurado com:
- `next.config.js` - configuração do Next.js
- `package.json` - scripts de build
- `.vercel.json` - configuração específica do Vercel
