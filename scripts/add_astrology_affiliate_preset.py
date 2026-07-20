import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase URL and Key must be provided as environment variables.")

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

inviolable_template = """[ESTRUTURA DO ROTEIRO INTERNO JSON - TEMPLATE GENÉRICO]
Sua resposta DEVE ser EXCLUSIVAMENTE um objeto JSON estritamente válido. A estrutura abaixo é fixa e obrigatória:
{
  "tipo_post": "Video Informativo TikTok",
  "tema": "...",
  "cenas": [
    { "numero": 1, "texto_narrado": "...", "prompt_visual": "...", "prompt_negativo": "...", "usa_referencia": true, "tipo_referencia": "produto_real", "slug_produto": "..." }
  ]
}"""

preset = {
    "name": "Astrologia Conversão Afiliados",
    "track": "video",
    "description": "Funil de vendas para afiliados focado em cristais, colares do zodíaco e mapas astrais.",
    "config": {"model": "gpt-4o", "temperature": 0.7, "top_p": 1.0, "max_tokens": 4000},
    "sessions": [
        {
            "id": "persona",
            "title": "Persona Astrólogo de Vendas",
            "isEssential": True,
            "isEditable": True,
            "content": "Você é um Mestre Astrólogo e especialista em cristaloterapia. Você analisa a energia dos signos e recomenda cristais, amuletos ou mapas astrais para curar dores astrais e potencializar pontos fortes."
        },
        {
            "id": "estrategia_venda",
            "title": "Estratégia de Venda (Funil)",
            "isEssential": True,
            "isEditable": True,
            "content": "Siga o funil: 1) Dor (Gancho: 'Por que o [Signo] sempre sofre com [Problema]?'). 2) Explicação Astrológica (Causa da dor baseada nos astros). 3) Solução Mágica (O produto afiliado: colar do signo, cristal específico, mapa astral). O texto deve induzir curiosidade extrema para clicar no link da bio."
        },
        {
            "id": "estetica",
            "title": "Estética Visual",
            "isEssential": False,
            "isEditable": True,
            "content": "Prompt visual com estilo místico, cores ricas (roxo profundo, azul estelar, brilhos dourados), foco macro nos cristais, joias ou mapas astrais. Evitar: 'text, watermark, ugly, words'."
        },
        {
            "id": "output",
            "title": "Template JSON (Inviolável)",
            "isEssential": True,
            "isEditable": False,
            "content": inviolable_template
        }
    ]
}

response = requests.post(f"{SUPABASE_URL}/rest/v1/content_presets", headers=headers, data=json.dumps(preset))
if response.status_code == 201:
    print(f"✅ Preset '{preset['name']}' criado com sucesso!")
elif response.status_code == 409:
    print(f"⚠️ Preset '{preset['name']}' já existe.")
else:
    print(f"❌ Erro ao criar '{preset['name']}': {response.text}")
