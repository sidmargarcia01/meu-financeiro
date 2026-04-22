-- Migration: atualizar CHECK constraint do dre_group para 9 grupos gerenciais
-- Alinhado com personal-website (DreGroup enum do Prisma)
-- Gerado em: 2026-04-22

-- Remove constraint antiga (se existir)
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_dre_group_check;

-- Adiciona coluna se não existir (idempotente)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS dre_group TEXT;

-- Aplica nova constraint com os 9 grupos gerenciais
ALTER TABLE categories
  ADD CONSTRAINT categories_dre_group_check CHECK (
    dre_group IS NULL OR dre_group IN (
      'RECEITAS_OPERACIONAIS',
      'IMPOSTOS_FATURAMENTO',
      'CUSTOS_OPERACIONAIS',
      'DESPESAS_VARIAVEIS',
      'DESPESAS_FIXAS',
      'RECEITAS_NAO_OPERACIONAIS',
      'DESPESAS_NAO_OPERACIONAIS',
      'IMPOSTOS_LUCRO',
      'DISTRIBUICAO_LUCROS'
    )
  );

COMMENT ON COLUMN categories.dre_group IS
  'Grupo DRE gerencial: RECEITAS_OPERACIONAIS | IMPOSTOS_FATURAMENTO | CUSTOS_OPERACIONAIS | DESPESAS_VARIAVEIS | DESPESAS_FIXAS | RECEITAS_NAO_OPERACIONAIS | DESPESAS_NAO_OPERACIONAIS | IMPOSTOS_LUCRO | DISTRIBUICAO_LUCROS';
