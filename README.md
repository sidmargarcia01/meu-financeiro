# 🏦 Meu Financeiro

Sistema completo de gestão financeira pessoal e empresarial, construído com **Next.js 14**, **TypeScript**, **Tailwind CSS** e **Supabase**, seguindo a metodologia **Anti Vibe Coding** e arquitetura em camadas.

## 🎯 Visão Geral

O **Meu Financeiro** é uma plataforma web moderna para controle financeiro completo, oferecendo:

- ✅ **Gestão completa de transações** (receitas, despesas, transferências)
- ✅ **Múltiplas contas bancárias** e cartões de crédito
- ✅ **Categorias hierárquicas** com cores e ícones
- ✅ **Dashboard interativo** com gráficos e resumos
- ✅ **Autenticação segura** com JWT
- ✅ **Interface responsiva** e moderna
- ✅ **API RESTful** completa
- ✅ **Cache e performance** otimizados

## 🏗️ Arquitetura

O sistema segue rigorosamente a **arquitetura em camadas**:

```
/src
  /app              → Páginas e rotas Next.js (App Router)
  /components       → Componentes React reutilizáveis
  /services         → Regras de negócio (coração do sistema)
  /repositories     → Acesso ao Supabase via Prisma
  /models          → Tipos, interfaces e schemas Zod
  /middlewares     → Autenticação, rate limiting, validação
  /utils           → Funções auxiliares puras
  /config          → Constantes e configurações
  /lib             → Cliente Supabase e Prisma
  /tests           → Testes organizados por camada
```

### **Princípios Fundamentais**

- 🔒 **Segurança desde o primeiro dia**
- 📊 **Performance otimizada** com cache
- 🎨 **UX intuitiva** e responsiva
- 🔧 **Código limpo** e documentado
- 🧪 **Testes como rede de segurança**
- 🚀 **Deploy automatizado** com CI/CD

## 🚀 Tecnologias

### **Frontend**
- **Next.js 14** com App Router
- **TypeScript** para tipagem forte
- **Tailwind CSS** para estilização
- **Lucide Icons** para interface
- **React Query** para cache de dados

### **Backend**
- **Next.js API Routes** (serverless)
- **Supabase** (PostgreSQL + Auth + Storage)
- **Prisma ORM** para acesso a dados
- **Zod** para validação de schemas
- **JWT** para autenticação

### **DevOps**
- **GitHub Actions** para CI/CD
- **Vercel** para deploy
- **Sentry** para monitoramento
- **ESLint + Prettier** para código limpo

## 📋 Funcionalidades

### **🔐 Autenticação & Segurança**
- Login/registro com validação
- Tokens JWT com expiração
- Rate limiting em rotas sensíveis
- Proteção XSS e SQL injection
- RLS (Row Level Security) no Supabase

### **💰 Core Financeiro**
- **CRUD completo** de transações
- **Motor de lançamentos** avançado:
  - Parcelamentos automáticos
  - Recorrências fixas
  - Transferências entre contas
  - Múltiplos regimes (caixa/competência)
- **Cálculo de saldos** em tempo real
- **Validação de limites** por plano

### **🏦 Gestão de Contas**
- Múltiplos tipos de contas:
  - Conta Corrente
  - Poupança
  - Investimento
  - Cartão de crédito
  - Carteira
- **Cartões de crédito** com limites e vencimentos
- **Saldos** individuais e consolidados

### **📊 Dashboard & Relatórios**
- **Dashboard principal** com resumo financeiro
- **Evolução mensal** de receitas/despesas
- **Análise por categorias**
- **Transações recentes** com status
- **Gráficos interativos**

### **🏷️ Categorias & Organização**
- **Categorias hierárquicas** (pai → filho)
- **Cores e ícones** personalizados
- **Tipos** (Receita/Despesa)
- **Filtros** avançados

## 🛠️ Setup & Instalação

### **Pré-requisitos**
- Node.js 20+
- npm ou yarn
- Conta Supabase

### **1. Clone o repositório**
```bash
git clone https://github.com/seu-usuario/meu-financeiro.git
cd meu-financeiro
```

### **2. Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
# Preencha as variáveis do Supabase
```

### **3. Instale as dependências**
```bash
npm install
```

### **4. Execute o banco de dados**
```bash
# Execute os scripts SQL na ordem numerada
# 01-plans.sql → 19-indexes.sql
```

### **5. Inicie o desenvolvimento**
```bash
npm run dev
```

Acesse `http://localhost:3000` 🎉

## 🧪 Testes

### **Executar todos os testes**
```bash
npm run test
```

### **Testes com coverage**
```bash
npm run test:coverage
```

### **Testes E2E**
```bash
npm run test:e2e
```

## 📦 Deploy

### **Produção (Vercel)**
```bash
npm run build
npm run start
```

### **CI/CD Automático**
O pipeline do GitHub Actions executa:
1. ✅ Type check
2. ✅ Lint
3. ✅ Security audit
4. ✅ Testes
5. ✅ Build
6. 🚀 Deploy automático para Vercel

## 📊 Monitoramento

### **Sentry**
- Erros em tempo real
- Performance tracking
- Release tracking
- User feedback

### **Health Check**
```bash
GET /api/health
```

## 🔧 Configuração Avançada

### **Variáveis de Ambiente**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=seu-dsn-sentry
```

### **Rate Limiting**
- **100 requisições/minuto** por IP
- **Burst protection** para picos
- **Tracking** de abusos

### **Cache**
- **5 minutos** para dashboard
- **1 hora** para relatórios
- **30 minutos** para categorias

## 🤝 Contribuindo

### **Fluxo de Trabalho**
1. Fork do projeto
2. Branch `feature/nome-da-feature`
3. Commits semânticos
4. Pull Request para `develop`
5. Code review obrigatório
6. Merge automático após aprovação

### **Padrões de Código**
- **Cabeçalho padrão** em todos os arquivos
- **Convenção de nomes** consistente
- **Sempre testar** antes de commitar
- **Documentar** mudanças significativas

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📧 Email: suporte@meu-financeiro.com
- 💬 Discord: [comunidade](https://discord.gg/meu-financeiro)
- 📖 Docs: [documentação](https://docs.meu-financeiro.com)

## 🗺️ Roadmap

### **Próximo Release (v2.0)**
- 📈 **Relatórios avançados** (DRE, DFC)
- 🏢 **Gestão empresarial** completa
- 📱 **App mobile** React Native
- 🤖 **AI** para categorização automática
- 🔄 **Importação** de extratos bancários

### **Futuro**
- 🌍 **Multi-moeda** (USD, EUR)
- 🏦 **Integrações bancárias** (Plaid)
- 📊 **Business Intelligence**
- 🎯 **Metas financeiras**
- 👥 **Multi-usuários** avançado

---

## 🎉 Conclusão

O **Meu Financeiro** representa a implementação completa de um sistema financeiro moderno, seguindo as melhores práticas de engenharia de software. Cada linha de código foi escrita com **disciplina**, **clareza** e **foco no valor real** para o usuário.

**Construído com ❤️ usando a metodologia Anti Vibe Coding**

---

*"Código que funciona é bom. Código que funciona e é bonito é melhor."*
