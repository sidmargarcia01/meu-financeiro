-- 08-cost-centers.sql
-- Centros de custo e lucro (módulo empresarial)
-- Depende da tabela users

CREATE TABLE cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  type VARCHAR DEFAULT 'CUSTO' CHECK (type IN ('CUSTO','LUCRO')),
  is_active BOOLEAN DEFAULT TRUE
);

-- Habilitar RLS
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar seus próprios centros de custo
CREATE POLICY "cost_centers_own_data" ON cost_centers FOR ALL USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_cost_centers_user_id ON cost_centers(user_id);
CREATE INDEX idx_cost_centers_type ON cost_centers(type);
