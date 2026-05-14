-- ========================================================
-- SCRIPT: Unificação de ID de Post e Sessão de Chat
-- OBJETIVO: Garantir que a tabela de posts esteja preparada
--           para usar o UUID da sessão como chave primária.
-- ========================================================

-- 1. Garante que a coluna de referência de chat existe na tabela de posts
-- (Útil se você quiser manter um ID de post diferente do ID da sessão)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS chat_session_id TEXT;

-- 2. Cria um índice para vincular as duas tabelas rapidamente
CREATE INDEX IF NOT EXISTS idx_posts_chat_session ON posts(chat_session_id);

COMMENT ON COLUMN posts.chat_session_id IS 'ID da conversa no chat que deu origem a este post (unificado com sessionId)';
