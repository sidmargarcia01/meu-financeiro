-- 📄 Descrição: Ajustar planos e criar trigger com nomes corretos
-- 🧱 Contexto: Adjust existing plans to match expected names and create trigger
-- 📌 Responsável: Windsurf AI
-- 📅 Data: 2026-04-04
-- ⚙️ Tecnologias: PostgreSQL, Supabase
-- ✅ Revisado: Não

-- Primeiro, verificar planos existentes
SELECT id, name, type, transaction_limit, user_limit, price_monthly
FROM plans
ORDER BY type, transaction_limit;

-- Atualizar nomes dos planos para corresponder ao trigger
UPDATE plans SET name = 'Gratuito Pessoal' WHERE name = 'Pessoal Gratuito';
UPDATE plans SET name = 'Pessoal' WHERE name = 'Pessoal Básico';
UPDATE plans SET name = 'Profissional' WHERE name = 'Pessoal Profissional';

-- Adicionar planos que estão faltando
INSERT INTO plans (id, name, type, transaction_limit, user_limit, storage_limit_mb, price_monthly) VALUES
('personal-family', 'Família', 'pessoal', 1000, 3, 100, 59.90),
('business-free', 'Gratuito Empresarial', 'empresarial', 100, 0, 0, 0.00),
('business-1', 'Empresarial 1', 'empresarial', 500, 1, 100, 79.90),
('business-2', 'Empresarial 2', 'empresarial', 1000, 2, 200, 129.90),
('business-3', 'Empresarial 3', 'empresarial', 2000, 5, 500, 199.90)
ON CONFLICT (id) DO NOTHING;

-- Adicionar storage_limit_mb aos planos existentes que não têm
UPDATE plans SET storage_limit_mb = 0 WHERE name = 'Gratuito Pessoal';
UPDATE plans SET storage_limit_mb = 50 WHERE name = 'Pessoal';
UPDATE plans SET storage_limit_mb = 75 WHERE name = 'Profissional';
UPDATE plans SET storage_limit_mb = 100 WHERE name = 'Empresarial Básico';
UPDATE plans SET storage_limit_mb = 200 WHERE name = 'Empresarial Profissional';

-- Verificar planos após ajustes
SELECT COUNT(*) as total, type FROM plans GROUP BY type ORDER BY type;

-- Agora criar o trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cria registro na tabela users
  INSERT INTO public.users (id, name, plan_id, default_currency, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    (SELECT id FROM public.plans WHERE name = 'Gratuito Pessoal' LIMIT 1),
    'BRL',
    NOW()
  );

  -- Cria registro na tabela user_settings com valores padrão
  INSERT INTO public.user_settings (
    user_id,
    enable_competence_date,
    require_cost_center,
    require_project,
    require_contact,
    require_tag,
    require_subcategory,
    installment_default,
    updated_at
  )
  VALUES (
    NEW.id,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    'VALOR_PARCELA',
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Criar o trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verificar se o trigger foi criado
SELECT trigger_name, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
