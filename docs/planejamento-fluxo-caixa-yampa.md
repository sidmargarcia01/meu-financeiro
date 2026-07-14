# 📊 Projeto Técnico — Fluxo de Caixa Gerencial (Modelo Yampa/4blue)

> **📄 Descrição:** Especificação técnica completa para reformular a aba Fluxo de Caixa (`/movimentacoes/fluxo`) no formato matriz mensal gerencial com colunas REALIZADO / AV / AH por mês, conforme referência do app Yampa.
> **🧱 Contexto:** Módulo Movimentações — evolução da página atual sem quebrar API/serviços existentes.
> **📌 Responsável:** Windsurf AI (planejamento) → implementação por outro desenvolvedor.
> **📅 Data:** 2026-07-14
> **⚙️ Tecnologias:** Next.js App Router, React, TypeScript, Material-UI, Supabase, Zod, TanStack Query.
> **✅ Revisado:** Sim

---

## 1. Objetivo

Substituir a visão atual de Fluxo de Caixa (barras + tabela simples Receitas/Despesas/Saldo) por uma **matriz gerencial mensal** idêntica ao modelo da imagem de referência:

| Estrutura | Descrição |
|---|---|
| **Colunas** | Um bloco por mês, cada bloco com 3 colunas: `REALIZADO`, `AV`, `AH` |
| **Linhas** | Indicadores gerenciais calculados (ver §3) + categorias expansíveis ("mostrar contas filhas") |
| **Toggle** | "Mostrar contas filhas" — expande cada grupo em suas categorias/subcategorias |

---

## 2. Definições das Fórmulas (contrato de negócio)

### 2.1 Colunas

- **REALIZADO** — soma das transações com status `CONFIRMADO`/`CONCILIADO` no mês (regime CAIXA, campo `due_date`, mesmo critério do `gerarDRE`). Despesas exibidas com sinal negativo.
- **AV (Análise Vertical)** — `AV = valor_linha / receita_faturamento_do_mês × 100`. Base = linha RECEITA/FATURAMENTO (100%). Exibir com sinal conforme a linha (na imagem despesas aparecem positivas em AV — usar `|valor| / receita × 100`, exceto linhas de resultado que mantêm sinal).
- **AH (Análise Horizontal)** — `AH = (valor_mês − valor_mês_anterior) / |valor_mês_anterior| × 100`. Primeiro mês do período: AH vazio (`null`). Se mês anterior = 0: AH vazio.

### 2.2 Linhas (ordem exata da imagem)

| # | Linha | Fórmula | Origem |
|---|---|---|---|
| 1 | **RECEITA/FATURAMENTO** | Σ receitas operacionais | `dre_group = RECEITAS_OPERACIONAIS` (+ `IMPOSTOS_FATURAMENTO` como filha negativa, ver nota) |
| 2 | **CUSTOS VARIÁVEIS** | −Σ custos | `CUSTOS_OPERACIONAIS + DESPESAS_VARIAVEIS` |
| 3 | **MARGEM DE CONTRIBUIÇÃO** | `L1 + L2` (custos já negativos) | calculado |
| 4 | **DESPESAS FIXAS** | −Σ fixas | `DESPESAS_FIXAS` |
| 5 | **LUCRO OPERACIONAL ANTES DOS INVESTIMENTOS** | `L3 + L4` | calculado |
| 6 | **INVESTIMENTOS** | −Σ investimentos | novo `dre_group = INVESTIMENTOS` (ver §4.1) |
| 7 | **DESPESA OPERACIONAL TOTAL** | `L2 + L4 + L6` | calculado |
| 8 | **LUCRO OPERACIONAL** | `L5 + L6` (= `L1 + L7`) | calculado — aparece também no topo da tabela (linha fixa de destaque) |
| 9 | **MOVIMENTAÇÕES NÃO OPERACIONAIS** | `RECEITAS_NAO_OPERACIONAIS − DESPESAS_NAO_OPERACIONAIS − IMPOSTOS_LUCRO − DISTRIBUICAO_LUCROS` | dre_groups existentes |
| 10 | **RESULTADO LÍQUIDO** | `L8 + L9` | calculado |
| 11 | **PONTO DE EQUILÍBRIO ANTES DO INVESTIMENTO** | `|Despesas Fixas| / %MC` onde `%MC = MC / Receita` | calculado; se `%MC ≤ 0` → vazio |
| 12 | **PONTO DE EQUILÍBRIO COM INVESTIMENTO** | `(|Despesas Fixas| + |Investimentos|) / %MC` | calculado; mesma regra |
| 13 | **ACERTO DO CAIXA** | `Saldo Final Real (contas) − (Saldo Inicial + Resultado Líquido)` | diferença de conciliação — transações `TRANSFERENCIA`, ajustes manuais, lançamentos sem categoria |
| 14 | **SALDO INICIAL** | `Saldo Final do mês anterior`; 1º mês do período = saldo acumulado das contas até o último dia do mês anterior | `transactionRepository.sumByAccount`-like com corte de data |
| 15 | **SALDO FINAL** | `L14 + L10 + L13` | calculado |

