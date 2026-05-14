-- ========================================================
-- SCRIPT: Atualização Unificada do Schema (Content Studio)
-- OBJETIVO: Preparar as tabelas para a Fábrica de Conteúdo,
--           unificando Imagens e Carrosséis.
-- ========================================================

-- 1. Preparação da Tabela 'imagens'
-- Adiciona flag para identificar se é um slide de carrossel
ALTER TABLE imagens ADD COLUMN IF NOT EXISTS is_carrossel BOOLEAN DEFAULT false;

-- Adiciona campo para armazenar o payload JSON do Satori (Cores, Fontes, Layouts)
ALTER TABLE imagens ADD COLUMN IF NOT EXISTS payload_api JSONB;

-- Adiciona coluna de erro para debug dos Workers
ALTER TABLE imagens ADD COLUMN IF NOT EXISTS error_log TEXT;

-- 2. Preparação da Tabela 'audios'
ALTER TABLE audios ADD COLUMN IF NOT EXISTS error_log TEXT;

-- 3. Preparação da Tabela 'videos'
ALTER TABLE videos ADD COLUMN IF NOT EXISTS error_log TEXT;

-- 4. Documentação dos Campos
COMMENT ON COLUMN imagens.is_carrossel IS 'Define se a imagem é um asset de vídeo ou um slide de carrossel';
COMMENT ON COLUMN imagens.payload_api IS 'Configurações visuais específicas para o motor Satori (Apenas Carrossel)';
COMMENT ON COLUMN imagens.error_log IS 'Mensagem de erro enviada pelo Worker do n8n';
COMMENT ON COLUMN audios.error_log IS 'Mensagem de erro enviada pelo Worker do n8n';
COMMENT ON COLUMN videos.error_log IS 'Mensagem de erro enviada pelo Worker do n8n';

-- 5. Índices de Performance (Opcional, mas recomendado)
CREATE INDEX IF NOT EXISTS idx_imagens_id_post ON imagens(id_post);
CREATE INDEX IF NOT EXISTS idx_audios_id_post ON audios(id_post);
CREATE INDEX IF NOT EXISTS idx_videos_id_post ON videos(id_post);
