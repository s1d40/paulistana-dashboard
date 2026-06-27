import re
import time
import requests
import gspread
import json
from datetime import datetime, timedelta
from google.oauth2.service_account import Credentials
from auth import get_access_token
from supabase_client import supabase

# ————————— Configurações —————————————————————————————
CRED_FILE   = r"C:\Users\André\Desktop\ApiMercadoLivre\ads-meracdo-livre-49fa61b55da6.json"
SHEET_NAME  = "ADS - PAULISTANA EMPORIO"
WORKSHEET   = "CONFIG"

METRICS_KEYS = [
    "clicks","prints","ctr","cost","cpc","acos","roas",
    "organic_units_quantity","organic_units_amount",
    "organic_items_quantity","direct_items_quantity",
    "indirect_items_quantity","advertising_items_quantity",
    "cvr","sov","direct_units_quantity","indirect_units_quantity",
    "units_quantity","direct_amount","indirect_amount","total_amount"
]

# 2. Busca campanhas com métricas resumidas
def fetch_campaigns():
    token = get_access_token()
    resp = requests.get(
        "https://api.mercadolibre.com/advertising/advertisers?product_id=PADS",
        headers={"Authorization": f"Bearer {token}", "Api-Version": "1"}
    )
    resp.raise_for_status()
    advertisers = resp.json().get("advertisers", [])
    if not advertisers:
        return None, [], None, None
    adv_id = advertisers[0].get("advertiser_id") or advertisers[0].get("id")

    today = datetime.utcnow().date()
    date_to   = today.isoformat()
    date_from = (today - timedelta(days=30)).isoformat()
    metrics = ",".join(METRICS_KEYS)

    url = (
      f"https://api.mercadolibre.com/advertising/advertisers/{adv_id}/"
      f"product_ads/campaigns?limit=100&offset=0"
      f"&date_from={date_from}&date_to={date_to}"
      f"&metrics={metrics}&metrics_summary=true"
    )
    print(f"[STEP] GET campaigns → {url}")
    resp2 = requests.get(url, headers={
      "Authorization": f"Bearer {token}", "Api-Version": "2"
    })
    resp2.raise_for_status()
    return adv_id, resp2.json().get("results", []), date_from, date_to

# 3. Busca itens de cada campanha (métricas do item)
def fetch_campaign_items(adv_id, campaign_id, date_from, date_to):
    token = get_access_token()
    metrics = ",".join(METRICS_KEYS)
    url = (
      f"https://api.mercadolibre.com/advertising/advertisers/{adv_id}/"
      f"product_ads/items?filters[campaign_id]={campaign_id}"
      f"&date_from={date_from}&date_to={date_to}"
      f"&metrics={metrics}&metrics_summary=true"
    )
    print(f"[STEP] GET items → {url}")
    resp = requests.get(url, headers={
      "Authorization": f"Bearer {token}", "Api-Version": "2"
    })
    resp.raise_for_status()
    return resp.json().get("results", [])

# 4. Persiste dados no Supabase
def upsert_data(adv_id, campaigns, date_from, date_to, rules):
    print("[STEP] Upserting into Supabase (ml_campaigns e ml_campaign_items)…")
    for camp in campaigns:
        cid = camp["id"]
        
        # Salva a Campanha no Supabase
        camp_data = {
            "campaign_id": cid,
            "name": camp.get("name"),
            "status": camp.get("status"),
            "budget": camp.get("budget"),
            "strategy": camp.get("strategy"),
            "acos_target": camp.get("acos_target"),
            "currency_id": camp.get("currency_id"),
            "channel": camp.get("channel"),
            "date_created": camp.get("date_created"),
            "last_updated": camp.get("last_updated"),
            "metrics_summary": camp.get("metrics_summary", {}),
            "last_sync": datetime.utcnow().isoformat()
        }
        
        try:
            supabase.table("ml_campaigns").upsert(camp_data).execute()
        except Exception as e:
            print(f"Erro ao salvar campanha {cid} no Supabase:", e)

        # Busca e Salva o Item (Anúncio) da Campanha
        items = fetch_campaign_items(adv_id, cid, date_from, date_to)
        m = re.search(r'(?:ID:\s*|#\s*|)(MLB[0-9]+)', camp.get("name",""))
        expected = m.group(1) if m else None
        chosen = None
        if expected:
            for itm in items:
                if (itm.get("item_id") or itm.get("id")) == expected:
                    chosen = itm; break
        if not chosen and items:
            chosen = items[0]

        if chosen:
            item_id = chosen.get("item_id") or chosen.get("id")
            item_met = chosen.get("metrics", {})
            
            item_data = {
                "campaign_id": cid,
                "item_id": item_id,
                "price": chosen.get("price"),
                "available_quantity": 0, # Removido join com db local antigo, atualizar via outro worker
                "item_metrics": item_met,
                "last_sync": datetime.utcnow().isoformat()
            }
            try:
                supabase.table("ml_campaign_items").upsert(item_data).execute()
            except Exception as e:
                print(f"Erro ao salvar item da campanha {cid} no Supabase:", e)
                
        time.sleep(0.3)

def update_sheet(rules):
    # Aviso: Planilha mantida como backup, mas dados fluem para o Supabase e Dashboard
    print("[INFO] Google Sheets update foi desativado em favor do Dashboard no Supabase.")

def main():
    print("Iniciando Sincronização Ads Mercado Livre -> Supabase...")
    try:
        creds = Credentials.from_service_account_file(
            CRED_FILE,
            scopes=["https://www.googleapis.com/auth/spreadsheets",
                    "https://www.googleapis.com/auth/drive"]
        )
        recs = gspread.authorize(creds).open(SHEET_NAME).worksheet(WORKSHEET).get_all_records()
        rules = {
            r["ID"]: {
            "acos_objective":  r.get("AcosObjetivo"),
            "campaign_budget": r.get("OrcamentoCampanha"),
            "min_qty":         r.get("MinQty")
            } for r in recs if r.get("ID")
        }
    except Exception as e:
        print("[AVISO] Planilha de Regras nao acessada, usando rules vazias. Erro:", e)
        rules = {}

    adv_id, campaigns, date_from, date_to = fetch_campaigns()
    if adv_id:
        upsert_data(adv_id, campaigns, date_from, date_to, rules)
        update_sheet(rules)

    print("[STEP] Tudo concluído.")

if __name__ == "__main__":
    main()
