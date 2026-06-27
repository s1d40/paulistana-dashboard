-- ========================================================
-- SCRIPT MIGRATION: MUDANÇA PARA ARQUITETURA DE ID_CENA
-- ========================================================

-- 1. ADICIONAR COLUNA ID_CENA NAS TABELAS DE ASSETS
ALTER TABLE imagens ADD COLUMN IF NOT EXISTS id_cena UUID;
ALTER TABLE audios ADD COLUMN IF NOT EXISTS id_cena UUID;

-- 2. ATUALIZAR TABELA VIDEOS_CENAS
-- A tabela videos_cenas já possui a coluna 'id' do tipo UUID como Primary Key.
-- O frontend e o n8n agora enviarão o id_cena direto para essa coluna 'id'.
-- Portanto, a constraint antiga que obrigava (id_post, numero_cena) ser único
-- já não é estritamente necessária se usarmos o UPSERT no 'id'.
-- Mesmo assim, podemos manter a unicidade para evitar lixo.
-- Para segurança, garantimos que a constraint pode ser removida se estiver causando conflitos.
ALTER TABLE videos_cenas DROP CONSTRAINT IF EXISTS videos_cenas_id_post_numero_cena_key;

-- 3. COMENTÁRIOS DE DOCUMENTAÇÃO
COMMENT ON COLUMN imagens.id_cena IS 'ID da cena (UUID gerado pelo frontend) à qual esta imagem pertence.';
COMMENT ON COLUMN audios.id_cena IS 'ID da cena (UUID gerado pelo frontend) à qual este áudio pertence.';
COMMENT ON COLUMN videos_cenas.id IS 'ID da cena (id_cena UUID gerado pelo frontend). Funciona como Primary Key.';

-- ========================================================
-- NOTAS PARA O N8N UPSERT:
-- Quando for fazer INSERT/UPDATE nestas tabelas no n8n:
-- * imagens: passe 'id_cena' = {{ $json.id_cena }}
-- * audios: passe 'id_cena' = {{ $json.id_cena }}
-- * videos_cenas: passe 'id' = {{ $json.id_cena }} (Atenção: nome da coluna é 'id')
-- ========================================================
