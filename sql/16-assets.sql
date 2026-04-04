-- 16-assets.sql
-- Cadastro de ativos para investimentos
-- Não depende de outras tabelas (referenciada por outras)

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN (
    'ACAO_B3','ACAO_NYSE','ACAO_NASDAQ','OPCAO','FII','ETF',
    'FUTURO','CRIPTO','CDB','LCA','LCI','LCM','LCH',
    'DEBENTURE','TESOURO','POUPANCA','FUNDO','PREVIDENCIA',
    'CAPITALIZACAO','MOEDA','BEM_IMOVEL','BEM_VEICULO','BEM_OUTRO'
  )),
  sector VARCHAR,
  currency VARCHAR(3) DEFAULT 'BRL',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Política: todos podem ler assets (dados públicos), mas só admin pode escrever
CREATE POLICY "assets_public_read" ON assets FOR SELECT USING (true);
CREATE POLICY "assets_admin_write" ON assets FOR INSERT WITH CHECK (false);
CREATE POLICY "assets_admin_write" ON assets FOR UPDATE WITH CHECK (false);
CREATE POLICY "assets_admin_write" ON assets FOR DELETE WITH CHECK (false);

-- Índices para performance
CREATE INDEX idx_assets_ticker ON assets(ticker);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_sector ON assets(sector);

-- Constraint para ticker único se informado
ALTER TABLE assets ADD CONSTRAINT unique_ticker 
  UNIQUE (ticker) DEFERRABLE INITIALLY DEFERRED;
