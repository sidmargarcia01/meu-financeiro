-- 03-user-settings.sql
-- Configurações e flags do sistema por usuário
-- Depende da tabela users

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  enable_competence_date BOOLEAN DEFAULT FALSE,
  require_cost_center BOOLEAN DEFAULT FALSE,
  require_project BOOLEAN DEFAULT FALSE,
  require_contact BOOLEAN DEFAULT FALSE,
  require_tag BOOLEAN DEFAULT FALSE,
  require_subcategory BOOLEAN DEFAULT FALSE,
  delete_password_hash VARCHAR,
  installment_default VARCHAR DEFAULT 'VALOR_PARCELA'
    CHECK (installment_default IN ('VALOR_PARCELA', 'VALOR_TOTAL')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver/editar suas próprias configurações
CREATE POLICY "user_settings_own_data" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Trigger para criar configurações padrão automaticamente
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_settings_trigger
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_settings();
