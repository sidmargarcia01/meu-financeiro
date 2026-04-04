-- 📄 Descrição: Completar os 8 planos necessários
-- 🧱 Contexto: Garantir que todos os 8 planos do Prompt Mestre existam
-- 📌 Responsável: Windsurf AI
-- 📅 Data: 2026-04-04
-- ⚙️ Tecnologias: PostgreSQL, Supabase
-- ✅ Revisado: Não

-- Verificar planos atuais
SELECT name, type, transaction_limit, user_limit, storage_limit_mb, price_monthly
FROM plans
ORDER BY type, transaction_limit;

-- Inserir planos faltantes com ON CONFLICT para evitar duplicatas
-- Planos Pessoais
INSERT INTO plans (name, type, transaction_limit, user_limit, storage_limit_mb, price_monthly)
VALUES 
('Gratuito Pessoal', 'pessoal', 100, 0, 0, 0.00),
('Pessoal', 'pessoal', 250, 0, 50, 19.90),
('Profissional', 'pessoal', 500, 1, 75, 39.90),
('Família', 'pessoal', 1000, 3, 100, 59.90)
ON CONFLICT (name) DO NOTHING;

-- Planos Empresariais  
INSERT INTO plans (name, type, transaction_limit, user_limit, storage_limit_mb, price_monthly)
VALUES 
('Gratuito Empresarial', 'empresarial', 100, 0, 0, 0.00),
('Empresarial 1', 'empresarial', 500, 1, 100, 79.90),
('Empresarial 2', 'empresarial', 1000, 2, 200, 129.90),
('Empresarial 3', 'empresarial', 2000, 5, 500, 199.90)
ON CONFLICT (name) DO NOTHING;

-- Confirmar contagem final
SELECT COUNT(*) as total, type FROM plans GROUP BY type ORDER BY type;
