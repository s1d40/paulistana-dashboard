import requests
import csv
import urllib.parse
import time

queries = [
    "Castanha Do Pará Quebrada 1kg", "Mix De Castanhas 1kg", "Amendoim Caramelizado Brasil Frutt",
    "Chá De Hibisco Flor Inteira 500g", "Cravo Da Índia 500g", "Anis Estrelado 200g",
    "Semente De Girassol Crua Descascada 1kg", "Mix De Sementes Abóbora Girassol",
    "Mix Frutas Vermelhas 500g", "Canela Em Pau 6cm 1kg", "Folha De Louro 500g",
    "Laranja Desidratada Rodelas 200g", "Limão Desidratado Rodelas", 
    "Mix De Vegetais Desidratados 500g", "Tremoço Graúdo Balde 2kg", 
    "Levedura Nutricional 1kg", "Beterraba Em Pó 500g", "Chá De Camomila 500g",
    "Chá De Sene 500g", "Psyllium Husk 60% 500g", "Semente De Abóbora Crua 1kg",
    "Ovinho De Amendoim Brasil Frutt"
]

all_results = []

print("Iniciando mineração PROFUNDA de dados no Mercado Livre para o André...")

for idx, q in enumerate(queries):
    print(f"[{idx+1}/{len(queries)}] Buscando: {q}...")
    url = f"https://painel.paulistanaemporio.com/api/ml-spy?limit=25&full=true&q={urllib.parse.quote(q)}"
    
    try:
        response = requests.get(url, timeout=60)
        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])
            print(f"  -> Encontrados {len(results)} concorrentes.")
            
            for rank, r in enumerate(results):
                shipping = r.get("shipping", {})
                all_results.append({
                    "Termo de Busca": q,
                    "Ranking de Busca": rank + 1,
                    "ID do Anuncio": r.get("id", ""),
                    "Titulo": r.get("title", ""),
                    "Marca": r.get("brand", ""),
                    "Categoria": r.get("seller_category", ""),
                    "Preco (R$)": r.get("price", 0),
                    "Preco Original (R$)": r.get("original_price") or r.get("price", 0),
                    "Desconto (%)": r.get("discount_percentage", 0),
                    "Avaliacao (0-5)": r.get("rating_average", 0),
                    "Qtd Avaliacoes": r.get("reviews_count", 0),
                    "Vendas Estimadas": r.get("estimated_sales", 0),
                    "Faturamento Estimado (R$)": r.get("estimated_revenue", 0),
                    "Frete Gratis": "Sim" if shipping.get("free_shipping") else "Nao",
                    "FULL": "Sim" if "fulfillment" in shipping.get("tags", []) else "Nao",
                    "Localizacao": r.get("location", ""),
                    "Garantia": r.get("warranty", ""),
                    "Link": r.get("permalink", "")
                })
        else:
            print(f"  -> Erro na API: {response.status_code}")
    except Exception as e:
        print(f"  -> Falha na requisicao: {e}")
        
    time.sleep(2) # Pausa pra nao sobrecarregar o servidor

csv_filename = "dashboard/Mapeamento_MercadoLivre_Paulistana.csv"
print(f"\nSalvando {len(all_results)} resultados em {csv_filename}...")

if all_results:
    keys = all_results[0].keys()
    with open(csv_filename, 'w', newline='', encoding='utf-8') as output_file:
        dict_writer = csv.DictWriter(output_file, fieldnames=keys)
        dict_writer.writeheader()
        dict_writer.writerows(all_results)
    
    print("Salvo com sucesso!")
else:
    print("Nenhum dado retornado para salvar.")
