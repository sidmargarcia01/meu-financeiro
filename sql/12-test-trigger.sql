-- 📄 Descrição: Teste do trigger de criação de usuário
-- 🧱 Contexto: Script para testar se o trigger está funcionando corretamente
-- 📌 Responsável: Windsurf AI
-- 📅 Data: 2026-04-04
-- ⚙️ Tecnologias: PostgreSQL, Supabase
-- ✅ Revisado: Não

-- Passo 4 — Testar o trigger
-- Execute esta query após criar um usuário de teste no painel do Supabase
-- Substitua [id-do-usuário-criado] pelo ID real do usuário criado

SELECT u.id, u.name, u.plan_id, us.enable_competence_date, us.installment_default
FROM users u
JOIN user_settings us ON us.user_id = u.id
WHERE u.id = '[id-do-usuário-criado]';

-- Verificar se existem usuários sem settings (indicando trigger não funcionou)
SELECT u.id, u.name, u.created_at
FROM users u
LEFT JOIN user_settings us ON us.user_id = u.id
WHERE us.user_id IS NULL;
