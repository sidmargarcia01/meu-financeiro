-- 18-portfolios.sql
-- Posições consolidadas por usuário e ativo
-- Depende de: users, assets

CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id),
  total_quantity DECIMAL(15,8) DEFAULT 0,
  average_price DECIMAL(15,8) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asset_id)
);

-- Habilitar RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar seus próprios portfólios
CREATE POLICY "portfolios_own_data" ON portfolios FOR ALL USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_asset_id ON portfolios(asset_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE
    ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
