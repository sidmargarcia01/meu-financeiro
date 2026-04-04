-- 12-transactions.sql
-- Tabela principal de transações financeiras
-- Depende de: users, accounts, categories, recurrences, cost_centers, projects, contacts

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id),
  category_id UUID REFERENCES categories(id),
  recurrence_id UUID REFERENCES recurrences(id),
  center_id UUID REFERENCES cost_centers(id),
  project_id UUID REFERENCES projects(id),
  contact_id UUID REFERENCES contacts(id),
  description VARCHAR NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('RECEITA','DESPESA','TRANSFERENCIA')),
  status VARCHAR NOT NULL DEFAULT 'PENDENTE'
    CHECK (status IN ('PENDENTE','CONFIRMADO','CONCILIADO')),
  due_date DATE NOT NULL,
  payment_date DATE,
  competence_date DATE,
  regime VARCHAR DEFAULT 'CAIXA' CHECK (regime IN ('CAIXA','COMPETENCIA')),
  is_recurring BOOLEAN DEFAULT FALSE,
  attachment_url VARCHAR,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar suas próprias transações
CREATE POLICY "transactions_own_data" ON transactions FOR ALL USING (auth.uid() = user_id);

-- Índices para performance (críticos para queries financeiras)
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_due_date ON transactions(due_date);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_competence_date ON transactions(competence_date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);

-- Trigger para atualizar competence_date se não informada
CREATE OR REPLACE FUNCTION set_default_competence_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.competence_date IS NULL THEN
        NEW.competence_date := NEW.due_date;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_default_competence_date_trigger
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION set_default_competence_date();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE
    ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
