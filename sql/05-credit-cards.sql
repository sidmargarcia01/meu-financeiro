-- 05-credit-cards.sql
-- Cartões de crédito vinculados a contas
-- Depende da tabela accounts

CREATE TABLE credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  credit_limit DECIMAL(15,2),
  closing_day INTEGER CHECK (closing_day BETWEEN 1 AND 31),
  due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar seus próprios cartões
CREATE POLICY "credit_cards_own_data" ON credit_cards FOR ALL USING (
  auth.uid() = (SELECT user_id FROM accounts WHERE id = account_id)
);
