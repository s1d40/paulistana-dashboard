import os
import requests
from datetime import datetime
from supabase_client import supabase

# Tenta carregar o token de acesso da nossa biblioteca (para bypassar qualquer barreira do WAF)
try:
    from auth import get_access_token
    ml_token = get_access_token()
except Exception as e:
    ml_token = ""
    print(f"Aviso: Não foi possível carregar o token via auth.py: {e}")

headers = {}
if ml_token:
    headers['Authorization'] = f"Bearer {ml_token}"

def run_sniper():
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"[{today}] Iniciando Modo Sniper (Rastreador de Anúncios Específicos)...")

    # 1. Puxa todos os IDs de anúncios que estão na mira (cadastrados no Supabase)
    try:
        res = supabase.table('ml_tracked_ads').select('ml_item_id').execute()
        tracked_ads = [item['ml_item_id'] for item in res.data]
    except Exception as e:
        print(f"❌ Erro ao buscar lista de alvos no banco de dados: {e}")
        return

    if not tracked_ads:
        print("  -> Nenhum alvo cadastrado no Modo Sniper. Saindo...")
        return

    print(f"  -> Alvos na mira: {len(tracked_ads)} anúncios.")

    # 2. Faz as chamadas para a API de itens do Mercado Livre
    # A API aceita até 20 IDs por vez (parâmetro ids=MLB1,MLB2,MLB3)
    chunk_size = 20
    records = []
    
    for i in range(0, len(tracked_ads), chunk_size):
        chunk = tracked_ads[i:i + chunk_size]
        ids_str = ",".join(chunk)
        
        try:
            url = f"https://api.mercadolibre.com/items?ids={ids_str}"
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            items_data = response.json()
            
            for item in items_data:
                if item.get('code') == 200:
                    body = item.get('body', {})
                    records.append({
                        "ml_item_id": body.get('id'),
                        "price": body.get('price', 0),
                        "status": body.get('status', 'unknown'),
                        "snapshot_date": today
                    })
                else:
                    print(f"     ⚠️  Aviso: Falha ao puxar dados do item (Code: {item.get('code')})")
                    
        except Exception as e:
            print(f"     ❌ Erro na API do ML para o chunk {chunk}: {e}")

    # 3. Salva o histórico de preços no Supabase
    if records:
        try:
            supabase.table('ml_tracked_ads_history').insert(records).execute()
            print(f"     ✅ Salvos {len(records)} históricos de preços.")
        except Exception as e:
            print(f"     ❌ Erro ao inserir histórico no banco: {e}")
    else:
        print("     ℹ️ Nenhum dado válido retornado para os alvos hoje.")

if __name__ == "__main__":
    run_sniper()
