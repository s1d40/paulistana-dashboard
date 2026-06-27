import os
import requests
import datetime
from time import sleep
from supabase import create_client, Client
from dotenv import load_dotenv

# Carrega variáveis de ambiente
env_path = os.path.join(os.path.dirname(__file__), '../../painel.paulistanaemporio.com/.env.local')
if not os.path.exists(env_path):
    env_path = os.path.join(os.path.dirname(__file__), '../../../dashboard/.env.local')
load_dotenv(env_path)

URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not URL or not KEY:
    print("Erro: Credenciais do Supabase não encontradas.")
    exit(1)

supabase: Client = create_client(URL, KEY)

TERMOS = [
    "Castanha de Caju W1", "Castanha do Pará", "Pistache Torrado", 
    "Azeite de Oliva Extra Virgem", "Chá Twinings", "Café Especial Torrado", 
    "Geleia Premium", "Mel Trufado", "Vinho Tinto Reservado", 
    "Nozes Mariposa", "Amêndoa Defumada", "Tâmara Medjool",
    "Bacalhau Porto", "Queijo Parmesão Argentino"
]

import auth

def mine_data():
    print("🚀 Conectando ao Supabase e iniciando Mineração...")
    total_coletados = 0
    total_receita = 0
    
    try:
        token = auth.get_access_token()
        headers = {"Authorization": f"Bearer {token}", "User-Agent": "Mozilla/5.0"}
    except Exception as e:
        print("Erro token:", e)
        return
    
    for termo in TERMOS:
        print(f"🔍 Minerando: {termo}")
        url = f"https://api.mercadolibre.com/products/search?status=active&site_id=MLB&q={requests.utils.quote(termo)}&limit=50"
        try:
            res = requests.get(url, headers=headers)
            data = res.json()
            resultados = data.get("results", [])
            
            records = []
            for item in resultados:
                item_id = item.get("id")
                # products API retorna name, não title
                titulo = item.get("name") 
                
                # O preço no products/search fica dentro de buy_box_winner ou no raiz
                preco = item.get("buy_box_winner", {}).get("price", 0)
                if preco == 0:
                    preco = item.get("price", 0)
                    
                link = item.get("permalink")
                
                vendas = item.get("sold_quantity", 0) 
                if vendas == 0:
                    vendas = int(item.get("available_quantity", 1) * 1.5)
                
                receita = preco * vendas
                data_coleta = datetime.datetime.now().isoformat()
                
                records.append({
                    "id": item_id,
                    "termo_busca": termo,
                    "titulo": titulo,
                    "preco": preco,
                    "vendas_estimadas": vendas,
                    "receita_estimada": receita,
                    "link": link,
                    "data_coleta": data_coleta
                })
            
            if records:
                # Usa upsert para não duplicar IDs
                response = supabase.table("ml_concorrentes").upsert(records).execute()
                total_coletados += len(records)
                total_receita += sum([r['receita_estimada'] for r in records])
                print(f"✅ {len(records)} itens salvos no Supabase para '{termo}'.")
                
        except Exception as e:
            print(f"Erro ao minerar {termo}: {e}")
        
        sleep(1)

    print(f"\n✅ Mineração Concluída e salva no Supabase!")
    print(f"📊 Total de Produtos Mapeados: {total_coletados}")
    print(f"💰 Faturamento Estimado Mapeado: R$ {total_receita:,.2f}")

if __name__ == "__main__":
    mine_data()
