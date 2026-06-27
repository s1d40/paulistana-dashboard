import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('dashboard/.env.local')
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

res = supabase.postgrest.from_("contas").select("*").execute()
print(res.data)
