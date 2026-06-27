-- ========================================================
-- SCRIPT: Adicionar Suporte a Histórico de Vídeos (Path B)
-- OBJETIVO: Permitir múltiplas gerações (N) para uma única
--           cena (1), abandonando o UPSERT por id_cena e 
--           transformando-o em Foreign Key.
-- ========================================================

-- 1. Adicionar a coluna id_cena na tabela videos_cenas
ALTER TABLE videos_cenas 
ADD COLUMN IF NOT EXISTS id_cena UUID;

-- (Opcional, mas recomendado) Criar um índice para busca rápida pelo frontend
CREATE INDEX IF NOT EXISTS idx_videos_cenas_id_cena ON videos_cenas(id_cena);

COMMENT ON COLUMN videos_cenas.id_cena IS 'Referência ao UUID estável da cena gerado pelo frontend. Usado para agrupar o histórico de tentativas.';
COMMENT ON COLUMN videos_cenas.id IS 'Identificador único desta renderização específica de vídeo (Histórico 1 para N).';