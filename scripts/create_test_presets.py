import requests
import json
import uuid
from datetime import datetime

SUPABASE_URL = 'https://wolygamyyjgpoqsfefye.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbHlnYW15eWpncG9xc2ZlZnllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM1NTQ0OSwiZXhwIjoyMDkzOTMxNDQ5fQ.lrjXQbm_y6DkSA_2CsFsoFbdWoKZGpHUAvGGSEd79bY'

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

presets = [
    {
        "name": "Vídeo Viral SFAI",
        "track": "video",
        "description": "Estratégia de Retenção Viral baseada em Scroll-Stoppers e Curiosidade.",
        "config": {"model": "gpt-5.4", "temperature": 0.7, "prompt": "CRIE UM VÍDEO VIRAL QUE PRENDA A ATENÇÃO NOS PRIMEIROS 3 SEGUNDOS."},
        "sessions": [
            {
                "id": "persona",
                "title": "Persona Viral",
                "isEssential": True,
                "isEditable": True,
                "content": "Você é o Diretor Criativo Chefe, Especialista em Neuro-marketing e Mestre em Retenção Viral. Seu foco absoluto é a Economia da Atenção e Topo de Funil."
            },
            {
                "id": "estrategia",
                "title": "Estratégia de Gancho",
                "isEssential": True,
                "isEditable": True,
                "content": "Use frames de Inversão de Expectativa ou O Inimigo Invisível. A primeira cena deve ter striking contrast e dramatic rim lighting."
            },
            {
                "id": "template",
                "title": "Template JSON (Inviolável)",
                "isEssential": True,
                "isEditable": False,
                "content": inviolable_template
            }
        ]
    },
    {
        "name": "TikTok Shop Conversão",
        "track": "video",
        "description": "Focado em fundo de funil, demonstração tátil e autoridade científica para marketplace.",
        "config": {"model": "gpt-5.4", "temperature": 0.7, "prompt": "CRIE UM VÍDEO DE VENDA DIRETA PARA TIKTOK SHOP COM FOCO EM BENEFÍCIOS TANGÍVEIS."},
        "sessions": [
            {
                "id": "persona",
                "title": "Diretor de Conversão",
                "isEssential": True,
                "isEditable": True,
                "content": "Você é o Diretor de Conversão e Especialista em Neuro-vendas Audiovisuais. Foco em demonstração tátil, autoridade científica e conversão direta."
            },
            {
                "id": "visual",
                "title": "Regra 1:3",
                "isEssential": True,
                "isEditable": True,
                "content": "Intercale rigorosamente: 1 cena focando na Dor (humano exausto fotorrealista) para cada 3 cenas focando na Solução (produto, macro shots da textura)."
            },
            {
                "id": "template",
                "title": "Template JSON (Inviolável)",
                "isEssential": True,
                "isEditable": False,
                "content": inviolable_template
            }
        ]
    }
]

for preset in presets:
    response = requests.post(f"{SUPABASE_URL}/rest/v1/content_presets", headers=headers, data=json.dumps(preset))
    if response.status_code == 201:
        print(f"✅ Preset '{preset['name']}' criado com sucesso!")
    else:
        print(f"❌ Erro ao criar '{preset['name']}': {response.text}")
