-- ========================================================
-- SCRIPT: Memória de Chat Blindada v2 (Fix n8n)
-- OBJETIVO: Resolver o erro "Got unexpected type: undefined" 
--           criando colunas redundantes e valores padrão.
-- ========================================================

-- 1. Remove a tabela antiga
DROP TABLE IF EXISTS chat_memory;

-- 2. Cria a tabela com redundância de colunas para n8n/LangChain
-- Isso garante que se o n8n buscar "message" ou "content", ele ache o dado.
CREATE TABLE chat_memory (
    id SERIAL PRIMARY KEY,
    
    -- Colunas de Sessão (Redundantes)
    "sessionId" TEXT NOT NULL DEFAULT '', 
    "session_id" TEXT DEFAULT '',
    
    -- Role (Obrigatório para LangChain, padrão 'user' evita undefined)
    role TEXT NOT NULL DEFAULT 'user',
    
    -- Colunas de Mensagem (Redundantes para evitar falha de mapeamento)
    message TEXT NOT NULL DEFAULT '',
    content TEXT DEFAULT '',
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índice para performance
CREATE INDEX IF NOT EXISTS idx_chat_mem_v2 ON chat_memory("sessionId");

COMMENT ON TABLE chat_memory IS 'Memória persistente v2 com proteção contra campos undefined/null para n8n';
