-- 14-transfers.sql
-- Transferências entre contas (geram duas transações)
-- Depende da tabela users e accounts

CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  origin_account_id UUID REFERENCES accounts(id),
  destination_account_id UUID REFERENCES accounts(id),
  amount DECIMAL(15,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar suas próprias transferências
CREATE POLICY "transfers_own_data" ON transfers FOR ALL USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_transfers_user_id ON transfers(user_id);
CREATE INDEX idx_transfers_origin_account_id ON transfers(origin_account_id);
CREATE INDEX idx_transfers_destination_account_id ON transfers(destination_account_id);
CREATE INDEX idx_transfers_date ON transfers(date);

-- Constraint: não permitir transferência para a mesma conta
ALTER TABLE transfers ADD CONSTRAINT different_accounts 
  CHECK (origin_account_id != destination_account_id);
