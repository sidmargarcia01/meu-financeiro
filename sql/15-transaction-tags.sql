-- 15-transaction-tags.sql
-- Tabela many-to-many para relacionar transações com tags
-- Depende de: transactions, tags

CREATE TABLE transaction_tags (
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

-- Habilitar RLS
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar suas próprias relações
CREATE POLICY "transaction_tags_own_data" ON transaction_tags FOR ALL USING (
  auth.uid() = (SELECT user_id FROM transactions WHERE id = transaction_id)
);

-- Índices para performance
CREATE INDEX idx_transaction_tags_transaction_id ON transaction_tags(transaction_id);
CREATE INDEX idx_transaction_tags_tag_id ON transaction_tags(tag_id);
