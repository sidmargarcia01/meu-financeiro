-- 📄 Descrição: Índices de performance para otimização de consultas
-- 🧱 Contexto: Melhorar performance das consultas mais comuns
-- 📌 Responsável: Windsurf AI
-- 📅 Data: 2026-04-04
-- ⚙️ Tecnologias: PostgreSQL, Supabase
-- ✅ Revisado: Não

-- Índices para Transactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_competence_date ON transactions(competence_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Índice composto para consultas de dashboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_status_date ON transactions(user_id, status, due_date);

-- Índices para Investment Transactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_investment_transactions_user_id ON investment_transactions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_investment_transactions_asset_id ON investment_transactions(asset_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_investment_transactions_date ON investment_transactions(date);

-- Índices para Portfolios
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portfolios_user_asset ON portfolios(user_id, asset_id);

-- Índices para Accounts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_type ON accounts(type);

-- Índices para Categories
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Índices para Transfers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfers_origin_account ON transfers(origin_account_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfers_destination_account ON transfers(destination_account_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transfers_date ON transfers(date);

-- Índices para Recurrences
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recurrences_user_id ON recurrences(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recurrences_type ON recurrences(type);

-- Índices para Tags
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_name ON tags(name);

-- Índices para Transaction Tags
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_tags_transaction_id ON transaction_tags(transaction_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_tags_tag_id ON transaction_tags(tag_id);

-- Índices para Split Transactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_split_transactions_transaction_id ON split_transactions(transaction_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_split_transactions_category_id ON split_transactions(category_id);

-- Índices para Users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_plan_id ON users(plan_id);

-- Índices para Cost Centers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cost_centers_user_id ON cost_centers(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cost_centers_type ON cost_centers(type);

-- Índices para Projects
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON projects(status);

-- Índices para Contacts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Índices para Assets
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_ticker ON assets(ticker);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_name ON assets(name);

-- Índices para Credit Cards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_cards_account_id ON credit_cards(account_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_cards_closing_day ON credit_cards(closing_day);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_cards_due_day ON credit_cards(due_day);

-- Análise de estatísticas para otimização do query planner
ANALYZE transactions;
ANALYZE investment_transactions;
ANALYZE portfolios;
ANALYZE accounts;
ANALYZE categories;
ANALYZE transfers;
ANALYZE recurrences;
ANALYZE tags;
ANALYZE transaction_tags;
ANALYZE split_transactions;
ANALYZE users;
ANALYZE cost_centers;
ANALYZE projects;
ANALYZE contacts;
ANALYZE assets;
ANALYZE credit_cards;
