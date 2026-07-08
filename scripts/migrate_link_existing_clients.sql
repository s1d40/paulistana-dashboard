-- Vincular os clientes existentes aos emails conhecidos
-- Execute no Supabase SQL Editor

-- Felipe (dono das contas Natural Feeding, Codigo dos Signos, etc.)
UPDATE clientes 
SET email = 'andrefelicissimo@gmail.com'
WHERE nome_cliente ILIKE '%Felipe%' AND email IS NULL;

-- Verificar resultado
SELECT id_cliente, nome_cliente, email, auth_user_id FROM clientes;
