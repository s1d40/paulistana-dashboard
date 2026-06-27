-- ========================================================
-- SCRIPT: Adicionar Agrupamento de Posts por Lista
-- OBJETIVO: Vincular os posts gerados à lista de ideação
--           que os originou, facilitando o agrupamento 
--           (ex: "Geração 1 da Lista X").
-- ========================================================

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS production_list_id UUID REFERENCES production_lists(id);

-- Índice para acelerar a busca de todos os posts de uma determinada lista
CREATE INDEX IF NOT EXISTS idx_posts_production_list_id ON posts(production_list_id);

COMMENT ON COLUMN posts.production_list_id IS 'ID da lista de ideação que originou este post durante a produção em massa';
