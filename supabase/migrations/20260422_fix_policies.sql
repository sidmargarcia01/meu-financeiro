-- 📄 Correção de Políticas RLS - Abordagem segura
-- 🛠️ Cria políticas apenas se não existirem

-- ========================================
-- FUNÇÃO AUXILIAR: Criar política se não existir
-- ========================================
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    p_table TEXT,
    p_policy_name TEXT,
    p_command TEXT,
    p_using TEXT
) RETURNS VOID AS $$
BEGIN
    -- Verificar se política existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = p_table 
        AND policyname = p_policy_name
    ) THEN
        -- Criar política dinamicamente
        EXECUTE format(
            'CREATE POLICY %I ON %I FOR %s USING (%s)',
            p_policy_name, p_table, p_command, p_using
        );
        RAISE NOTICE 'Política % criada na tabela %', p_policy_name, p_table;
    ELSE
        RAISE NOTICE 'Política % já existe na tabela %', p_policy_name, p_table;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CORRIGIR POLÍTICAS DA TABELA USERS
-- ========================================

-- Garantir RLS ativado
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

-- Política: SELECT (visualizar próprio perfil)
SELECT create_policy_if_not_exists(
    'users',
    'Users can view own profile',
    'SELECT',
    'auth.uid()::text = id'
);

-- Política: UPDATE (atualizar próprio perfil)
SELECT create_policy_if_not_exists(
    'users',
    'Users can update own profile',
    'UPDATE',
    'auth.uid()::text = id'
);

-- Política: INSERT (inserir próprio perfil)
SELECT create_policy_if_not_exists(
    'users',
    'Users can insert own profile',
    'INSERT',
    'auth.uid()::text = id'
);

-- ========================================
-- CORRIGIR OUTRAS TABELAS IMPORTANTES
-- ========================================

-- Accounts
ALTER TABLE IF EXISTS accounts ENABLE ROW LEVEL SECURITY;
SELECT create_policy_if_not_exists(
    'accounts', 
    'Users can manage own accounts', 
    'ALL',
    'auth.uid()::text = user_id'
);

-- Transactions
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
SELECT create_policy_if_not_exists(
    'transactions',
    'Users can manage own transactions',
    'ALL',
    'auth.uid()::text = user_id'
);

-- Categories
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
SELECT create_policy_if_not_exists(
    'categories',
    'Users can manage own categories',
    'ALL',
    'auth.uid()::text = user_id'
);

-- Limpar função auxiliar
DROP FUNCTION IF EXISTS create_policy_if_not_exists;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================
SELECT 'Políticas verificadas e corrigidas com sucesso!' AS status;
