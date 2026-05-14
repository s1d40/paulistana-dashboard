-- ========================================================
-- SCRIPT: Tabela Centralizada de Erros de Produção
-- OBJETIVO: Centralizar logs de falhas de todos os Workers
--           do n8n em um único lugar para monitoramento.
-- ========================================================

CREATE TABLE IF NOT EXISTS production_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_post UUID REFERENCES posts(id_post) ON DELETE CASCADE,
    numero_cena INTEGER,
    worker_name TEXT NOT NULL,      -- Nome do Worker (ex: Worker_Audio, Worker_Imagem)
    error_message TEXT,             -- Mensagem amigável do erro
    error_details JSONB,            -- Stacktrace ou resposta bruta da API
    request_payload JSONB,          -- Os dados que foram enviados no request
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para busca rápida pelo Dashboard
CREATE INDEX IF NOT EXISTS idx_prod_errors_post ON production_errors(id_post);
CREATE INDEX IF NOT EXISTS idx_prod_errors_worker ON production_errors(worker_name);

COMMENT ON TABLE production_errors IS 'Log centralizado de falhas na esteira de produção IA';
