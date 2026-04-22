# FINAPP — Changelog

---

## Bloco 40 — Painel de Indicadores Gerenciais

**Data:** 2026-04-22  
**Branch:** develop

### Novidades

#### Backend

**Migration:** `supabase/migrations/20260422180000_add_dre_group_to_categories.sql`
- Adiciona coluna `dre_group TEXT` opcional à tabela `categories`
- Valores aceitos: `RECEITA_BRUTA | DEDUCAO_RECEITA | CPV | DESPESA_OPERACIONAL | DESPESA_FINANCEIRA | OUTRAS_RECEITAS | OUTRAS_DESPESAS`
- Prepara categorias para DRE estruturado em blocos gerenciais (v2)

**`src/services/reportService.ts`** — novos métodos
- `gerarBalanco(userId, date)` — computa Balanço Patrimonial simplificado:
  - **Ativo Circulante:** saldo das contas ativas (saldo inicial + movimentações pagas até a data)
  - **Passivo Circulante:** total de despesas pendentes com vencimento ≤ data
  - **PL:** Ativo Circulante − Passivo Total
- `gerarIndicadores(userId, inicio, fim)` — consolida KPIs das 3 bases:

| Seção | Indicador | Fórmula | Unit |
|-------|-----------|---------|------|
| Resultado | Receita Operacional Bruta | `totalReceitas` (DRE) | R$ |
| Resultado | Receita Líquida | `totalReceitas` (sem deduções v1) | R$ |
| Resultado | Margem Líquida % | `resultado / RL × 100` | % |
| Resultado | Resultado Líquido | `totalReceitas − totalDespesas` | R$ |
| Estrutura e Solvência | Liquidez Corrente | `AC / PC` | ratio |
| Estrutura e Solvência | Endividamento | `PT / PL` | ratio |
| Estrutura e Solvência | Participação Capital de Terceiros | `PT / PL` | ratio |
| Caixa | Geração de Caixa Operacional | `entradas − saídas` (DFC) | R$ |
| Caixa | GCO / Receita Líquida % | `CFO / RL × 100` | % |
| Caixa | Variação de Caixa | `saldoFinal − saldoInicial` (DFC) | R$ |

> Divisor zero → `value: null` (exibido como "N/A" no frontend)

**`src/app/api/reports/indicadores/route.ts`** — novo endpoint
- `GET /api/reports/indicadores?inicio=YYYY-MM-DD&fim=YYYY-MM-DD`
- Autenticado via `withAuth` (cookie `sb-access-token` ou Bearer)
- Resposta: `IndicatorsReportResponse { sections, period }`

#### Frontend

**`src/app/(authenticated)/gestao/indicadores/page.tsx`** — página substituída
- Título: "Indicadores do Negócio"
- Controle de período: ‹ select mês + select ano › com navegação ← →
- Renderiza seções (Resultado / Estrutura e Solvência / Caixa) como grupos de cards
- `IndicatorCard` — formata valor por unit: R$ (currency), % (1 decimal), ratio (2 decimais)
- Valor `null` exibido como **N/A**
- Placeholder ao final: "Em breve: evolução de Receita × Resultado"

#### Testes

**`src/services/reportService.indicators.spec.ts`** — 5 cenários:
1. Calcula todos os indicadores quando dados completos
2. Retorna `null` em margens quando Receita Líquida = 0
3. Retorna `null` em Liquidez Corrente quando Passivo Circulante = 0
4. Retorna GCO = 0 quando não há movimentações DFC
5. Repassa corretamente `startDate`/`endDate` na resposta

---

## Correções anteriores (22/04/2026)

- **fix(middleware):** `startsWith('/cadastro')` correspondia a `/cadastros/*` → redirect indevido para dashboard corrigido com match preciso (`pathname === route || pathname.startsWith(route + '/')`)
- **fix(auth):** cookie `sb-access-token` não era setado em `getInitialSession()` → APIs retornavam 401 no reload
- **fix(vercel):** `NODE_VERSION: "20"` adicionado em `vercel.json`; `engines: { node: ">=20.9.0" }` em `package.json`
- **fix(ci):** `codeql-action` atualizado de `@v2` para `@v3`
- **fix(date):** `RangeError: Invalid time value` corrigido com guards em `formatDate.ts`, `LancamentosProximosWidget.tsx` e `useLancamentosProximos.ts`
