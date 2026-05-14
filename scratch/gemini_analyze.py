import os
import csv
import json
import time
from PIL import Image
from google import genai
from google.genai import types
from pydantic import BaseModel

API_KEY = "AIzaSyBjaxWbQXa3ndvvvgOszpAyulJ_5V3WiFI"

try:
    client = genai.Client(api_key=API_KEY)
except Exception as e:
    print(f"Erro ao instanciar API: {e}")
    exit(1)

# Ler referencia de produtos do CSV
slugs = []
if os.path.exists('produtos.csv'):
    with open('produtos.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row.get('Slug Equivalente no Banco de Dados')
            if slug:
                slugs.append(slug)

# Extra common names to avoid unknown misses
common_names = ["cramberry", "macadamia", "avela", "linhaça", "gergelim", "uva-passa"]
slugs.extend(common_names)

prompt = f"""Você é um classificador especializado em ingredientes alimentícios e embalagens a granel.
Abaixo está o Dicionário Estrito de Slugs de Produtos Conhecidos:
{json.dumps(slugs)}

Regras de Classificação:
1. Examine a Imagem fornecida.
2. Se a imagem é apenas uma Tabela Nutricional (Nutrition Facts), ingredientes em formato de texto, avisos genéricos, logomarca crua ou textos de "benefícios" sem mostrar o produto em si, defina 'is_tabular_or_text' = true. O slug será "invalido".
3. Se a imagem mostrar fotos de produtos a granel (frente, embalagem, os grãos ou folhas ou frutas, potes), defina 'is_tabular_or_text' = false.
4. Identifique precisamente qual o produto dentro da foto escolhendo APENAS DA LISTA de dicionário fornecido. Não crie palavras novas.
5. Se o produto não for encontrável no dicionário, descreva-o como o slug aproximado mais genérico sem inventar. Exemplo, "gergelim" em vez de "gergelim-torrado" se a lista não tiver torrado.
"""

class ImageAnalysis(BaseModel):
    is_tabular_or_text: bool
    slug: str

results = {}
dir_path = 'images/EMBALAGEM NOVA'
files = [f for f in os.listdir(dir_path) if f.lower().endswith(('.png', '.webp', '.jpg', '.jpeg'))]

# Somente os arquivos que nao foram formatados ainda (ex: não estão no dicionario ou tem nomes aleatorios)
# Para forçar re-processamento das 275!
unmarked_files = [f for f in files if f not in [f"{s}.png" for s in slugs] and not f.startswith("imagem-frente")]
print(f"Buscando analises para {len(unmarked_files)} arquivos orbitando o diretorio.")

for idx, f in enumerate(unmarked_files):
    filepath = os.path.join(dir_path, f)
    print(f"[{idx+1}/{len(unmarked_files)}] Analisando {f}...")
    try:
        # Resize client-side to save network latency/tokens
        image = Image.open(filepath)
        image.thumbnail((512, 512))
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, image],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ImageAnalysis,
            ),
        )
        data = json.loads(response.text)
        data['original_name'] = f
        results[f] = data
        print(f"  -> Resultado: {data['slug']} (Table/Text: {data['is_tabular_or_text']})")
        
        # Save checkpoints safely
        if (idx + 1) % 10 == 0:
            with open('scratch/analysis_results.json', 'w', encoding='utf-8') as outfile:
                json.dump(results, outfile, indent=2, ensure_ascii=False)
                
        # Anti rate-limit measure
        time.sleep(2.5)
    except Exception as e:
        print(f"Erro em {f}: {e}")
        time.sleep(5)

# Final Save
with open('scratch/analysis_results.json', 'w', encoding='utf-8') as outfile:
    json.dump(results, outfile, indent=2, ensure_ascii=False)

print("Analise visual finalizada! Salvo em scratch/analysis_results.json")
