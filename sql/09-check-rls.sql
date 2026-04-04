-- 📄 Descrição: Verificação do status do Row Level Security
-- 🧱 Contexto: Script para auditoria de RLS no Supabase
-- 📌 Responsável: Windsurf AI
-- 📅 Data: 2026-04-04
-- ⚙️ Tecnologias: PostgreSQL, Supabase
-- ✅ Revisado: Não

-- Verificar quais tabelas têm RLS habilitado
SELECT 
    tablename,
    rowsecurity,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar se existem tabelas sem RLS que deveriam ter
SELECT 
    'TABELA SEM RLS: ' || tablename as alerta
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT IN (
        SELECT tablename FROM pg_policies WHERE schemaname = 'public'
    )
    AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- Verificar triggers de autenticação
SELECT 
    event_object_table as table_name,
    trigger_name,
    action_timing,
    action_condition,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%auth%'
ORDER BY event_object_table, trigger_name;
