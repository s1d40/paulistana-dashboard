-- Tabela para os produtos do lojista (Grupos de anúncios)
CREATE TABLE public.tracked_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e criar políticas (opcional, mas recomendado)
ALTER TABLE public.tracked_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.tracked_products FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.tracked_products FOR ALL USING (auth.role() = 'authenticated');


-- Tabela para os anúncios dos concorrentes
CREATE TABLE public.competitor_ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.tracked_products(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    ml_id TEXT, -- ID do anúncio no Mercado Livre (opcional)
    seller_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.competitor_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.competitor_ads FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.competitor_ads FOR ALL USING (auth.role() = 'authenticated');


-- Tabela para o histórico diário de preços
CREATE TABLE public.price_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ad_id UUID REFERENCES public.competitor_ads(id) ON DELETE CASCADE NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index para otimizar as buscas por ad_id e data (muito útil para o dashboard)
CREATE INDEX idx_price_history_ad_date ON public.price_history (ad_id, captured_at DESC);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.price_history FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.price_history FOR ALL USING (auth.role() = 'authenticated');


-- Habilitar o Realtime para essas tabelas (para atualizações ao vivo no Next.js)
alter publication supabase_realtime add table tracked_products;
alter publication supabase_realtime add table competitor_ads;
alter publication supabase_realtime add table price_history;
