-- 01-plans.sql
-- Criar tabela de planos
-- Esta tabela deve ser executada PRIMEIRO pois outras tabelas dependem dela

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('pessoal', 'empresarial')),
  transaction_limit INTEGER NOT NULL,
  user_limit INTEGER NOT NULL DEFAULT 0,
  storage_limit_mb INTEGER,
  price_monthly DECIMAL(10,2),
  features JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir planos padrão
INSERT INTO plans (name, type, transaction_limit, user_limit, storage_limit_mb, price_monthly) VALUES
('Gratuito Pessoal', 'pessoal', 100, 0, 0, 0),
('Pessoal', 'pessoal', 250, 0, 50, 19.90),
('Profissional', 'pessoal', 500, 1, 75, 39.90),
('Família', 'pessoal', 1000, 3, 100, 59.90),
('Gratuito Empresarial', 'empresarial', 100, 0, 0, 0),
('Empresarial 1', 'empresarial', 500, 1, 100, 79.90),
('Empresarial 2', 'empresarial', 1000, 2, 200, 129.90),
('Empresarial 3', 'empresarial', 2000, 5, 500, 199.90);

-- Habilitar RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Política: todos podem ler planos (não há dados sensíveis)
CREATE POLICY "plans_public_read" ON plans FOR SELECT USING (true);
