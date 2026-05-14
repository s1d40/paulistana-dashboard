-- ========================================================
-- SCRIPT: Tabela de Inteligência (Presets de Sessão)
-- OBJETIVO: Armazenar as sessões de System Message que o
--           Agente Arquiteto irá manipular.
-- ========================================================

CREATE TABLE IF NOT EXISTS content_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,       -- Nome amigável (Ex: TikTok Viral)
    track TEXT NOT NULL,             -- video, carrossel, blog
    description TEXT,                -- O que este preset faz
    sessions JSONB NOT NULL,         -- Estrutura: [{id, title, content, isEssential, isEditable}]
    config JSONB DEFAULT '{
        "model": "gpt-4o",
        "temperature": 0.7,
        "top_p": 1.0,
        "max_tokens": 4000
    }',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir os Presets Iniciais (Semeando o banco)
INSERT INTO content_presets (name, track, sessions)
VALUES 
('Video_TikTok_Default', 'video', '[
    {"id": "persona", "title": "Persona", "content": "Você é um gestor de conteúdo especialista em TikTok...", "isEssential": true, "isEditable": true},
    {"id": "hook", "title": "Regras de Gancho", "content": "O vídeo deve começar com um fato histórico...", "isEssential": true, "isEditable": false}
]'),
('Carrossel_Satori_Default', 'carrossel', '[
    {"id": "persona", "title": "Persona", "content": "Você é um Diretor de Arte focado em carrosséis...", "isEssential": true, "isEditable": true}
]');

COMMENT ON TABLE content_presets IS 'Armazena as inteligências configuráveis (System Messages) do sistema';
