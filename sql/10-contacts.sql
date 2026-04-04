-- 10-contacts.sql
-- Contatos (clientes, fornecedores)
-- Depende da tabela users

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('CLIENTE','FORNECEDOR','AMBOS')),
  email VARCHAR,
  phone VARCHAR,
  custom_fields JSONB DEFAULT '{}'
);

-- Habilitar RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar seus próprios contatos
CREATE POLICY "contacts_own_data" ON contacts FOR ALL USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_type ON contacts(type);
