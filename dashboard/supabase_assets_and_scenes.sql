-- ========================================================
-- SCRIPT: Criação de Tabela de Cenas e Padronização de UUIDs
-- OBJETIVO: Criar a tabela de vídeos individuais e garantir
--           que todo asset tenha um ID único.
-- ========================================================

-- 1. Criar Tabela de Vídeos de Cenas Individuais
CREATE TABLE IF NOT EXISTS videos_cenas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_post UUID REFERENCES posts(id_post) ON DELETE CASCADE,
    numero_cena INTEGER NOT NULL,
    video_url TEXT,                 -- URL do fragmento .mp4 no GCS
    status TEXT DEFAULT 'Pendente', -- Pendente, OK, Erro
    error_log TEXT,
    data_geracao TIMESTAMPTZ DEFAULT now(),
    UNIQUE(id_post, numero_cena)    -- Evita duplicidade de vídeo para a mesma cena
);

-- 2. Garantir UUIDs nas tabelas existentes (Se não existirem como PK)
-- Nota: 'id_imagem' e 'id_audio' já existem, vamos garantir que sejam UUIDs funcionais.

-- 3. Adicionar Comentários
COMMENT ON TABLE videos_cenas IS 'Armazena os vídeos de cenas individuais antes da compilação final';
COMMENT ON COLUMN videos_cenas.video_url IS 'URL pública do fragmento de vídeo no GCS';

-- 4. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_videos_cenas_post ON videos_cenas(id_post);

-- 5. Função para gerar UUIDs em massa para registros antigos (Opcional)
-- Se você tiver registros onde o id está vazio ou não é UUID, podemos rodar:
-- UPDATE imagens SET id_imagem = gen_random_uuid() WHERE id_imagem IS NULL OR id_imagem = '';
