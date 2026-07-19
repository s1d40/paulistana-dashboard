-- ==========================================
-- SCRIPT DE ARQUITETURA: HEADLESS E-COMMERCE
-- ==========================================

-- 1. Tabela de Produtos do E-commerce
CREATE TABLE IF NOT EXISTS public.ecommerce_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    category VARCHAR(100),
    product_type VARCHAR(50) DEFAULT 'digital', -- 'physical', 'digital', 'service', 'astrology_map'
    stock_quantity INTEGER DEFAULT -1, -- -1 para infinito (produtos digitais)
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb, -- Campos customizáveis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS public.ecommerce_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    total_amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'completed', 'canceled', 'failed'
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    payment_method VARCHAR(50), -- 'credit_card', 'pix', 'boleto'
    payment_gateway VARCHAR(50), -- 'stripe', 'mercadopago'
    gateway_transaction_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS public.ecommerce_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.ecommerce_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.ecommerce_products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ESTRATÉGIA DE SEGURANÇA (RLS)
-- ==========================================

ALTER TABLE public.ecommerce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_order_items ENABLE ROW LEVEL SECURITY;

-- Policies para Produtos
DROP POLICY IF EXISTS "Users can view their client products" ON public.ecommerce_products;
CREATE POLICY "Users can view their client products" ON public.ecommerce_products FOR SELECT USING ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can insert their client products" ON public.ecommerce_products;
CREATE POLICY "Users can insert their client products" ON public.ecommerce_products FOR INSERT WITH CHECK ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can update their client products" ON public.ecommerce_products;
CREATE POLICY "Users can update their client products" ON public.ecommerce_products FOR UPDATE USING ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can delete their client products" ON public.ecommerce_products;
CREATE POLICY "Users can delete their client products" ON public.ecommerce_products FOR DELETE USING ( public.user_belongs_to_client(client_id) );


-- Policies para Pedidos
DROP POLICY IF EXISTS "Users can view their client orders" ON public.ecommerce_orders;
CREATE POLICY "Users can view their client orders" ON public.ecommerce_orders FOR SELECT USING ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can insert their client orders" ON public.ecommerce_orders;
CREATE POLICY "Users can insert their client orders" ON public.ecommerce_orders FOR INSERT WITH CHECK ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can update their client orders" ON public.ecommerce_orders;
CREATE POLICY "Users can update their client orders" ON public.ecommerce_orders FOR UPDATE USING ( public.user_belongs_to_client(client_id) );

-- Policies para Itens do Pedido
DROP POLICY IF EXISTS "Users can view their client order items" ON public.ecommerce_order_items;
CREATE POLICY "Users can view their client order items" ON public.ecommerce_order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ecommerce_orders o WHERE o.id = order_id AND public.user_belongs_to_client(o.client_id))
);

DROP POLICY IF EXISTS "Users can insert their client order items" ON public.ecommerce_order_items;
CREATE POLICY "Users can insert their client order items" ON public.ecommerce_order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.ecommerce_orders o WHERE o.id = order_id AND public.user_belongs_to_client(o.client_id))
);

DROP POLICY IF EXISTS "Users can update their client order items" ON public.ecommerce_order_items;
CREATE POLICY "Users can update their client order items" ON public.ecommerce_order_items FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.ecommerce_orders o WHERE o.id = order_id AND public.user_belongs_to_client(o.client_id))
);
