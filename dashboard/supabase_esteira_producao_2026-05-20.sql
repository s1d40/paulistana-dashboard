-- ========================================================
-- SCRIPT SQL: Configuração de Banco para Esteira de Produção
-- DATA: 2026-05-20
-- DESTINO: Copiar e executar no SQL Editor do Supabase
-- ========================================================

-- 1. Garante que a tabela 'posts' possui os campos de Legenda (captions) e Hashtags
ALTER TABLE posts ADD COLUMN IF NOT EXISTS captions TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hashtags TEXT;

-- 2. Garante que a tabela 'posts' possui os campos para controle de agendamento automático
ALTER TABLE posts ADD COLUMN IF NOT EXISTS data_agendamento TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status_agendamento TEXT DEFAULT 'nao_agendado';

-- 3. Garante que a tabela 'posts' consiga rastrear a qual lista de ideação ela pertence (para o agrupamento)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS production_list_id UUID REFERENCES production_lists(id);

-- 4. Cria um índice para acelerar as consultas de agrupamento no monitor de produção
CREATE INDEX IF NOT EXISTS idx_posts_production_list_id ON posts(production_list_id);

-- 5. Comentários explicativos para documentação interna do banco
COMMENT ON COLUMN posts.captions IS 'Legenda persuasiva e limpa gerada pelo fluxo automatizado';
COMMENT ON COLUMN posts.hashtags IS 'Hashtags estratégicas para postagem nas redes sociais';
COMMENT ON COLUMN posts.data_agendamento IS 'Data e hora programadas para a publicação automática nas contas vinculadas';
COMMENT ON COLUMN posts.status_agendamento IS 'Estado do agendamento do post (nao_agendado, agendado, publicado, falhou)';
COMMENT ON COLUMN posts.production_list_id IS 'ID da lista de ideação de origem do post para a esteira em massa';
