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

-- Replace the audited policies; restrictive relationships are enforced by triggers below.
DO $$ DECLARE t text; p record; BEGIN
 FOREACH t IN ARRAY ARRAY['accounts','categories','contacts','cost_centers','payment_methods','projects','tags','transactions','users','recurrences','investments','saved_collections'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated', t);
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
   EXECUTE format('DROP POLICY %I ON public.%I', p.policyname,t);
  END LOOP;
  IF t <> 'users' THEN
   EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',t);
   EXECUTE format('CREATE POLICY owner_access ON public.%I FOR ALL TO authenticated USING ((select auth.uid())::text = user_id) WITH CHECK ((select auth.uid())::text = user_id)',t);
  END IF;
 END LOOP;
END $$;
REVOKE ALL ON public.users FROM authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE(name,default_currency,updated_at) ON public.users TO authenticated;
CREATE POLICY own_profile_read ON public.users FOR SELECT TO authenticated USING ((select auth.uid())::text=id);
CREATE POLICY own_profile_update ON public.users FOR UPDATE TO authenticated USING ((select auth.uid())::text=id) WITH CHECK ((select auth.uid())::text=id);

CREATE OR REPLACE FUNCTION public.validate_financial_links() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE mapping text[]; link_id text; valid boolean; BEGIN
 IF TG_OP='UPDATE' AND OLD.transfer_group_id IS NOT NULL AND NEW.transfer_group_id IS DISTINCT FROM OLD.transfer_group_id THEN
  RAISE EXCEPTION 'A identidade da transferência não pode ser alterada';
 END IF;
 FOREACH mapping SLICE 1 IN ARRAY ARRAY[['account_id','accounts'],['category_id','categories'],['center_id','cost_centers'],['project_id','projects'],['contact_id','contacts'],['recurrence_id','recurrences']] LOOP
  link_id := to_jsonb(NEW)->>mapping[1];
  IF link_id IS NOT NULL THEN
   EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE id=$1 AND user_id=$2)',mapping[2]) INTO valid USING link_id,NEW.user_id;
   IF NOT valid THEN RAISE EXCEPTION 'Referência financeira inválida: %',mapping[1]; END IF;
  END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM unnest(NEW.tags) tag_id WHERE NOT EXISTS(SELECT 1 FROM public.tags t WHERE t.id=tag_id AND t.user_id=NEW.user_id)) THEN
  RAISE EXCEPTION 'Tag não pertence ao usuário';
 END IF;
 IF NEW.type='TRANSFERENCIA' AND NEW.transfer_group_id IS NULL THEN RAISE EXCEPTION 'Transferência sem par'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_financial_links BEFORE INSERT OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.validate_financial_links();

CREATE OR REPLACE FUNCTION public.validate_transfer_pair() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE group_id text := coalesce(NEW.transfer_group_id,OLD.transfer_group_id); n integer; valid boolean; BEGIN
 IF group_id IS NULL THEN RETURN NULL; END IF;
 SELECT count(*), count(*)=2 AND count(DISTINCT t.account_id)=2 AND count(DISTINCT t.user_id)=1
   AND sum(t.amount)=0 AND bool_and(t.type='TRANSFERENCIA') AND count(DISTINCT a.currency)=1
   AND count(DISTINCT t.status)=1 AND count(DISTINCT t.due_date)=1 AND count(DISTINCT t.payment_date)<=1 AND count(t.payment_date) IN (0,2)
 INTO n,valid FROM public.transactions t JOIN public.accounts a ON a.id=t.account_id WHERE t.transfer_group_id=group_id;
 IF n<>0 AND NOT valid THEN RAISE EXCEPTION 'Transferência deve conter duas pontas equivalentes'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER validate_transfer_pair AFTER INSERT OR UPDATE OR DELETE ON public.transactions
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.validate_transfer_pair();
REVOKE EXECUTE ON FUNCTION public.validate_financial_links(), public.validate_transfer_pair() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.confirm_ofx_matches(account text, matches jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE item jsonb; tx public.transactions; existing_id text; updated integer:=0; BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.accounts WHERE id=account AND user_id=auth.uid()::text) THEN RAISE EXCEPTION 'Conta inválida'; END IF;
 IF jsonb_typeof(matches)<>'array' OR jsonb_array_length(matches)>1000 THEN RAISE EXCEPTION 'Lote inválido'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(matches) LOOP
  IF nullif(item->>'fitid','') IS NULL THEN RAISE EXCEPTION 'Identificador bancário obrigatório'; END IF;
  SELECT id INTO existing_id FROM public.transactions WHERE user_id=auth.uid()::text AND account_id=account AND bank_fitid=item->>'fitid';
  IF existing_id IS NOT NULL THEN
   IF existing_id=item->>'id' THEN CONTINUE; END IF;
   RAISE EXCEPTION 'Linha bancária já conciliada em outro lançamento';
  END IF;
  SELECT * INTO tx FROM public.transactions WHERE id=item->>'id' AND user_id=auth.uid()::text AND account_id=account FOR UPDATE;
  IF tx.id IS NULL OR tx.status='CONCILIADO' OR tx.type='TRANSFERENCIA' THEN RAISE EXCEPTION 'Lançamento indisponível para conciliação'; END IF;
  IF abs(tx.amount)<>abs((item->>'amount')::numeric) OR (tx.type='DESPESA')<>((item->>'amount')::numeric<0) THEN RAISE EXCEPTION 'Valor bancário divergente'; END IF;
  UPDATE public.transactions SET status='CONCILIADO', payment_date=(item->>'date')::date, bank_fitid=item->>'fitid', updated_at=now() WHERE id=tx.id;
  updated:=updated+1;
 END LOOP;
 RETURN updated;
END $$;
REVOKE EXECUTE ON FUNCTION public.confirm_ofx_matches(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_ofx_matches(text,jsonb) TO authenticated;
ALTER FUNCTION public.handle_new_user() SET search_path='';
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.get_my_storage_usage() RETURNS bigint
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT coalesce(sum(CASE WHEN metadata->>'size' ~ '^[0-9]+$' THEN (metadata->>'size')::bigint ELSE 0 END),0)::bigint
 FROM storage.objects WHERE owner_id=auth.uid()::text;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_storage_usage() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_storage_usage() TO authenticated;

