-- Vincular os clientes existentes aos emails da equipe
-- Execute no Supabase SQL Editor

-- Sidnei (email pessoal - Google OAuth)
UPDATE clientes 
SET email = 'sidneifelipe9@gmail.com'
WHERE nome_cliente ILIKE '%Felipe%' AND email IS NULL;

-- Vincular também a conta Supabase Auth do Sidnei
UPDATE clientes
SET auth_user_id = '6bc9fa0c-5804-464e-8476-1c1b31996e16'
WHERE email = 'sidnei@sfaisolutions.com';

-- Verificar resultado
SELECT id_cliente, nome_cliente, email, auth_user_id FROM clientes;
