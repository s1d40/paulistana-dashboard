-- ==========================================
-- STOREFRONT HEADLESS: SCHEMA COMPLETO
-- ==========================================
-- Combina: ecommerce_products, ecommerce_orders, store_configs
-- Deve ser executado APÓS o script multi-tenant (clients já existe)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABELA DE CONFIGURAÇÃO DAS LOJAS
-- ==========================================
-- Cada subdomínio (codigodossignos.paulistanaemporio.com) mapeia a um client_id

CREATE TABLE IF NOT EXISTS public.store_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,          -- "codigodossignos" (subdomínio)
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,         -- "Código dos Signos"
    description TEXT,
    theme JSONB DEFAULT '{}'::jsonb,            -- { accent, bg, card, text, ... }
    logo_url TEXT,
    banner_url TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,     -- { instagram, tiktok, youtube }
    payment_methods JSONB DEFAULT '["pix","credit_card"]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. TABELA DE PRODUTOS DO E-COMMERCE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.ecommerce_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    store_slug VARCHAR(100) REFERENCES public.store_configs(slug), -- Link direto à loja
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    price NUMERIC(10,2) NOT NULL,
    compare_at_price NUMERIC(10,2),             -- Preço "de" (riscado)
    currency VARCHAR(3) DEFAULT 'BRL',
    category VARCHAR(100),
    product_type VARCHAR(50) DEFAULT 'digital',  -- 'physical', 'digital', 'service', 'astrology_map'
    slug VARCHAR(255) UNIQUE,                    -- URL-friendly slug
    stock_quantity INTEGER DEFAULT -1,           -- -1 para infinito (digitais)
    image_url TEXT,
    gallery_urls JSONB DEFAULT '[]'::jsonb,     -- Array de URLs de imagens adicionais
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. TABELA DE PEDIDOS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.ecommerce_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    store_slug VARCHAR(100) REFERENCES public.store_configs(slug),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    total_amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(255),
    shipping_address JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. TABELA DE ITENS DO PEDIDO
-- ==========================================

CREATE TABLE IF NOT EXISTS public.ecommerce_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.ecommerce_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.ecommerce_products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. SEGURANÇA (RLS)
-- ==========================================

ALTER TABLE public.store_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_order_items ENABLE ROW LEVEL SECURITY;

-- Store configs: público pode ler lojas ativas
DROP POLICY IF EXISTS "Public can view active stores" ON public.store_configs;
CREATE POLICY "Public can view active stores"
    ON public.store_configs FOR SELECT
    USING (is_active = true);

-- Owners can manage their stores
DROP POLICY IF EXISTS "Owners can manage their stores" ON public.store_configs;
CREATE POLICY "Owners can manage their stores"
    ON public.store_configs FOR ALL
    USING (public.user_belongs_to_client(client_id));

-- Produtos: público pode ler produtos ativos (storefront não tem auth)
DROP POLICY IF EXISTS "Public can view active products" ON public.ecommerce_products;
CREATE POLICY "Public can view active products"
    ON public.ecommerce_products FOR SELECT
    USING (is_active = true);

-- Owners can manage their products
DROP POLICY IF EXISTS "Users can manage their client products" ON public.ecommerce_products;
CREATE POLICY "Users can manage their client products"
    ON public.ecommerce_products FOR ALL
    USING (public.user_belongs_to_client(client_id));

-- Pedidos: público pode INSERIR (checkout anônimo), owners podem ler/atualizar
DROP POLICY IF EXISTS "Public can create orders" ON public.ecommerce_orders;
CREATE POLICY "Public can create orders"
    ON public.ecommerce_orders FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their client orders" ON public.ecommerce_orders;
CREATE POLICY "Users can view their client orders"
    ON public.ecommerce_orders FOR SELECT
    USING (public.user_belongs_to_client(client_id));

DROP POLICY IF EXISTS "Users can update their client orders" ON public.ecommerce_orders;
CREATE POLICY "Users can update their client orders"
    ON public.ecommerce_orders FOR UPDATE
    USING (public.user_belongs_to_client(client_id));

-- Order items: follow order access
DROP POLICY IF EXISTS "Public can create order items" ON public.ecommerce_order_items;
CREATE POLICY "Public can create order items"
    ON public.ecommerce_order_items FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their client order items" ON public.ecommerce_order_items;
CREATE POLICY "Users can view their client order items"
    ON public.ecommerce_order_items FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.ecommerce_orders o WHERE o.id = order_id AND public.user_belongs_to_client(o.client_id))
    );

-- ==========================================
-- 6. ÍNDICES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_ecommerce_products_store_slug ON public.ecommerce_products(store_slug);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_client_id ON public.ecommerce_products(client_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_category ON public.ecommerce_products(category);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_slug ON public.ecommerce_products(slug);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_store_slug ON public.ecommerce_orders(store_slug);
CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_status ON public.ecommerce_orders(status);
CREATE INDEX IF NOT EXISTS idx_store_configs_client_id ON public.store_configs(client_id);

-- ==========================================
-- 7. TRIGGER PARA NOTIFICAR N8N QUANDO PEDIDO PAGO
-- ==========================================

CREATE OR REPLACE FUNCTION notify_n8n_order_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN
    PERFORM net.http_post(
      url:='https://YOUR_N8N_INSTANCE_URL/webhook/order-paid',
      body:=json_build_object(
        'order_id', NEW.id,
        'client_id', NEW.client_id,
        'store_slug', NEW.store_slug,
        'customer_email', NEW.customer_email,
        'total_amount', NEW.total_amount
      )::jsonb,
      headers:='{"Content-Type": "application/json"}'::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_paid_trigger ON public.ecommerce_orders;
CREATE TRIGGER on_order_paid_trigger
  AFTER UPDATE ON public.ecommerce_orders
  FOR EACH ROW EXECUTE FUNCTION notify_n8n_order_paid();

-- ==========================================
-- 8. ENABLE REALTIME
-- ==========================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.ecommerce_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ecommerce_products;
