-- 📄 Descrição: Adiciona coluna dre_group à tabela categories para classificação DRE
-- 🧱 Contexto: Bloco 40 — Painel de Indicadores Gerenciais
-- 📌 Responsável: Windsurf AI
-- 📅 Data: 2026-04-22
-- ⚙️ Tecnologias: PostgreSQL, Supabase

ALTER TABLE categories
ADD COLUMN IF NOT EXISTS dre_group TEXT CHECK (
  dre_group IS NULL OR dre_group IN (
    'RECEITA_BRUTA',
    'DEDUCAO_RECEITA',
    'CPV',
    'DESPESA_OPERACIONAL',
    'DESPESA_FINANCEIRA',
    'OUTRAS_RECEITAS',
    'OUTRAS_DESPESAS'
  )
);

COMMENT ON COLUMN categories.dre_group IS
  'Grupo DRE da categoria: RECEITA_BRUTA | DEDUCAO_RECEITA | CPV | DESPESA_OPERACIONAL | DESPESA_FINANCEIRA | OUTRAS_RECEITAS | OUTRAS_DESPESAS';
