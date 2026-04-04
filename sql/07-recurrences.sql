-- 07-recurrences.sql
-- Configurações de recorrência para lançamentos fixos e parcelados
-- Depende da tabela users

CREATE TABLE recurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN ('FIXA','PARCELADA')),
  frequency VARCHAR CHECK (frequency IN ('SEMANAL','MENSAL','ANUAL')),
  total_installments INTEGER,
  current_installment INTEGER DEFAULT 1,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE recurrences ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar suas próprias recorrências
CREATE POLICY "recurrences_own_data" ON recurrences FOR ALL USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_recurrences_user_id ON recurrences(user_id);
CREATE INDEX idx_recurrences_type ON recurrences(type);
