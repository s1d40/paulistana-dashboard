-- Adicionar coluna auth_type na tabela contas
-- Valores: 'facebook' (via Facebook Page) | 'instagram_direct' (via Instagram Business Login)
ALTER TABLE contas ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'instagram_direct';

-- Atualizar contas existentes baseado nos tokens
UPDATE contas SET auth_type = 'facebook' WHERE facebook_access_token IS NOT NULL AND facebook_access_token != '';
UPDATE contas SET auth_type = 'instagram_direct' WHERE (facebook_access_token IS NULL OR facebook_access_token = '') AND ig_access_token IS NOT NULL;
