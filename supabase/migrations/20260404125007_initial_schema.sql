-- 📄 Descrição: Schema inicial completo do Meu Financeiro
-- 🧱 Contexto: Migração inicial com todas as tabelas, índices e RLS
-- 📌 Responsável: Windsurf AI
-- 📅 Data: 2026-04-04
-- ⚙️ Tecnologias: PostgreSQL, Supabase
-- ✅ Revisado: Não

-- Tabelas do Sistema

-- Planos
CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pessoal', 'empresarial')),
    transaction_limit INTEGER NOT NULL,
    user_limit INTEGER DEFAULT 0,
    storage_limit_mb INTEGER,
    price_monthly DECIMAL(10,2),
    jsonb JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    plan_id TEXT REFERENCES plans(id),
    default_currency TEXT DEFAULT 'BRL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações do Usuário
CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enable_competence_date BOOLEAN DEFAULT false,
    require_cost_center BOOLEAN DEFAULT false,
    require_project BOOLEAN DEFAULT false,
    require_contact BOOLEAN DEFAULT false,
    require_tag BOOLEAN DEFAULT false,
    require_subcategory BOOLEAN DEFAULT false,
    delete_password_hash TEXT,
    installment_default TEXT DEFAULT 'VALOR_PARCELA',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contas
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('CORRENTE', 'POUPANCA', 'INVESTIMENTO', 'CARTAO', 'CARTEIRA')),
    initial_balance DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'BRL',
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    bank_connection_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cartões de Crédito
CREATE TABLE IF NOT EXISTS credit_cards (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    credit_limit DECIMAL(15,2),
    closing_day INTEGER,
    due_day INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('RECEITA', 'DESPESA')),
    parent_id TEXT REFERENCES categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recorrências
CREATE TABLE IF NOT EXISTS recurrences (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('FIXA', 'PARCELADA')),
    frequency TEXT CHECK (frequency IN ('SEMANAL', 'MENSAL', 'ANUAL')),
    total_installments INTEGER,
    current_installment INTEGER DEFAULT 1,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Centros de Custo
CREATE TABLE IF NOT EXISTS cost_centers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'CUSTO' CHECK (type IN ('CUSTO', 'LUCRO')),
    is_active BOOLEAN DEFAULT true
);

-- Projetos
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'CONCLUIDO', 'CANCELADO')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contatos
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('CLIENTE', 'FORNECEDOR', 'AMBOS')),
    email TEXT,
    phone TEXT,
    custom_fields JSONB DEFAULT '{}'
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT
);

-- Transações
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id TEXT REFERENCES accounts(id),
    category_id TEXT REFERENCES categories(id),
    recurrence_id TEXT REFERENCES recurrences(id),
    center_id TEXT REFERENCES cost_centers(id),
    project_id TEXT REFERENCES projects(id),
    contact_id TEXT REFERENCES contacts(id),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('RECEITA', 'DESPESA', 'TRANSFERENCIA')),
    status TEXT DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CONCILIADO')),
    due_date DATE NOT NULL,
    payment_date DATE,
    competence_date DATE,
    regime TEXT DEFAULT 'CAIXA' CHECK (regime IN ('CAIXA', 'COMPETENCIA')),
    is_recurring BOOLEAN DEFAULT false,
    attachment_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Split Transactions
CREATE TABLE IF NOT EXISTS split_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES categories(id),
    center_id TEXT REFERENCES cost_centers(id),
    project_id TEXT REFERENCES projects(id),
    contact_id TEXT REFERENCES contacts(id),
    amount DECIMAL(15,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('RECEITA', 'DESPESA')),
    description TEXT
);

-- Transferências
CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_account_id TEXT NOT NULL REFERENCES accounts(id),
    destination_account_id TEXT NOT NULL REFERENCES accounts(id),
    amount DECIMAL(15,2) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction Tags (many-to-many)
CREATE TABLE IF NOT EXISTS transaction_tags (
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);

-- Ativos de Investimento
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ticker TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ACAO_B3', 'ACAO_NYSE', 'ACAO_NASDAQ', 'OPCAO', 'FII', 'ETF', 'FUTURO', 'CRIPTO', 'CDB', 'LCA', 'LCI', 'LCM', 'LCH', 'DEBENTURE', 'TESOURO', 'POUPANCA', 'FUNDO', 'PREVIDENCIA', 'CAPITALIZACAO', 'MOEDA', 'BEM_IMOVEL', 'BEM_VEICULO', 'BEM_OUTRO')),
    sector TEXT,
    currency TEXT DEFAULT 'BRL',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transações de Investimento
