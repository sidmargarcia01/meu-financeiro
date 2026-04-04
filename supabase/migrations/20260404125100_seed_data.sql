-- 📄 Descrição: Dados iniciais para o Meu Financeiro
-- 🧱 Contexto: Planos e dados de exemplo para testar o sistema
-- 📌 Responsável: Windsurf AI
-- 📅 Data: 2026-04-04
-- ⚙️ Tecnologias: PostgreSQL, Supabase
-- ✅ Revisado: Não

-- Inserir planos básicos
INSERT INTO plans (id, name, type, transaction_limit, user_limit, price_monthly) VALUES
('personal-free', 'Pessoal Gratuito', 'pessoal', 50, 1, 0),
('personal-basic', 'Pessoal Básico', 'pessoal', 200, 1, 19.90),
('personal-pro', 'Pessoal Profissional', 'pessoal', 1000, 1, 39.90),
('business-basic', 'Empresarial Básico', 'empresarial', 500, 5, 99.90),
('business-pro', 'Empresarial Profissional', 'empresarial', 2000, 20, 199.90)
ON CONFLICT (id) DO NOTHING;

-- Inserir alguns ativos de investimento populares
INSERT INTO assets (ticker, name, type, sector) VALUES
('PETR4', 'Petrobras', 'ACAO_B3', 'Petróleo e Gás'),
('VALE3', 'Vale', 'ACAO_B3', 'Mineração'),
('ITUB4', 'Itaú Unibanco', 'ACAO_B3', 'Financeiro'),
('BBDC4', 'Bradesco', 'ACAO_B3', 'Financeiro'),
('WEGE3', 'WEG', 'ACAO_B3', 'Bens Industriais'),
('ABEV3', 'Ambev', 'ACAO_B3', 'Bens de Consumo'),
('MGLU3', 'Magalu', 'ACAO_B3', 'Varejo'),
('BOVA11', 'ETF BOVA11', 'ETF', 'ETF Índice Bovespa'),
('IVVB11', 'ETF IVVB11', 'ETF', 'ETF S&P 500'),
('BTC', 'Bitcoin', 'CRIPTO', 'Criptomoeda'),
('ETH', 'Ethereum', 'CRIPTO', 'Criptomoeda'),
('SELIC', 'Tesouro Selic', 'TESOURO', 'Renda Fixa'),
('IPCA', 'Tesouro IPCA+', 'TESOURO', 'Renda Fixa'),
('CDB6', 'CDB 6% a.a.', 'CDB', 'Renda Fixa'),
('LCA4', 'LCA 4% a.a.', 'LCA', 'Renda Fixa');
