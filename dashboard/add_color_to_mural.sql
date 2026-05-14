-- Adicionar coluna de cor ao Mural de Ideias
ALTER TABLE public.mural_ideias ADD COLUMN IF NOT EXISTS cor TEXT DEFAULT 'zinc';
