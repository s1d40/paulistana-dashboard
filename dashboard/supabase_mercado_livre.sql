-- Tabela de Campanhas Ads (Mercado Livre)
CREATE TABLE IF NOT EXISTS ml_campaigns (
    campaign_id BIGINT PRIMARY KEY,
    name TEXT,
    status TEXT,
    budget NUMERIC,
    strategy TEXT,
    acos_target NUMERIC,
    currency_id TEXT,
    channel TEXT,
    date_created TIMESTAMPTZ,
    last_updated TIMESTAMPTZ,
    metrics_summary JSONB,
    last_sync TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Itens da Campanha Ads (Mercado Livre)
CREATE TABLE IF NOT EXISTS ml_campaign_items (
    campaign_id BIGINT REFERENCES ml_campaigns(campaign_id) ON DELETE CASCADE,
    item_id TEXT,
    price NUMERIC,
    available_quantity INTEGER,
    item_metrics JSONB,
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (campaign_id, item_id)
);

-- Tabela de Pedidos (Bling)
CREATE TABLE IF NOT EXISTS bling_pedidos (
    id BIGINT PRIMARY KEY,
    numero TEXT UNIQUE,
    data TIMESTAMPTZ,
    total NUMERIC,
    dados_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabelas de Estrutura de Produtos/Kits (Bling)
CREATE TABLE IF NOT EXISTS bling_estrutura (
    produto_pai_id BIGINT PRIMARY KEY,
    produto_pai_codigo TEXT,
    produto_pai_nome TEXT,
    lancamento_estoque TEXT,
    tipo_estoque TEXT,
    dados_json JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bling_estrutura_componentes (
    produto_pai_id BIGINT REFERENCES bling_estrutura(produto_pai_id) ON DELETE CASCADE,
    componente_produto_id BIGINT,
    componente_codigo TEXT,
    componente_nome TEXT,
    quantidade NUMERIC,
    PRIMARY KEY (produto_pai_id, componente_produto_id)
);

CREATE TABLE IF NOT EXISTS bling_produtos_sem_estrutura (
    produto_id BIGINT PRIMARY KEY,
    codigo TEXT,
    nome TEXT,
    situacao TEXT,
    formato TEXT,
    dados_json JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Segurança e RLS
ALTER TABLE ml_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_campaign_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bling_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bling_estrutura ENABLE ROW LEVEL SECURITY;
ALTER TABLE bling_estrutura_componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bling_produtos_sem_estrutura ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permitindo acesso total para service_role ou auth temporário)
CREATE POLICY "Allow ALL for authenticated" ON ml_campaigns FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow ALL for authenticated" ON ml_campaign_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow ALL for authenticated" ON bling_pedidos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow ALL for authenticated" ON bling_estrutura FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow ALL for authenticated" ON bling_estrutura_componentes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow ALL for authenticated" ON bling_produtos_sem_estrutura FOR ALL TO authenticated USING (true);
