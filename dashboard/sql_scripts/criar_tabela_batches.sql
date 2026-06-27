-- =========================================
-- SCRIPT DE CRIAÇÃO DA TABELA DE BATCHES
-- =========================================
-- Cria uma tabela para gerenciar lotes de produção e seu estado
-- permitindo que o usuário recupere os UUIDs gerados em sessões anteriores.

CREATE TABLE IF NOT EXISTS public.production_batches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    preset_id UUID REFERENCES public.content_presets(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.contas(id_conta) ON DELETE SET NULL,
    
    -- O array de itens da Staging Area ficará salvo neste JSONB
    -- Formato esperado: [{"uuid": "...", "produto": "...", "slug": "..."}]
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Metadados de rastreio
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configura permissões de Row Level Security (RLS) se necessário
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;

-- Exemplo genérico que permite select/insert para acesso anônimo/autenticado básico
CREATE POLICY "Enable all for public usage" ON public.production_batches FOR ALL USING (true);
