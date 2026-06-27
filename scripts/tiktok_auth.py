import requests
import json
import os
from dotenv import load_dotenv

load_dotenv('../dashboard/.env.local')

APP_KEY = os.getenv("TIKTOK_SHOP_APP_KEY")
APP_SECRET = os.getenv("TIKTOK_SHOP_APP_SECRET")
AUTH_CODE = "ROW_8HXdfgAAAAApKfuS6_sCAPkBdrLZGHQRJmid6phNvCu-x1WcOAM6LFitsiEVWb6nF93lJPhA6GnZZIcD8epc97pi2DE-MZgK"

url = "https://auth.tiktok-shops.com/api/v2/token/get"
params = {
    "app_key": APP_KEY,
    "app_secret": APP_SECRET,
    "auth_code": AUTH_CODE,
    "grant_type": "authorized_code"
}

print(f"Obtendo token para o APP_KEY: {APP_KEY}")

response = requests.get(url, params=params)

if response.status_code == 200:
    data = response.json()
    print("\nSUCESSO!")
    print(json.dumps(data, indent=2))
    
    # Se quiser, podemos salvar o token no arquivo tokens.json
    if data.get("code") == 0: # 0 means success in TikTok API
        token_data = data.get("data", {})
        with open("tiktok_tokens.json", "w") as f:
            json.dump(token_data, f, indent=2)
        print("\nToken salvo em scripts/tiktok_tokens.json")
else:
    print(f"\nERRO (Status {response.status_code})")
    print(response.text)