**Notas de negócio:**
- AV das linhas 11/12 (Ponto de Equilíbrio) usa a mesma base receita (na imagem: 78%, 87%).
- AH não se aplica a Acerto do Caixa (imagem mostra vazio).
- Linha "LUCRO OPERACIONAL" aparece **duas vezes** na imagem (topo e posição 8) — replicar: primeira linha fixa acima de tudo com os mesmos valores.

### 2.3 Contas filhas (expansão)

Cada linha de grupo (1, 2, 4, 6, 9) é expansível (`▶`) mostrando:
- **Nível 1:** categorias pai do grupo, com REALIZADO/AV/AH próprios.
- **Nível 2:** subcategorias (`parent_id`), mesmo formato.
- Reutilizar a lógica de agregação pai/filho já validada em `reportService.gerarDRE` (mapa `parentCatMap` + `subcategorias`).

---

## 3. Arquitetura da Solução

**Princípio: aditivo, não destrutivo.** Nada da API `/api/dashboard/fluxo-caixa` nem do `FluxoCaixaWidget` do dashboard é alterado — eles continuam servindo o widget. A nova matriz ganha endpoint e service próprios.

```
src/
├── app/api/reports/fluxo-gerencial/route.ts      [NOVO] GET ?inicio&fim&regime
├── services/fluxoGerencialService.ts              [NOVO] cálculo da matriz
├── repositories/transactionRepository.ts          [ALTERAR] +2 métodos (§4.3)
├── hooks/useFluxoGerencial.ts                     [NOVO] TanStack Query
├── components/fluxo/
│   ├── FluxoGerencialTable.tsx                    [NOVO] matriz com sticky header/coluna
│   ├── FluxoGerencialRow.tsx                      [NOVO] linha + expansão de filhas
│   └── FluxoGerencialToolbar.tsx                  [NOVO] período, regime, toggle filhas
├── app/(authenticated)/movimentacoes/fluxo/page.tsx  [ALTERAR] usa novos componentes
├── schemas/categorySchema.ts                      [ALTERAR] +INVESTIMENTOS (§4.1)
└── tests/services/fluxoGerencialService.test.ts   [NOVO]
```

### 3.1 Contrato da API — `GET /api/reports/fluxo-gerencial`

Query params (validar com Zod): `inicio` (YYYY-MM-DD), `fim` (YYYY-MM-DD), `regime` (`CAIXA` default | `COMPETENCIA`). Máximo 24 meses.

