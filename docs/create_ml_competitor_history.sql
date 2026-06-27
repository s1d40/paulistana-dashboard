-- Criar a tabela de histórico de concorrentes
CREATE TABLE IF NOT EXISTS public.ml_competitor_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    title TEXT NOT NULL,
    price NUMERIC(10, 2),
    rank INTEGER NOT NULL,
    thumbnail TEXT,
    permalink TEXT,
    snapshot_date DATE DEFAULT CURRENT_DATE
);

-- Criar índices para otimizar as buscas no Dashboard
CREATE INDEX IF NOT EXISTS idx_ml_competitor_history_category ON public.ml_competitor_history (category_id);
CREATE INDEX IF NOT EXISTS idx_ml_competitor_history_product ON public.ml_competitor_history (product_id);
CREATE INDEX IF NOT EXISTS idx_ml_competitor_history_date ON public.ml_competitor_history (snapshot_date);

-- Política de segurança RLS (opcional, mas boa prática)
ALTER TABLE public.ml_competitor_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.ml_competitor_history FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.ml_competitor_history FOR INSERT WITH CHECK (true);
