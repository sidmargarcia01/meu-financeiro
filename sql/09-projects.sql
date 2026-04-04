-- 09-projects.sql
-- Projetos para controle financeiro
-- Depende da tabela users

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'ATIVO' CHECK (status IN ('ATIVO','CONCLUIDO','CANCELADO')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar seus próprios projetos
CREATE POLICY "projects_own_data" ON projects FOR ALL USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
