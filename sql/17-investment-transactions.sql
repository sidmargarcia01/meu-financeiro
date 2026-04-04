-- 17-investment-transactions.sql
-- Operações de compra, venda e proventos
-- Depende de: users, assets, accounts

CREATE TABLE investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id),
  account_id UUID REFERENCES accounts(id),
  type VARCHAR NOT NULL CHECK (type IN ('COMPRA','VENDA','DIVIDENDO','JCP','BONIFICACAO','DESDOBRAMENTO','GRUPAMENTO')),
  quantity DECIMAL(15,8),
  unit_price DECIMAL(15,8),
  fees DECIMAL(15,2) DEFAULT 0,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar suas próprias operações
CREATE POLICY "investment_transactions_own_data" ON investment_transactions FOR ALL USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_investment_transactions_user_id ON investment_transactions(user_id);
CREATE INDEX idx_investment_transactions_asset_id ON investment_transactions(asset_id);
CREATE INDEX idx_investment_transactions_account_id ON investment_transactions(account_id);
CREATE INDEX idx_investment_transactions_type ON investment_transactions(type);
CREATE INDEX idx_investment_transactions_date ON investment_transactions(date);

-- Constraints para validação
ALTER TABLE investment_transactions ADD CONSTRAINT positive_quantity 
  CHECK (quantity > 0 OR quantity IS NULL);
ALTER TABLE investment_transactions ADD CONSTRAINT positive_unit_price 
  CHECK (unit_price > 0 OR unit_price IS NULL);
ALTER TABLE investment_transactions ADD CONSTRAINT positive_fees 
  CHECK (fees >= 0);
