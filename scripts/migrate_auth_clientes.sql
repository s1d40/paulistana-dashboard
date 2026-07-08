-- Migration: Adicionar campos de auth ao clientes
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email TEXT;

-- Índice para busca rápida por auth_user_id
CREATE INDEX IF NOT EXISTS idx_clientes_auth_user_id ON clientes(auth_user_id);
