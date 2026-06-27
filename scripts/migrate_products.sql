-- Tabela Mercado Livre
CREATE TABLE IF NOT EXISTS produtos_ml (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC,
    available_quantity INTEGER,
    thumbnail TEXT,
    permalink TEXT,
    slug_imagem_real TEXT REFERENCES produtos(slug_imagem_real)
);

-- Tabela TikTok Shop
CREATE TABLE IF NOT EXISTS produtos_tiktok (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC,
    available_quantity INTEGER,
    thumbnail TEXT,
    permalink TEXT,
    slug_imagem_real TEXT REFERENCES produtos(slug_imagem_real)
);

-- Tabela Nuvemshop
CREATE TABLE IF NOT EXISTS produtos_nuvemshop (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC,
    available_quantity INTEGER,
    thumbnail TEXT,
    permalink TEXT,
    slug_imagem_real TEXT REFERENCES produtos(slug_imagem_real)
);
