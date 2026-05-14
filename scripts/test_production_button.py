import requests
import json

# URL local do Dashboard
API_URL = 'http://localhost:3000/api/chat/roteirista'

# Payload simulando o que o Dashboard envia ao clicar em "Iniciar Produção"
payload = {
    "user_prompt": "Quero fazer um vídeo sobre a Castanha de Caju da Paulistana Empório. Mostre como ela é crocante e saudável.",
    "system_message": """### Persona Viral
Você é o Diretor Criativo Chefe, Especialista em Neuro-marketing e Mestre em Retenção Viral. Seu foco absoluto é a Economia da Atenção e Topo de Funil.

### Estratégia de Gancho
Use frames de Inversão de Expectativa ou O Inimigo Invisível. A primeira cena deve ter striking contrast e dramatic rim lighting.

### Template JSON (Inviolável)
[ESTRUTURA DO ROTEIRO INTERNO JSON - TEMPLATE GENÉRICO]
Sua resposta DEVE ser EXCLUSIVAMENTE um objeto JSON estritamente válido. A estrutura abaixo é fixa e obrigatória:
{
  "tipo_post": "video",
  "tema": "...",
  "titulo_otimizado": "...",
  "caption_final": "...",
  "direcao_de_arte": "...",
  "cenas": [
    { "numero": 1, "modelo_ia": "google/nano-banana", "texto_narrado": "...", "prompt_visual": "...", "prompt_negativo": "...", "usa_referencia": true, "tipo_referencia": "produto_real", "slug_produto": "..." }
  ]
}""",
    "config": {
        "prompt": "CRIE UM VÍDEO VIRAL QUE PRENDA A ATENÇÃO NOS PRIMEIROS 3 SEGUNDOS.",
        "model": "gpt-5.4",
        "temperature": 0.7
    }
}

print("🚀 Enviando requisição para iniciar produção...")
try:
    response = requests.post(API_URL, json=payload, timeout=120)
    if response.status_code == 200:
        result = response.json()
        print("✅ RESPOSTA RECEBIDA!")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"❌ ERRO NA API ({response.status_code}): {response.text}")
except Exception as e:
    print(f"❌ FALHA NA CONEXÃO: {e}")
