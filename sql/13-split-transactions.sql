-- 13-split-transactions.sql
-- Para divisão de uma transação em múltiplas categorias/centros
-- Depende de: transactions, categories, cost_centers, projects, contacts

CREATE TABLE split_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  center_id UUID REFERENCES cost_centers(id),
  project_id UUID REFERENCES projects(id),
  contact_id UUID REFERENCES contacts(id),
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('RECEITA','DESPESA')),
  description VARCHAR
);

-- Habilitar RLS
ALTER TABLE split_transactions ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar suas próprias divisões
CREATE POLICY "split_transactions_own_data" ON split_transactions FOR ALL USING (
  auth.uid() = (SELECT user_id FROM transactions WHERE id = transaction_id)
);

-- Índices para performance
CREATE INDEX idx_split_transactions_transaction_id ON split_transactions(transaction_id);
CREATE INDEX idx_split_transactions_category_id ON split_transactions(category_id);
CREATE INDEX idx_split_transactions_center_id ON split_transactions(center_id);

-- Constraint: valor total das divisões deve igualar valor da transação principal
-- (Esta validação será feita na camada de serviço para maior flexibilidade)
