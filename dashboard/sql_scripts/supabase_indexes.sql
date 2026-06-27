-- ========================================================
-- SCRIPT SQL: Criação de Índices de Otimização (Gargalos)
-- DATA: 2026-05-27
-- DESTINO: Copiar e executar no SQL Editor do Supabase
-- ========================================================

-- 1. Otimização do Board (mural_ideias)
-- A busca em board/page.tsx filtra ou lê dados ordenados por posicao.
CREATE INDEX IF NOT EXISTS idx_mural_ideias_posicao_status ON mural_ideias(status, posicao);

-- 2. Otimização da Listagem de Posts (posts)
-- Acelera a consulta fetchContentPosts() que ordena por data_criacao DESC.
CREATE INDEX IF NOT EXISTS idx_posts_conta_data ON posts(id_conta, data_criacao DESC);

-- 3. Garante índice nas mídias (se já não existir da migration anterior)
CREATE INDEX IF NOT EXISTS idx_videos_cenas_post ON videos_cenas(id_post);
