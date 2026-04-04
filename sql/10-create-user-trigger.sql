-- 📄 Descrição: Trigger para criação automática de perfil de usuário
-- 🧱 Contexto: Quando um usuário é criado no Supabase Auth, automaticamente cria registros em users e user_settings
-- 📌 Responsável: Windsurf AI
-- 📅 Data: 2026-04-04
-- ⚙️ Tecnologias: PostgreSQL, Supabase
-- ✅ Revisado: Não

-- Passo 1 — Criar a função do trigger
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

-- Passo 2 — Criar o trigger vinculado ao auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Passo 3 — Verificar se o trigger foi criado
SELECT trigger_name, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
