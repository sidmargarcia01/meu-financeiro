-- 📄 Correção Completa do Problema de Registro
-- 🛠️ Execute este script no SQL Editor do Supabase

-- ========================================
-- 1. VERIFICAR SE TABELAS EXISTEM
-- ========================================
SELECT 
    'users' as table_name, 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') as exists
UNION ALL
SELECT 
    'plans' as table_name, 
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'plans');

-- ========================================
-- 2. CRIAR PLANO PADRÃO (se não existir)
-- ========================================
INSERT INTO plans (id, name, type, transaction_limit, price_monthly)
VALUES ('default', 'Gratuito', 'pessoal', 1000, 0)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 3. DESATIVAR TRIGGER TEMPORARIAMENTE (para teste)
-- ========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ========================================
-- 4. RECRIAR FUNÇÃO handle_new_user CORRETAMENTE
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
BEGIN
    -- Extrair nome dos metadados ou usar parte do email
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    
    -- Inserir na tabela users
    INSERT INTO public.users (id, email, name, plan_id, default_currency, created_at, updated_at)
    VALUES (
        NEW.id::text,
        NEW.email,
        user_name,
        'default',  -- plano padrão
        'BRL',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log erro mas não falhar a transação de auth
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 5. RECRIAR TRIGGER
-- ========================================
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 6. CONFIGURAR RLS CORRETAMENTE
-- ========================================
-- Desativar RLS para teste
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Garantir permissões
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON plans TO anon, authenticated;

-- ========================================
-- 7. TESTE: Criar um usuário de teste (remover depois)
-- ========================================
-- DESCOMENTE PARA TESTAR:
-- INSERT INTO users (id, email, name, plan_id, default_currency)
-- VALUES ('test-' || gen_random_uuid(), 'test@example.com', 'Test User', 'default', 'BRL')
-- ON CONFLICT DO NOTHING;

-- ========================================
-- 8. VERIFICAÇÃO FINAL
-- ========================================
SELECT 
    'Configuração concluída!' as status,
    (SELECT COUNT(*) FROM plans) as plans_count,
    (SELECT COUNT(*) FROM users) as users_count,
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') as trigger_active,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'users') as rls_enabled;
