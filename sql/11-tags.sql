-- 11-tags.sql
-- Tags para categorização flexível
-- Depende da tabela users

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  color VARCHAR
);

-- Habilitar RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar suas próprias tags
CREATE POLICY "tags_own_data" ON tags FOR ALL USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_tags_user_id ON tags(user_id);

-- Constraint para nomes únicos por usuário
ALTER TABLE tags ADD CONSTRAINT unique_tag_name_per_user 
  UNIQUE (user_id, name);
