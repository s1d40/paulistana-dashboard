-- ========================================================
-- SCRIPT: Memória de Chat DEFINITIVA para n8n (v4)
-- OBJETIVO: Resolver "Got unexpected type: undefined"
--           usando o tipo JSONB exigido pelo LangChain.
-- ========================================================

-- 1. Remove a tabela antiga para resetar o esquema
DROP TABLE IF EXISTS chat_memory;

-- 2. Cria a tabela com o esquema exato do LangChain/n8n
-- IMPORTANTE: A coluna 'message' DEVE ser JSONB.
CREATE TABLE chat_memory (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,       -- LangChain padrão
    "sessionId" TEXT,               -- n8n variação
    message JSONB NOT NULL,         -- OBRIGATÓRIO: JSONB (não use TEXT)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_v4_session ON chat_memory(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_v4_sessionId ON chat_memory("sessionId");

COMMENT ON TABLE chat_memory IS 'Memória persistente definitiva usando JSONB para compatibilidade total com n8n/LangChain';
