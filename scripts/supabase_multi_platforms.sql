-- Cria a tabela unificada para gerenciar as 3 plataformas
CREATE TABLE IF NOT EXISTS produtos_plataformas (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC,
    available_quantity INTEGER,
    thumbnail TEXT,
    permalink TEXT,
    platform TEXT NOT NULL, -- 'mercadolivre', 'nuvemshop', ou 'tiktok'
    slug_imagem_real TEXT REFERENCES produtos(slug_imagem_real),
    slug_embalagem TEXT,
    data_sincronizacao TIMESTAMPTZ DEFAULT now()
);

-- Habilita segurança de acesso (opcional mas recomendado)
ALTER TABLE produtos_plataformas ENABLE ROW LEVEL SECURITY;

-- Cria política permitindo que todos vejam (caso o dashboard precise acessar direto)
CREATE POLICY "Public profiles are viewable by everyone."
ON produtos_plataformas FOR SELECT
USING ( true );
