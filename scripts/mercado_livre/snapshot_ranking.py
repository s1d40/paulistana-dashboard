import os
import requests
from datetime import datetime
from supabase_client import supabase

# A instância do Supabase já vem pronta do supabase_client

# Nichos Hiper-específicos da Paulistana Empório
TARGET_CATEGORIES = [
    {"id": "MLB247521", "name": "Chás e Ervas"},
    {"id": "MLB269723", "name": "Frutas Secas e Desidratadas"},
    {"id": "MLB272151", "name": "Castanhas e Amendoins"},
    {"id": "MLB269724", "name": "Sementes (Chia, Linhaça, etc)"},
    {"id": "MLB271071", "name": "Snacks Salgados"},
    {"id": "MLB439587", "name": "Açúcar e Adoçantes Naturais"}
]

def run_snapshot():
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"[{today}] Iniciando captura de ranking (Nubimetrics Clone)...")
    
    total_salvos = 0
    
    for cat in TARGET_CATEGORIES:
        print(f"  -> Buscando top 50 de: {cat['name']} ({cat['id']})...")
        try:
            # 1. Pega o dado real de HOJE pela nossa API Next.js (que agora tem o token bypass do WAF)
            url = f"https://painel.paulistanaemporio.com/api/ml-spy?category={cat['id']}"
            res = requests.get(url)
            res.raise_for_status()
            data = res.json()
            
            results = data.get('results', [])
            real_records = []
            
            for item in results:
                real_records.append({
                    "category_id": cat['id'],
                    "product_id": item['id'],
                    "title": item['title'],
                    "price": item['price'],
                    "rank": item['rank'],
                    "thumbnail": item.get('thumbnail', ''),
                    "permalink": item.get('permalink', ''),
                    "snapshot_date": today
                })
            
            if real_records:
                supabase.table('ml_competitor_history').insert(real_records).execute()
                total_salvos += len(real_records)
                print(f"     ✅ Salvos {len(real_records)} registros reais de HOJE.")
        except Exception as e:
            print(f"     ❌ Erro ao buscar {cat['id']}: {e}")
            
        print(f"     ✅ Salvos reais de {cat['id']}.")

    print(f"[{today}] Captura concluída! Total de registros armazenados: {total_salvos}")

if __name__ == "__main__":
    run_snapshot()
