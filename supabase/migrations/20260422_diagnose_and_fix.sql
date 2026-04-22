-- 📄 Diagnóstico e Correção Completo do Schema
-- 🛠️ Verifica e corrige tabelas, funções e triggers

-- ========================================
-- 1. VERIFICAR SE TABELA USERS EXISTE
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        RAISE EXCEPTION 'Tabela users não existe! Execute o schema inicial primeiro.';
    ELSE
        RAISE NOTICE '✓ Tabela users existe';
    END IF;
END $$;

-- ========================================
-- 2. VERIFICAR E CRIAR FUNÇÃO handle_new_user (ESSENCIAL!)
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, created_at, updated_at)
    VALUES (
        NEW.id::text,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE '✓ Função handle_new_user criada/atualizada';

-- ========================================
-- 3. VERIFICAR E CRIAR TRIGGER
-- ========================================
DO $$
BEGIN
    -- Remover trigger existente para recriar
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Criar trigger
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
    
    RAISE NOTICE '✓ Trigger on_auth_user_created criado';
END $$;

-- ========================================
-- 4. VERIFICAR TABELA PLANS (necessária para users)
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'plans'
    ) THEN
        CREATE TABLE IF NOT EXISTS plans (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name TEXT NOT NULL DEFAULT 'Gratuito',
            type TEXT NOT NULL DEFAULT 'pessoal' CHECK (type IN ('pessoal', 'empresarial')),
            transaction_limit INTEGER NOT NULL DEFAULT 1000,
            user_limit INTEGER DEFAULT 1,
            storage_limit_mb INTEGER DEFAULT 100,
            price_monthly DECIMAL(10,2) DEFAULT 0,
            jsonb JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Inserir plano padrão
        INSERT INTO plans (id, name, type, transaction_limit, price_monthly)
        VALUES ('default', 'Gratuito', 'pessoal', 1000, 0)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✓ Tabela plans criada e populada';
    ELSE
        RAISE NOTICE '✓ Tabela plans já existe';
    END IF;
END $$;

-- ========================================
-- 5. GARANTIR RLS CORRETAMENTE CONFIGURADO
-- ========================================
-- Desativar RLS temporariamente para diagnóstico
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Reativar e configurar
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remover políticas conflitantes
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for own user" ON users;
DROP POLICY IF EXISTS "Enable insert access for own user" ON users;
DROP POLICY IF EXISTS "Enable update access for own user" ON users;

-- Criar políticas simplificadas
CREATE POLICY "Enable read access for own user" ON users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Enable insert access for own user" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Enable update access for own user" ON users
    FOR UPDATE USING (auth.uid()::text = id);

RAISE NOTICE '✓ Políticas RLS configuradas';

-- ========================================
-- 6. CONCEDER PERMISSÕES NECESSÁRIAS
-- ========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

RAISE NOTICE '✓ Permissões concedidas';

-- ========================================
-- 7. VERIFICAÇÃO FINAL
-- ========================================
SELECT 
    'Diagnóstico completo!' as status,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') as users_table,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plans') as plans_table,
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') as trigger_exists;
