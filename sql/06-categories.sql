-- 06-categories.sql
-- Categorias de receitas e despesas com suporte a hierarquia
-- Depende da tabela users

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('RECEITA','DESPESA')),
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar suas próprias categorias
CREATE POLICY "categories_own_data" ON categories FOR ALL USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Constraint para evitar ciclos na hierarquia
ALTER TABLE categories ADD CONSTRAINT no_self_reference 
  CHECK (id != parent_id);
