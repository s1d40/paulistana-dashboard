-- Adicionar colunas de perfil do Instagram na tabela contas
ALTER TABLE contas ADD COLUMN IF NOT EXISTS ig_username TEXT;
ALTER TABLE contas ADD COLUMN IF NOT EXISTS ig_profile_picture_url TEXT;
