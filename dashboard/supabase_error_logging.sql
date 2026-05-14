-- ========================================================
-- SCRIPT: Adição de Colunas de Log de Erro (VERSÃO CORRIGIDA)
-- ========================================================

-- 1. Tabela de Áudios (Confirmada)
ALTER TABLE audios ADD COLUMN IF NOT EXISTS error_log TEXT;

-- 2. Tabela de Imagens (Confirmada)
ALTER TABLE imagens ADD COLUMN IF NOT EXISTS error_log TEXT;

-- 3. Tabela de Vídeos (Confirmada)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS error_log TEXT;

-- 4. Tabela de Carrossel (Tentativa segura)
-- O Supabase retornou que 'carrossel' não existe. 
-- Vou tentar 'imagens_carrossel' que foi solicitada, mas de forma segura.
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'imagens_carrossel') THEN
        ALTER TABLE imagens_carrossel ADD COLUMN IF NOT EXISTS error_log TEXT;
    END IF;
END $$;

-- 5. Adicionando Comentários para documentação
COMMENT ON COLUMN audios.error_log IS 'Registra falhas de geração de áudio vindas do n8n';
COMMENT ON COLUMN imagens.error_log IS 'Registra falhas de geração de imagem vindas do n8n';
COMMENT ON COLUMN videos.error_log IS 'Registra falhas de renderização de vídeo vindas do n8n';
