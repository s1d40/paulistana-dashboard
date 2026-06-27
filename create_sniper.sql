-- 1. Tabela para cadastrar os alvos
CREATE TABLE IF NOT EXISTS public.ml_tracked_ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ml_item_id TEXT NOT NULL UNIQUE,
    custom_name TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela para guardar o histórico de preços diário
CREATE TABLE IF NOT EXISTS public.ml_tracked_ads_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ml_item_id TEXT NOT NULL REFERENCES public.ml_tracked_ads(ml_item_id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL,
    status TEXT,
    snapshot_date DATE DEFAULT CURRENT_DATE
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_ml_tracked_ads_history_item ON public.ml_tracked_ads_history(ml_item_id);
CREATE INDEX IF NOT EXISTS idx_ml_tracked_ads_history_date ON public.ml_tracked_ads_history(snapshot_date);

-- Políticas RLS (Leitura Pública / Escrita Liberada para o Backend)
ALTER TABLE public.ml_tracked_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_tracked_ads_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all" ON public.ml_tracked_ads FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all" ON public.ml_tracked_ads FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete access for all" ON public.ml_tracked_ads FOR DELETE USING (true);

CREATE POLICY "Enable read access for all" ON public.ml_tracked_ads_history FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all" ON public.ml_tracked_ads_history FOR INSERT WITH CHECK (true);
