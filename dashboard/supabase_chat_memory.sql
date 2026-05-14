-- ========================================================
-- SCRIPT: Memória de Chat e Sessões de Produção
-- OBJETIVO: Persistir o histórico de conversas do Agente Arquiteto
--           vinculado a um ID de sessão gerado pelo Frontend.
-- ========================================================

-- 1. Tabela de Memória de Chat (LangChain Pattern)
CREATE TABLE IF NOT EXISTS chat_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,       -- Gerado pelo Frontend
    role TEXT NOT NULL,             -- 'user' ou 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_mem_session ON chat_memory(session_id);

-- 2. Garantir que a tabela de posts pode guardar a referência da sessão
ALTER TABLE posts ADD COLUMN IF NOT EXISTS chat_session_id UUID;

COMMENT ON TABLE chat_memory IS 'Armazena o histórico de conversas para prover memória ao Agente Arquiteto';
