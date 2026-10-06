-- Deploy with the request-scoped authentication changes. No financial rows are rewritten.
ALTER TABLE public.recurrences ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.recurrences ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS initial_balance_date date;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transfer_group_id text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS bank_fitid text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
-- Legacy records without an explicit date use their due date, without changing the original data.
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS effective_cash_date date
  GENERATED ALWAYS AS (coalesce(payment_date, due_date)) STORED;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS effective_competence_date date
  GENERATED ALWAYS AS (coalesce(competence_date, due_date)) STORED;
CREATE INDEX IF NOT EXISTS transactions_user_cash_date ON public.transactions(user_id, effective_cash_date);
CREATE INDEX IF NOT EXISTS transactions_transfer_group ON public.transactions(user_id, transfer_group_id);
CREATE UNIQUE INDEX IF NOT EXISTS transactions_bank_identity ON public.transactions(user_id, account_id, bank_fitid) WHERE bank_fitid IS NOT NULL;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS dre_group text;
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_dre_group_check;
ALTER TABLE public.categories ADD CONSTRAINT categories_dre_group_check CHECK (dre_group IS NULL OR dre_group IN (
 'RECEITAS_OPERACIONAIS','IMPOSTOS_FATURAMENTO','CUSTOS_OPERACIONAIS','DESPESAS_VARIAVEIS',
 'DESPESAS_FIXAS','INVESTIMENTOS','RECEITAS_NAO_OPERACIONAIS','DESPESAS_NAO_OPERACIONAIS','IMPOSTOS_LUCRO','DISTRIBUICAO_LUCROS'));

CREATE TABLE IF NOT EXISTS public.investments (
 id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 name text NOT NULL, type text NOT NULL, ticker text,
 quantity numeric NOT NULL CHECK(quantity >= 0), average_price numeric NOT NULL CHECK(average_price >= 0),
 current_price numeric CHECK(current_price >= 0), total_invested numeric NOT NULL DEFAULT 0,
 current_value numeric NOT NULL DEFAULT 0, broker text, currency text NOT NULL DEFAULT 'BRL',
 is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.saved_collections (
 user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(name IN ('metas-economia','metas-centros','planejamento')),
 items jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(items) = 'array'), version integer NOT NULL DEFAULT 1 CHECK(version > 0),
 PRIMARY KEY(user_id,name)
);


-- New tables must be protected immediately, before the application starts using them.
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_collections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.investments,public.saved_collections FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.investments,public.saved_collections TO authenticated;
DROP POLICY IF EXISTS owner_access ON public.investments;
CREATE POLICY owner_access ON public.investments FOR ALL TO authenticated USING ((select auth.uid())::text=user_id) WITH CHECK ((select auth.uid())::text=user_id);
DROP POLICY IF EXISTS owner_access ON public.saved_collections;
CREATE POLICY owner_access ON public.saved_collections FOR ALL TO authenticated USING ((select auth.uid())::text=user_id) WITH CHECK ((select auth.uid())::text=user_id);