CREATE TABLE IF NOT EXISTS investment_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id TEXT REFERENCES assets(id),
    account_id TEXT REFERENCES accounts(id),
    type TEXT NOT NULL CHECK (type IN ('COMPRA', 'VENDA', 'DIVIDENDO', 'JCP', 'BONIFICACAO', 'DESDOBRAMENTO', 'GRUPAMENTO')),
    quantity DECIMAL(15,8),
    unit_price DECIMAL(15,8),
    fees DECIMAL(15,2) DEFAULT 0,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolios
CREATE TABLE IF NOT EXISTS portfolios (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id TEXT NOT NULL REFERENCES assets(id),
    total_quantity DECIMAL(15,8) DEFAULT 0,
    average_price DECIMAL(15,8) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, asset_id)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = id);

-- User Settings
CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (auth.uid()::text = user_id);

-- Accounts
CREATE POLICY "Users can manage own accounts" ON accounts FOR ALL USING (auth.uid()::text = user_id);

-- Credit Cards (via account relationship)
CREATE POLICY "Users can manage own credit cards" ON credit_cards FOR ALL USING (
  auth.uid()::text IN (
    SELECT user_id FROM accounts WHERE id = account_id
  )
);

-- Categories
CREATE POLICY "Users can manage own categories" ON categories FOR ALL USING (auth.uid()::text = user_id);

-- Recurrences
CREATE POLICY "Users can manage own recurrences" ON recurrences FOR ALL USING (auth.uid()::text = user_id);

-- Cost Centers
CREATE POLICY "Users can manage own cost centers" ON cost_centers FOR ALL USING (auth.uid()::text = user_id);

-- Projects
CREATE POLICY "Users can manage own projects" ON projects FOR ALL USING (auth.uid()::text = user_id);

-- Contacts
CREATE POLICY "Users can manage own contacts" ON contacts FOR ALL USING (auth.uid()::text = user_id);

-- Tags
CREATE POLICY "Users can manage own tags" ON tags FOR ALL USING (auth.uid()::text = user_id);

-- Transactions
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid()::text = user_id);

-- Split Transactions (via transaction relationship)
CREATE POLICY "Users can manage own split transactions" ON split_transactions FOR ALL USING (
  auth.uid()::text IN (
    SELECT user_id FROM transactions WHERE id = transaction_id
  )
);

-- Transfers
CREATE POLICY "Users can manage own transfers" ON transfers FOR ALL USING (auth.uid()::text = user_id);

-- Transaction Tags (via transaction relationship)
CREATE POLICY "Users can manage own transaction tags" ON transaction_tags FOR ALL USING (
  auth.uid()::text IN (
    SELECT user_id FROM transactions WHERE id = transaction_id
  )
);

-- Assets (public read only)
CREATE POLICY "Everyone can view assets" ON assets FOR SELECT USING (true);

-- Investment Transactions
CREATE POLICY "Users can manage own investment transactions" ON investment_transactions FOR ALL USING (auth.uid()::text = user_id);

-- Portfolios
CREATE POLICY "Users can manage own portfolios" ON portfolios FOR ALL USING (auth.uid()::text = user_id);

-- Plans (public read only)
CREATE POLICY "Everyone can view plans" ON plans FOR SELECT USING (true);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_competence_date ON transactions(competence_date);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_status_date ON transactions(user_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_investment_transactions_user_id ON investment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_asset_id ON investment_transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_date ON investment_transactions(date);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_asset ON portfolios(user_id, asset_id);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_origin_account ON transfers(origin_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_destination_account ON transfers(destination_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(date);

CREATE INDEX IF NOT EXISTS idx_recurrences_user_id ON recurrences(user_id);
CREATE INDEX IF NOT EXISTS idx_recurrences_type ON recurrences(type);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction_id ON transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag_id ON transaction_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_split_transactions_transaction_id ON split_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_split_transactions_category_id ON split_transactions(category_id);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id);

CREATE INDEX IF NOT EXISTS idx_cost_centers_user_id ON cost_centers(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_type ON cost_centers(type);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

CREATE INDEX IF NOT EXISTS idx_assets_ticker ON assets(ticker);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(name);

CREATE INDEX IF NOT EXISTS idx_credit_cards_account_id ON credit_cards(account_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_closing_day ON credit_cards(closing_day);
CREATE INDEX IF NOT EXISTS idx_credit_cards_due_day ON credit_cards(due_day);

-- Trigger para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'Usuário'),
    NOW(),
    NOW()
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();