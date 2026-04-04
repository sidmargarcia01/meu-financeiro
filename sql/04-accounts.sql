-- 04-accounts.sql
-- Contas bancárias e carteiras
-- Depende da tabela users

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('CORRENTE','POUPANCA','INVESTIMENTO','CARTAO','CARTEIRA')),
  initial_balance DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'BRL',
  icon VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,
  bank_connection_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar suas próprias contas
CREATE POLICY "accounts_own_data" ON accounts FOR ALL USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(type);
