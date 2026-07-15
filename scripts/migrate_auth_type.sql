-- ============================================================
-- MIGRAÇÃO: Adicionar coluna auth_type na tabela contas
-- Rodar no Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Adicionar a coluna (default = instagram_direct pois é o tipo atual)
ALTER TABLE contas ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'instagram_direct';

-- 2. Marcar contas que têm facebook_access_token como tipo 'facebook'
UPDATE contas 
SET auth_type = 'facebook' 
WHERE facebook_access_token IS NOT NULL 
  AND facebook_access_token != '';

-- 3. Garantir que contas sem facebook token fiquem como instagram_direct
UPDATE contas 
SET auth_type = 'instagram_direct' 
WHERE facebook_access_token IS NULL 
   OR facebook_access_token = '';

-- 4. Verificar resultado
SELECT id_conta, nome_conta, auth_type, 
       CASE WHEN ig_access_token IS NOT NULL THEN 'sim' ELSE 'não' END as tem_ig_token,
       CASE WHEN facebook_access_token IS NOT NULL THEN 'sim' ELSE 'não' END as tem_fb_token
FROM contas;
