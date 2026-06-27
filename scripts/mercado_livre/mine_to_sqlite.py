import requests
import sqlite3
import datetime
from time import sleep

# Termos de alto valor para o Empório Paulistana
TERMOS = [
    "Castanha de Caju W1", "Castanha do Pará", "Pistache Torrado", 
    "Azeite de Oliva Extra Virgem", "Chá Twinings", "Café Especial Torrado", 
    "Geleia Premium", "Mel Trufado", "Vinho Tinto Reservado", 
    "Nozes Mariposa", "Amêndoa Defumada", "Tâmara Medjool",
    "Bacalhau Porto", "Queijo Parmesão Argentino"
]

DB_PATH = "../../dashboard/paulistana_intelligence.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ml_concorrentes (
            id TEXT PRIMARY KEY,
            termo_busca TEXT,
            titulo TEXT,
            preco REAL,
            vendas_estimadas INTEGER,
            receita_estimada REAL,
            link TEXT,
            data_coleta TEXT
        )
    """)
    conn.commit()
    return conn

import auth

def mine_data():
    conn = init_db()
    cursor = conn.cursor()
    
    total_coletados = 0
    total_receita = 0

    print("🚀 Iniciando Mineração Profunda de Dados do Mercado Livre...")
    try:
        import auth
        token = auth.get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json"
        }
    except Exception as e:
        print("Erro token:", e)
        return
    
    for termo in TERMOS:
        print(f"🔍 Minerando: {termo}")
        url = f"https://api.mercadolibre.com/products/search?status=active&site_id=MLB&q={requests.utils.quote(termo)}&limit=50"
        try:
            res = requests.get(url, headers=headers)
            data = res.json()
            print(f"Status Code: {res.status_code}")
            if "error" in data or "message" in data:
                print(f"API Error: {data}")
            resultados = data.get("results", [])
            
            for item in resultados:
                item_id = item.get("id")
                titulo = item.get("title")
                preco = item.get("price", 0)
                link = item.get("permalink")
                
                # Estimativa de vendas baseada em catálogo ou inferência simples
                vendas = item.get("sold_quantity", 0) 
                if vendas == 0:
                    vendas = int(item.get("available_quantity", 1) * 1.5) # Heurística simples
                
                receita = preco * vendas
                data_coleta = datetime.datetime.now().isoformat()
                
                cursor.execute("""
                    INSERT OR REPLACE INTO ml_concorrentes 
                    (id, termo_busca, titulo, preco, vendas_estimadas, receita_estimada, link, data_coleta)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (item_id, termo, titulo, preco, vendas, receita, link, data_coleta))
                
                total_coletados += 1
                total_receita += receita
                
        except Exception as e:
            print(f"Erro ao minerar {termo}: {e}")
        
        sleep(1) # Respeitar rate limits

    conn.commit()
    conn.close()
    
    print(f"✅ Mineração Concluída!")
    print(f"📊 Total de Produtos Mapeados no Banco de Dados: {total_coletados}")
    print(f"💰 Faturamento Total Mapeado dos Concorrentes: R$ {total_receita:,.2f}")

if __name__ == "__main__":
    mine_data()
