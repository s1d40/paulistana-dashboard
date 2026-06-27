import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")

sql = """
CREATE TABLE IF NOT EXISTS produtos_ml (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC,
    available_quantity INTEGER,
    thumbnail TEXT,
    permalink TEXT,
    slug_imagem_real TEXT REFERENCES produtos(slug_imagem_real)
);

CREATE TABLE IF NOT EXISTS produtos_tiktok (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC,
    available_quantity INTEGER,
    thumbnail TEXT,
    permalink TEXT,
    slug_imagem_real TEXT REFERENCES produtos(slug_imagem_real)
);

CREATE TABLE IF NOT EXISTS produtos_nuvemshop (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC,
    available_quantity INTEGER,
    thumbnail TEXT,
    permalink TEXT,
    slug_imagem_real TEXT REFERENCES produtos(slug_imagem_real)
);
"""

# Usar PostgREST REST API pode não suportar DDL puro.
# Na verdade, normalmente usamos o cliente python supabase ou mandamos para o painel de SQL.
# Como eu posso executar o SQL?
