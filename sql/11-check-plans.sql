-- 📄 Descrição: Verificação dos planos existentes
-- 🧱 Contexto: Verificar se o plano "Gratuito Pessoal" existe para o trigger
-- 📌 Responsável: Windsurf AI
-- 📅 Data: 2026-04-04
-- ⚙️ Tecnologias: PostgreSQL, Supabase
-- ✅ Revisado: Não

-- Verificar todos os planos existentes
SELECT name, type, transaction_limit, user_limit, storage_limit_mb, price_monthly
FROM plans
ORDER BY type, transaction_limit;

-- Verificar especificamente o plano "Gratuito Pessoal"
SELECT id, name, type, transaction_limit, user_limit, storage_limit_mb, price_monthly
FROM plans
WHERE name = 'Gratuito Pessoal';