```ts
interface FluxoGerencialResponse {
  periodo: { inicio: string; fim: string }
  regime: 'CAIXA' | 'COMPETENCIA'
  meses: Array<{ mes: number; ano: number }>          // ordenado antigo → recente
  linhas: FluxoLinha[]                                 // ordem de exibição
}

interface FluxoLinha {
  id: string                       // ex: 'receita_faturamento', 'cat:<uuid>'
  label: string
  tipo: 'grupo' | 'calculado' | 'categoria' | 'subcategoria'
  nivel: 0 | 1 | 2                 // indentação
  parentId?: string                // para filhas
  destaque: boolean                // linhas de resultado (fundo destacado)
  valores: Array<{
    realizado: number              // sinal: despesas negativas
    av: number | null              // % — null quando não aplicável
    ah: number | null              // % — null no 1º mês ou base 0
  }>                               // mesmo índice de `meses`
}
```

**Decisão:** o backend entrega valores + AV + AH prontos (service é a única fonte de fórmulas → testável; o front só formata).

### 3.2 Fluxo de dados do service (`fluxoGerencialService.gerarMatriz`)

1. **1 query** de transações do período inteiro (mesmo select do `gerarDRE`: `categories(id, name, type, parent_id, dre_group)`), regime/status igual ao DRE.
2. **1 query** de saldo anterior: soma de `amount` de transações confirmadas com `due_date < inicio` (todas as contas ativas) → Saldo Inicial do 1º mês.
3. Bucketing em memória por `(ano, mes)` × `dre_group` × categoria pai × subcategoria.
4. Calcular linhas 1–15 por mês (§2.2), depois AV e AH em passada final.
5. Saldo Inicial/Final encadeados mês a mês.

⚠️ **Não** usar N chamadas `getMonthlySummary` por mês (padrão atual do `getFluxoCaixa` — N×meses queries). Uma query única para o período elimina o problema de performance.

### 3.3 Fallback sem `dre_group`

Usuários sem classificação: reutilizar **exatamente** o fallback por keywords do `gerarDRE` (custos/fixas/variáveis). **Refatorar essa lógica para função pura exportada** (ex: `classifyDespesaFallback(nomeCategoria): 'CUSTO' | 'FIXA' | 'VARIAVEL'` em `src/services/dreClassifier.ts`) e consumi-la em ambos os services — regra 20 (eliminar redundância). `INVESTIMENTOS` sem classificação = 0.

---

## 4. Alterações em Código Existente (pontos de atenção)

### 4.1 `categorySchema.ts` — novo grupo `INVESTIMENTOS`

Adicionar `'INVESTIMENTOS'` a `DRE_GROUPS` + label em `DRE_GROUP_LABELS`.

- ✅ Aditivo: Zod `z.enum` passa a aceitar o valor novo; valores antigos continuam válidos.
- ⚠️ Verificar se a coluna `dre_group` no Supabase tem CHECK constraint / enum PostgreSQL — se sim, criar migration SQL adicionando o valor.
- ⚠️ `reportService.gerarDRE`: categorias `INVESTIMENTOS` hoje cairiam fora dos `sumGroup` existentes. Decidir com o produto: no DRE, somar `INVESTIMENTOS` junto de `DESPESAS_FIXAS` ou criar linha própria. **Não deixar valor "sumir" do DRE.**
- Atualizar o seletor de grupo na página `cadastros/categorias` (deve ser automático se ela itera `DRE_GROUPS`— confirmar).

### 4.2 `page.tsx` do fluxo

Reescrever a página para a matriz. **Manter** o seletor de período (evoluir para intervalo de meses ou manter 3/6/12) e o botão Atualizar. O gráfico de barras atual pode ser mantido como aba secundária ("Gráfico" | "Matriz") — decisão de produto; padrão sugerido: Matriz como visão principal.

### 4.3 `transactionRepository.ts`

Adicionar (sem tocar nos métodos existentes):
- `findAllForPeriodWithCategory(userId, inicio, fim, statusFilter, dateField)` — select único usado pelo novo service.
- `sumConfirmedBefore(userId, date)` — saldo acumulado para Saldo Inicial.

---

## 5. UI/UX (Material-UI)

