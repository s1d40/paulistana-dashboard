import os
import requests
import json
import time
import hmac
import hashlib
from dotenv import load_dotenv
from supabase import create_client, Client
import subprocess

# Carrega as chaves
load_dotenv('../dashboard/.env.local')
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Faltam chaves do Supabase em .env.local")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configurações Nuvemshop
NUVEM_URL = os.getenv("NUVEMSHOP_API_BASE_URL", "https://api.nuvemshop.com.br/v1/6832592")
NUVEM_TOKEN = os.getenv("NUVEMSHOP_API_TOKEN", "30ff8ace5bbc8a6ef85e9cf92e0be2df52dc987e")

def sync_nuvemshop():
    print("Sincronizando Nuvemshop...")
    headers = {"Authentication": f"bearer {NUVEM_TOKEN}"}
    try:
        response = requests.get(f"{NUVEM_URL}/products", headers=headers)
        if response.status_code == 200:
            products = response.json()
            for p in products:
                # extrair imagens
                image_url = ""
                if p.get("images") and len(p["images"]) > 0:
                    image_url = p["images"][0].get("src", "")
                
                # Pegar o preço da primeira variante
                price = 0
                stock = 0
                if p.get("variants") and len(p["variants"]) > 0:
                    price = float(p["variants"][0].get("price") or 0)
                    stock = p["variants"][0].get("stock") or 0

                data = {
                    "id": str(p["id"]),
                    "title": p.get("name", {}).get("pt", ""),
                    "price": price,
                    "available_quantity": stock,
                    "thumbnail": image_url,
                    "permalink": p.get("canonical_url", ""),
                    "platform": "nuvemshop"
                }
                
                # upsert
                supabase.table("produtos_plataformas").upsert(data).execute()
            print(f"{len(products)} produtos da Nuvemshop sincronizados com sucesso.")
        else:
            print("Erro Nuvemshop:", response.text)
    except Exception as e:
        print("Exception Nuvemshop:", e)

def get_ml_token():
    try:
        token = subprocess.check_output(
            '. venv/bin/activate && python print_token.py',
            cwd='mercado_livre',
            shell=True,
            text=True
        ).strip()
        return token
    except Exception as e:
        print("Erro ao obter token do ML:", e)
        return None

def sync_mercado_livre():
    print("Sincronizando Mercado Livre...")
    token = get_ml_token()
    if not token:
        return
    
    ANDRE_SELLER_ID = 428354884
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Pega a lista de ids
        search_res = requests.get(f"https://api.mercadolibre.com/users/{ANDRE_SELLER_ID}/items/search?status=active&limit=100", headers=headers)
        if search_res.status_code == 200:
            item_ids = search_res.json().get("results", [])
            
            # Pega detalhes em blocos de 20 (limite da API do ML para ids é 20)
            for i in range(0, len(item_ids), 20):
                chunk = item_ids[i:i+20]
                items_res = requests.get(f"https://api.mercadolibre.com/items?ids={','.join(chunk)}", headers=headers)
                if items_res.status_code == 200:
                    for item_data in items_res.json():
                        if item_data.get("code") == 200:
                            body = item_data["body"]
                            data = {
                                "id": body["id"],
                                "title": body["title"],
                                "price": body.get("price", 0),
                                "available_quantity": body.get("available_quantity", 0),
                                "thumbnail": body.get("thumbnail", "").replace("-I.jpg", "-O.jpg"),
                                "permalink": body.get("permalink", ""),
                                "platform": "mercadolivre"
                            }
                            supabase.table("produtos_plataformas").upsert(data).execute()
            print(f"{len(item_ids)} produtos do Mercado Livre sincronizados com sucesso.")
        else:
            print("Erro ML Search:", search_res.text)
    except Exception as e:
        print("Exception ML:", e)

def get_signature(app_secret, path, queries, body=""):
    keys = sorted(queries.keys())
    query_str = "".join([f"{k}{queries[k]}" for k in keys])
    base_string = app_secret + path + query_str + body + app_secret
    mac = hmac.new(app_secret.encode('utf-8'), base_string.encode('utf-8'), hashlib.sha256)
    return mac.hexdigest()

def sync_tiktok():
    print("Sincronizando TikTok Shop...")
    try:
        if not os.path.exists("tiktok_tokens.json"):
            print("tiktok_tokens.json não encontrado. Pulei TikTok.")
            return

        with open("tiktok_tokens.json", "r") as f:
            tokens = json.load(f)
            
        access_token = tokens.get("access_token")
        if not access_token:
            return
            
        app_key = os.getenv("TIKTOK_SHOP_APP_KEY")
        app_secret = os.getenv("TIKTOK_SHOP_APP_SECRET")
        
        # 1. Pega o shop_cipher
        path_shops = "/authorization/202309/shops"
        timestamp = str(int(time.time()))
        queries = {"app_key": app_key, "timestamp": timestamp}
        queries["sign"] = get_signature(app_secret, path_shops, queries, "")
        
        headers = {"x-tts-access-token": access_token}
        res_shops = requests.get(f"https://open-api.tiktokglobalshop.com{path_shops}", params=queries, headers=headers).json()
        
        if res_shops.get("code") != 0 or not res_shops.get("data", {}).get("shops"):
            print("Erro ao pegar shops do TikTok", res_shops)
            return
            
        shop_cipher = res_shops["data"]["shops"][0]["cipher"]
        
        # 2. Pega os produtos
        path_prod = "/product/202309/products/search"
        timestamp = str(int(time.time()))
        queries_prod = {
            "app_key": app_key,
            "timestamp": timestamp,
            "shop_cipher": shop_cipher,
            "page_size": "100"
        }
        body_str = "{}"
        
        queries_prod["sign"] = get_signature(app_secret, path_prod, queries_prod, body_str)
        headers["Content-Type"] = "application/json"
        
        res_prod = requests.post(f"https://open-api.tiktokglobalshop.com{path_prod}", params=queries_prod, headers=headers, data=body_str).json()
        
        if res_prod.get("code") == 0:
            products = res_prod.get("data", {}).get("products", [])
            for p in products:
                skus = p.get("skus", [{}])
                sku = skus[0] if skus else {}
                price = float(sku.get("price", {}).get("tax_exclusive_price", 0))
                
                inv_list = sku.get("inventory", [])
                quantity = inv_list[0].get("quantity", 0) if isinstance(inv_list, list) and inv_list else 0
                
                main_images = p.get("main_images", [])
                thumbnail = main_images[0].get("urls", [""])[0] if isinstance(main_images, list) and main_images else ""

                data = {
                    "id": p["id"],
                    "title": p["title"],
                    "price": price,
                    "available_quantity": quantity,
                    "thumbnail": thumbnail,
                    "permalink": "", # TikTok API rarely returns the permalink directly in search
                    "platform": "tiktok"
                }
                supabase.table("produtos_plataformas").upsert(data).execute()
            print(f"{len(products)} produtos do TikTok Shop sincronizados com sucesso.")
        else:
            print("Erro ao pegar produtos TikTok:", res_prod)
            
    except Exception as e:
        print("Exception TikTok:", e)

if __name__ == "__main__":
    print("Iniciando sincronização de catálogos...")
    sync_nuvemshop()
    sync_mercado_livre()
    sync_tiktok()
    print("Finalizado!")
