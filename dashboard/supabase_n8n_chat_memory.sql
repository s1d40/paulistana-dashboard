-- ========================================================
-- SCRIPT: Memória de Chat Compatível com n8n
-- OBJETIVO: Criar a tabela chat_memory com o esquema exato
--           que o nó "Postgres Chat Memory" do n8n exige.
-- ========================================================

-- 1. Remove a tabela antiga para evitar conflitos de tipos/nomes
DROP TABLE IF EXISTS chat_memory;

-- 2. Cria a tabela usando o padrão CamelCase do n8n
-- IMPORTANTE: "sessionId" precisa de aspas para preservar a maiúscula no Postgres
CREATE TABLE chat_memory (
    id SERIAL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,       -- n8n busca exatamente por 'sessionId'
    role TEXT,                      -- 'user' ou 'assistant'
    message TEXT,                   -- n8n busca por 'message' em vez de 'content'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índice para garantir que a busca pelo histórico seja instantânea
CREATE INDEX IF NOT EXISTS idx_chat_mem_session ON chat_memory("sessionId");

COMMENT ON TABLE chat_memory IS 'Tabela de memória persistente para o Agente Arquiteto (Esquema Nativo n8n)';