- **Tabela:** `Table` com `stickyHeader`; primeira coluna sticky (`position: sticky; left: 0; zIndex`) para labels; scroll horizontal para N meses.
- **Header 2 níveis:** linha 1 = nome do mês (`colSpan=3`, fundo azul primário); linha 2 = REALIZADO / AV / AH.
- **Cores:** valores negativos em vermelho suave; linhas `destaque` com fundo `grey.100`; linha Lucro Operacional topo e Saldo Final com fundo azul claro (`#e3f2fd`). Zebra leve nas linhas.
- **Expansão:** ícone `ChevronRight`/`ExpandMore` na célula do label; estado de expansão por linha + toggle global "Mostrar contas filhas" no canto do header (como na imagem).
- **Formatação:** `formatCurrency` existente para REALIZADO; AV/AH com `toFixed(1) + '%'`; célula vazia = `–`.
- **Feedback:** skeleton/`CircularProgress` no load, `Alert` + botão "Tentar novamente" no erro (padrão das outras páginas).
- **Responsivo:** em telas pequenas, manter scroll horizontal com coluna de labels fixa.

---

## 6. Testes (criar antes da implementação — TDD)

`src/tests/services/fluxoGerencialService.test.ts`, seguindo o padrão de `dashboardService.test.ts`:

1. Matriz retorna meses ordenados antigo → recente com todas as 15+1 linhas.
2. Margem de Contribuição = Receita + Custos Variáveis (custos negativos).
3. AV: Receita = 100%; despesa 40.140 sobre receita 60.111 → 66,8%.
4. AH: primeiro mês `null`; base 0 `null`; caso normal `(atual−anterior)/|anterior|`.
5. Ponto de Equilíbrio: `|fixas|/%MC`; `%MC ≤ 0` → `null`.
6. Encadeamento: Saldo Inicial mês N = Saldo Final mês N−1; Saldo Final = SI + RL + Acerto.
7. Acerto do Caixa captura transferências/lançamentos fora dos grupos.
8. Fallback sem `dre_group` classifica por keywords (paridade com DRE).
9. Contas filhas: categoria pai agrega subcategorias; AV/AH das filhas corretos.
10. API route: validação Zod de params inválidos → 400; sem auth → 401.

Comando: `npm test -- fluxoGerencialService`

---

## 7. Ordem de Implementação (fases)

| Fase | Entrega | Risco |
|---|---|---|
| **F1** | `DRE_GROUPS += INVESTIMENTOS` + migration (se houver constraint) + ajuste `gerarDRE` | Baixo |
| **F2** | Extrair `dreClassifier.ts` (função pura de fallback) + testes de paridade com DRE atual | Baixo |
| **F3** | Repository: 2 métodos novos + testes | Baixo |
| **F4** | `fluxoGerencialService` + suíte de testes completa (§6) | Médio — coração das fórmulas |
| **F5** | Route `/api/reports/fluxo-gerencial` + Zod + `withAuth` | Baixo |
| **F6** | Hook `useFluxoGerencial` + componentes da matriz | Médio — UI complexa (sticky, expansão) |
| **F7** | Integração na página `/movimentacoes/fluxo` (matriz + gráfico legado como abas) | Baixo |
| **F8** | QA manual: comparar totais da matriz com DRE e com widget do dashboard no mesmo período | — |

**Regressão obrigatória (F8):** dashboard widget Fluxo de Caixa, página DRE, página de categorias — nenhum deve mudar de comportamento.

---

## 8. Riscos e Decisões em Aberto

1. **Acerto do Caixa** — definição exata depende de como transferências e ajustes são registrados hoje (`type = TRANSFERENCIA`). Validar com dados reais antes da F4; se necessário, tratar como linha residual `SaldoRealContas − SaldoCalculado`.
2. **Constraint do `dre_group` no banco** — confirmar no Supabase antes da F1.
3. **PROJETADO vs REALIZADO** — Yampa também tem coluna Projetado (orçamento); fora do escopo desta fase, mas o contrato `valores[]` já comporta adicionar `projetado` depois sem breaking change.
4. **Períodos longos (24 meses)** — query única pode retornar muitas linhas; se necessário, paginar por chunks de 12 meses no service (não na API).
