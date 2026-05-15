-- SCRIPT: Adicionar coluna hashtags à tabela posts
-- Execute este comando no SQL Editor do seu projeto na Supabase

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hashtags TEXT;

-- (Opcional) Comentário de documentação para a coluna
COMMENT ON COLUMN public.posts.hashtags IS 'Armazena as hashtags geradas pelo Arquiteto para o post';
