-- ========================================================
-- SCRIPT: Padronização de Primary Keys (UUID)
-- OBJETIVO: Garantir que todas as tabelas de assets usem UUIDs
--           e permitam que o n8n envie o ID gerado.
-- ========================================================

-- 1. Tabela de Imagens
-- Caso id_imagem não seja UUID, vamos converter. 
-- Se já for UUID, apenas garantimos o default.
ALTER TABLE imagens ALTER COLUMN id_imagem SET DATA TYPE UUID USING (
    CASE 
        WHEN id_imagem IS NULL OR id_imagem = '' THEN gen_random_uuid()
        ELSE id_imagem::UUID 
    END
);
ALTER TABLE imagens ALTER COLUMN id_imagem SET DEFAULT gen_random_uuid();

-- 2. Tabela de Áudios
ALTER TABLE audios ALTER COLUMN id_audio SET DATA TYPE UUID USING (
    CASE 
        WHEN id_audio IS NULL OR id_audio = '' THEN gen_random_uuid()
        ELSE id_audio::UUID 
    END
);
ALTER TABLE audios ALTER COLUMN id_audio SET DEFAULT gen_random_uuid();

-- 3. Tabela de Vídeos (Finais)
ALTER TABLE videos ALTER COLUMN id_video_final SET DATA TYPE UUID USING (
    CASE 
        WHEN id_video_final IS NULL OR id_video_final = '' THEN gen_random_uuid()
        ELSE id_video_final::UUID 
    END
);
ALTER TABLE videos ALTER COLUMN id_video_final SET DEFAULT gen_random_uuid();

-- 4. Tabela de Vídeos Cenas (Já criada como UUID, apenas reforçando)
ALTER TABLE videos_cenas ALTER COLUMN id SET DEFAULT gen_random_uuid();

COMMENT ON COLUMN imagens.id_imagem IS 'ID Único do asset (Gerado pelo n8n ou DB)';
COMMENT ON COLUMN audios.id_audio IS 'ID Único do asset (Gerado pelo n8n ou DB)';
COMMENT ON COLUMN videos.id_video_final IS 'ID Único do vídeo final (Gerado pelo n8n ou DB)';
