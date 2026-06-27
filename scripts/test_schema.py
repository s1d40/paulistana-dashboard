import os
import requests
from dotenv import load_dotenv

load_dotenv('../dashboard/.env.local')

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

for table in ["imagens", "audios", "videos_cenas"]:
    url = f"{SUPABASE_URL}/rest/v1/{table}?limit=1"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data:
            print(f"Table {table} columns: {list(data[0].keys())}")
        else:
            print(f"Table {table} is empty. Cannot infer schema from REST easily.")
    else:
        print(f"Error reading {table}: {response.text}")
