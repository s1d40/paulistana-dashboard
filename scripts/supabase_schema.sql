-- 1. Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_cliente TEXT NOT NULL,
    chat_id TEXT
);

-- 2. Contas
CREATE TABLE IF NOT EXISTS contas (
    id_conta UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cliente UUID REFERENCES clientes(id_cliente),
    nicho TEXT,
    nome_conta TEXT NOT NULL
);

-- 3. Produtos
CREATE TABLE IF NOT EXISTS produtos (
    slug_imagem_real TEXT PRIMARY KEY,
    produto TEXT NOT NULL,
    slug_embalagem TEXT,
    restricao_narrativa TEXT,
    restricao_visual TEXT
);

-- 4. Posts
CREATE TABLE IF NOT EXISTS posts (
    id_post UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conta UUID REFERENCES contas(id_conta),
    tema_post TEXT,
    titulo_post TEXT,
    roteiro_gerado TEXT,
    prompt_imagem TEXT,
    captions TEXT,
    status TEXT,
    instagram_url TEXT,
    data_criacao TIMESTAMPTZ DEFAULT now(),
    agendado TEXT,
    feedback TEXT,
    tipo_post TEXT
);

-- 5. Imagens
CREATE TABLE IF NOT EXISTS imagens (
    id_imagem UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_post UUID REFERENCES posts(id_post) ON DELETE CASCADE,
    image_url TEXT,
    url_imagem_fundo TEXT,
    prompt_utilizado TEXT,
    texto_na_imagem TEXT,
    data_geracao TIMESTAMPTZ DEFAULT now(),
    numero_cena INTEGER,
    sincronizado_pinecone TEXT
);

-- 6. Áudios
CREATE TABLE IF NOT EXISTS audios (
    id_audio TEXT PRIMARY KEY,
    id_post UUID REFERENCES posts(id_post) ON DELETE CASCADE,
    audio_url TEXT,
    texto_narrado TEXT,
    data_geracao TIMESTAMPTZ DEFAULT now(),
    numero_cena INTEGER,
    timestamps TEXT
);

-- 7. Vídeos
CREATE TABLE IF NOT EXISTS videos (
    id_video_final TEXT PRIMARY KEY,
    id_post UUID REFERENCES posts(id_post) ON DELETE CASCADE,
    video_final_url TEXT,
    data_compilacao TIMESTAMPTZ DEFAULT now()
);
