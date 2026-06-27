CREATE TABLE IF NOT EXISTS public.ml_watchlist (
    product_id TEXT PRIMARY KEY,
    category_id TEXT,
    title TEXT,
    thumbnail TEXT,
    permalink TEXT,
    my_product_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add my_product_id column if table already existed without it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ml_watchlist' AND column_name='my_product_id') THEN
        ALTER TABLE public.ml_watchlist ADD COLUMN my_product_id TEXT;
    END IF;
END $$;

ALTER TABLE public.ml_watchlist ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for all' AND tablename = 'ml_watchlist') THEN
        CREATE POLICY "Enable read access for all" ON public.ml_watchlist FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert access for all' AND tablename = 'ml_watchlist') THEN
        CREATE POLICY "Enable insert access for all" ON public.ml_watchlist FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable update access for all' AND tablename = 'ml_watchlist') THEN
        CREATE POLICY "Enable update access for all" ON public.ml_watchlist FOR UPDATE USING (true);
    END IF;
END $$;
