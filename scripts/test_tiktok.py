import os
import time
import hmac
import hashlib
import requests
import json

def get_signature(app_secret, path, queries, body=""):
    keys = sorted(queries.keys())
    query_str = "".join([f"{k}{queries[k]}" for k in keys])
    base_string = app_secret + path + query_str + body + app_secret
    mac = hmac.new(app_secret.encode('utf-8'), base_string.encode('utf-8'), hashlib.sha256)
    return mac.hexdigest()

def debug_tiktok():
    with open("tiktok_tokens.json", "r") as f:
        tokens = json.load(f)
    app_key = "6kckrgpa2sesh"
    app_secret = "b3577f447652b88d4679a27a99ef44a70b99728f"
    
    path_shops = "/authorization/202309/shops"
    timestamp = str(int(time.time()))
    queries = {"app_key": app_key, "timestamp": timestamp}
    queries["sign"] = get_signature(app_secret, path_shops, queries, "")
    
    headers = {"x-tts-access-token": tokens["access_token"]}
    res_shops = requests.get(f"https://open-api.tiktokglobalshop.com{path_shops}", params=queries, headers=headers).json()
    shop_cipher = res_shops["data"]["shops"][0]["cipher"]
    
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
    print(json.dumps(res_prod, indent=2))

if __name__ == "__main__":
    debug_tiktok()
