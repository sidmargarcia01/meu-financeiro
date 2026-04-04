# Scripts SQL do Meu Financeiro

## Ordem de Execução Obrigatória

Execute os scripts nesta ordem exata para respeitar as dependências entre tabelas:

### 1. Estrutura Base
- `01-plans.sql` - Planos (não depende de ninguém)
- `02-users.sql` - Usuários (depende de plans)
- `03-user-settings.sql` - Configurações (depende de users)

### 2. Cadastros Básicos
- `04-accounts.sql` - Contas (depende de users)
- `05-credit-cards.sql` - Cartões (depende de accounts)
- `06-categories.sql` - Categorias (depende de users)
- `07-recurrences.sql` - Recorrências (depende de users)

### 3. Módulo Empresarial
- `08-cost-centers.sql` - Centros de Custo (depende de users)
- `09-projects.sql` - Projetos (depende de users)
- `10-contacts.sql` - Contatos (depende de users)
- `11-tags.sql` - Tags (depende de users)

### 4. Transações Financeiras
- `12-transactions.sql` - Transações (depende de vários cadastros)
- `13-split-transactions.sql` - Divisões (depende de transactions)
- `14-transfers.sql` - Transferências (depende de accounts)
- `15-transaction-tags.sql` - Relacionamento Tags (depende de transactions, tags)

### 5. Investimentos
- `16-assets.sql` - Ativos (depende de users)
- `17-investments.sql` - Investimentos (depende de assets, users)

### 6. Auditoria e Performance
- `18-indexes.sql` - Índices de performance
- `19-check-rls.sql` - Verificação de RLS
- `20-create-user-trigger.sql` - Trigger de criação de usuário
- `21-check-plans.sql` - Verificação de planos
- `22-test-trigger.sql` - Teste do trigger
- `23-fix-plans-and-trigger.sql` - Ajuste de planos e trigger

## Scripts Recentes

### Trigger de Criação de Usuário (ITEM 1)
- `20-create-user-trigger.sql` - Cria função e trigger para automatizar criação de perfil
- `21-check-plans.sql` - Verifica se o plano "Gratuito Pessoal" existe
- `22-test-trigger.sql` - Script para testar se o trigger funciona
- `23-fix-plans-and-trigger.sql` - Ajusta nomes de planos e cria trigger completo

### Planos (ITEM 2)
- `23-fix-plans-and-trigger.sql` - Garante 8 planos (4 pessoais + 4 empresariais)
- `16-assets.sql` - Ativos (tabela independente)
- `17-investment-transactions.sql` - Operações (depende de assets)
- `18-portfolios.sql` - Posições (depende de assets)

### 6. Segurança e Performance
- `07-rls-policies.sql` - Políticas Row Level Security
- `08-indexes.sql` - Índices de performance
- `09-check-rls.sql` - Auditoria RLS (apenas verificação)

## Como Executar

### Via Supabase Dashboard
1. Abra o SQL Editor do seu projeto Supabase
2. Copie e cole cada script na ordem correta
3. Execute um por vez, verificando se não há erros

### Via CLI
```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref seu-projeto-ref

# Executar scripts em ordem
supabase db push --schema public
```

### Via Prisma (Recomendado)
```bash
# Com variáveis de ambiente configuradas
npx prisma db push

# Isso aplicará automaticamente todo o schema com índices
```

## Verificação

Após executar todos os scripts, verifique se:

1. ✅ Todas as 18 tabelas foram criadas
2. ✅ RLS está ativo em todas as tabelas
3. ✅ Índices foram criados corretamente
4. ✅ Triggers estão funcionando
5. ✅ Constraints estão ativas

### Scripts de Auditoria
Execute `09-check-rls.sql` para verificar:
- Status do RLS em cada tabela
- Políticas criadas
- Tabelas sem proteção
- Triggers de autenticação

## Políticas de Segurança

Todas as tabelas possuem RLS (Row Level Security) ativo com políticas que garantem:
- Usuários só acessam seus próprios dados
- Dados públicos (como assets) são apenas leitura
- Não há acesso cruzado entre usuários

## Performance

Índices críticos foram criados para:
- Queries de saldo por conta (`idx_transactions_user_account_status`)
- Relatórios por período (`idx_transactions_due_date`)
- Buscas por categoria e status
- Operações de investimento
- Dashboard queries (`idx_transactions_user_status_date`)

## Lista Completa de Tabelas

```
✅ plans                    - Planos do sistema
✅ users                    - Usuários
✅ user_settings            - Configurações personalizadas
✅ accounts                 - Contas bancárias
✅ credit_cards             - Cartões de crédito
✅ categories               - Categorias
✅ recurrences              - Recorrências
✅ cost_centers             - Centros de custo
✅ projects                 - Projetos
✅ contacts                 - Contatos
✅ tags                     - Tags
✅ transactions            - Transações
✅ split_transactions      - Rateio de transações
✅ transfers               - Transferências
✅ transaction_tags        - Tags de transações
✅ assets                   - Ativos de investimento
✅ investment_transactions - Operações de investimento
✅ portfolios              - Carteiras de investimento
```

## Variáveis de Ambiente

Configure no `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon_key
SUPABASE_SERVICE_ROLE_KEY=service_role_key
DATABASE_URL=postgresql://postgres:senha@aws-0-sa-east-1.pooler.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:senha@aws-0-sa-east-1.pooler.supabase.co:5432/postgres
```
