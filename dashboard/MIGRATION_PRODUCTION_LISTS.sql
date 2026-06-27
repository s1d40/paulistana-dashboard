-- ========================================================
-- SCRIPT: Tabela de Listas de Produção (Ideation Agent)
-- OBJETIVO: Armazenar listas temáticas geradas por agentes
--           para serem consumidas pela esteira de produção.
-- ========================================================

CREATE TABLE IF NOT EXISTS production_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    preset_id UUID REFERENCES content_presets(id),
    items JSONB NOT NULL, -- Array de objetos: [{ "tema": "...", "prompt": "..." }]
    status TEXT DEFAULT 'Aguardando',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE production_lists IS 'Listas abstratas de temas geradas pelo Agente de Ideação para produção em massa';
