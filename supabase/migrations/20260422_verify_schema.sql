-- 📄 Verificação e correção do Schema
-- ⚠️ Use apenas as partes necessárias

-- ========================================
-- 1. VERIFICAR SE TABELAS EXISTEM
-- ========================================

-- Verificar tabela users
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) AS users_exists;

-- Verificar tabela accounts
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'accounts'
) AS accounts_exists;

-- Verificar tabela transactions
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions'
) AS transactions_exists;

-- ========================================
-- 2. SE HOUVER ERRO DE POLÍTICAS, EXECUTAR:
-- ========================================

-- Remover políticas existentes (cuidado!)
-- DESCOMENTE APENAS SE NECESSÁRIO:
-- DROP POLICY IF EXISTS "Users can view own profile" ON users;
-- DROP POLICY IF EXISTS "Users can update own profile" ON users;
-- DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- ========================================
-- 3. VERIFICAR POLÍTICAS EXISTENTES
-- ========================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';
