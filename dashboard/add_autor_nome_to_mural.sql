-- Adicionar coluna autor_nome ao Mural de Ideias
ALTER TABLE public.mural_ideias ADD COLUMN IF NOT EXISTS autor_nome TEXT;

-- Garantir que a extensão uuid-ossp esteja habilitada (caso uuid_generate_v4 falhe)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
