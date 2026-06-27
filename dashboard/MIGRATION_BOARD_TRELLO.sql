-- 1. Adicionar colunas para suporte a reordenação e etiquetas
ALTER TABLE public.mural_ideias ADD COLUMN IF NOT EXISTS posicao INT DEFAULT 0;
ALTER TABLE public.mural_ideias ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Inicializar posições existentes baseadas na data de criação
-- Isso evita que todos fiquem com posição 0 inicialmente
WITH updated AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY status ORDER BY data_criacao DESC) as new_pos
  FROM public.mural_ideias
)
UPDATE public.mural_ideias
SET posicao = updated.new_pos
FROM updated
WHERE public.mural_ideias.id = updated.id;

-- 3. Garantir que o Realtime está ativo para a tabela
BEGIN;
  DO $$ 
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      CREATE PUBLICATION supabase_realtime FOR TABLE public.mural_ideias;
    ELSE
      -- Tenta adicionar a tabela à publicação se ela ainda não estiver lá
      BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.mural_ideias;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Tabela mural_ideias já está na publicação realtime ou erro ao adicionar.';
      END;
    END IF;
  END $$;
COMMIT;
