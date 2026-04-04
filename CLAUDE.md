# CLAUDE.md — Regras de Arquitetura: Meu Financeiro

## Identidade do Projeto
Sistema de gestão financeira pessoal e empresarial.
Stack: Next.js, TypeScript, Tailwind, Shadcn/UI, Supabase, Prisma, Zod.

## Regras Absolutas
- Uma rota NUNCA acessa o banco diretamente
- Um service NUNCA importa do Supabase diretamente
- Um repository NUNCA contém regras de negócio
- Uma camada NUNCA pula outra camada
- NUNCA hardcode segredos ou variáveis de ambiente
- TODO arquivo começa com o cabeçalho padrão de camada

## Padrão de Nomenclatura
- Services: transactionService.ts, investmentService.ts
- Repositories: transactionRepository.ts
- Models/Schemas: transactionSchema.ts
- Routes: /api/transactions/route.ts

## Tratamento de Erros
- Erros internos: log detalhado no servidor, mensagem genérica ao usuário
- Nunca exponer stack traces ao usuário final
- Usar try/catch em toda operação de I/O

## Segurança
- Validar TODA entrada com Zod antes de passar ao service
- Verificar autenticação em toda rota protegida via middleware
- RLS ativo no Supabase como barreira adicional

## Cabeçalho Padrão para Todos os Arquivos

```typescript
/**
 * CAMADA: [Routes | Service | Repository | Model | Component | Util]
 * MÓDULO: [nome do módulo, ex: Transactions, Investments, Reports]
 * RESPONSABILIDADE: [descrição clara do que este arquivo faz]
 * NÃO DEVE: [lista do que este arquivo jamais deve fazer]
 * DEPENDE DE: [lista dos módulos que este arquivo importa]
 */
```

## Fluxo de Dados Obrigatório

1. **Camada de Entrada (Routes/Controllers)**
   - Recebe requisição HTTP
   - Valida formato dos dados com Zod
   - Verifica autenticação/autorização
   - Chama camada de serviço
   - Retorna resposta HTTP adequada

2. **Camada de Serviço (Services)**
   - Contém TODAS as regras de negócio
   - Valida permissões e limites
   - Orquestra múltiplas operações
   - NUNCA acessa banco diretamente
   - Usa repositories para persistência

3. **Camada de Repositório (Repositories)**
   - ÚNICA camada que acessa o Supabase/Prisma
   - Executa queries SQL
   - Mapeia resultados para models
   - NUNCA contém lógica de negócio

4. **Camada de Modelos (Models)**
   - Define interfaces e tipos TypeScript
   - Contém schemas de validação Zod
   - Contratos entre camadas

## Regras de Negócio Críticas

### Motor de Lançamentos
- **Saldo Projetado** = soma de PENDENTE + CONFIRMADO + CONCILIADO
- **Saldo Confirmado** = soma apenas de CONFIRMADO + CONCILIADO
- **Parcelamento**: criar N registros com recurrence_id
- **Fixo**: criar lançamentos futuros até data fim
- **Transferência**: gerar DESPESA na origem + RECEITA no destino

### Motor de Investimentos
- **Preço Médio** = (atual × médio + novo × preço) ÷ (atual + novo)
- **Rentabilidade** = (Atual + Proventos - Custo) ÷ Custo
- **Portfólio**: atualizar após cada operação

### Flags de Sistema
- Verificar user_settings ANTES de processar lançamentos
- Bloquear operações se flags obrigatórias não preenchidas
- Respeitar limites do plano do usuário

## Validação de Entrada

### Toda entrada DEVE ser validada com Zod:

```typescript
// Exemplo de schema
const createTransactionSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  type: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']),
  due_date: z.string().datetime(),
  // ... outros campos
})
```

## Tratamento de Erros

### Padrão de Resposta:

```typescript
// Sucesso
return NextResponse.json(data, { status: 200 })

// Erro de validação
return NextResponse.json(
  { error: 'Dados inválidos', details: error.errors },
  { status: 400 }
)

// Erro de negócio
return NextResponse.json(
  { error: 'Limite mensal atingido' },
  { status: 429 }
)

// Erro interno
return NextResponse.json(
  { error: 'Erro interno do servidor' },
  { status: 500 }
)
```

## Segurança Transversal

### Autenticação
- Middleware verifica JWT em toda rota protegida
- Supabase Auth como fonte de verdade
- RLS como barreira adicional no banco

### Autorização
- Verificar user_id em TODAS as operações
- Princípio do menor privilégio
- Nunca confiar apenas no frontend

### Rate Limiting
- Limitar requisições por IP/usuário
- Especialmente em rotas de autenticação
- Configurar headers de segurança HTTP

## Performance

### Queries
- Usar índices criados no banco
- Evitar N+1 queries
- Paginação cursor-based para grandes volumes

### Cache
- Cache no servidor para cálculos custosos
- React Query/SWR no cliente
- Invalidar cache apenas quando necessário

## Testes

### Estrutura
```
/src/tests
  /services     → Testes unitários (sem dependências externas)
  /repositories → Testes de integração (com banco de teste)
  /routes       → Testes de contrato (HTTP)
  /e2e          → Testes end-to-end
```

### Cobertura Mínima
- Services: 80%
- Repositories: 70%
- Routes: 90%

## Deploy

### CI/CD Pipeline
1. Type check
2. Lint
3. Security audit
4. Testes com coverage
5. Build
6. Deploy automático apenas se tudo passar

### Variáveis de Ambiente
- NUNCA no código
- Sempre no .env ou secrets do deploy
- Valores fictícios no .env.example

## Monitoramento

### Logs Estruturados
```typescript
logger.info('Transaction created', {
  userId,
  transactionId,
  amount,
  type
})
```

### Alertas
- Taxa de erro > 1%
- Tempo de resposta > 2s
- Tentativas de acesso suspeitas

## Checklist Antes de Commit

- [ ] Cabeçalho padrão no arquivo
- [ ] Sem regras de negócio em repositories
- [ ] Sem acesso direto ao banco em services
- [ ] Validação Zod na entrada
- [ ] Tratamento de erros adequado
- [ ] Testes passando
- [ ] Sem segredos expostos
- [ ] Performance considerada
