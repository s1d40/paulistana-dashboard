import os
import pandas as pd
from supabase import create_client, Client
import json

# Carregar variáveis de ambiente do .env.local
env_path = os.path.join(os.getcwd(), 'dashboard', '.env.local')
if os.path.exists(env_path):
    from dotenv import load_dotenv
    load_dotenv(env_path)

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

# URL da aba de Carrossel do Google Sheets (GID 927613935)
SHEET_URL = "https://docs.google.com/spreadsheets/d/12JcGa9CuHtavgf0goY8yraYQ6kYuy8NCXsKPKmBWDdY/export?format=csv&gid=927613935"

def sync_carrossels():
    print(f"--- Iniciando Sincronização de Carrosséis ---")
    
    try:
        # 1. Baixar os dados do Sheets
        df = pd.read_csv(SHEET_URL)
        print(f"Baixados {len(df)} registros do Google Sheets.")
        
        # 2. Preparar dados para o Supabase
        records = []
        for _, row in df.iterrows():
            # A coluna de imagem pode estar em 'image_url' ou 'url_imagem_fundo'
            final_image_url = row['image_url'] if pd.notna(row['image_url']) else row['url_imagem_fundo']
            
            if pd.isna(row['id_post']) or pd.isna(final_image_url):
                continue

            record = {
                "id_post": str(row['id_post']),
                "image_url": str(final_image_url),
                "numero_cena": int(row['numero_cena']) if pd.notna(row['numero_cena']) else None,
                "is_carrossel": True,
                "data_geracao": str(row['data_geracao']) if pd.notna(row['data_geracao']) else None,
                # Guardamos o texto na imagem como um payload básico se não houver um completo
                "payload_api": json.dumps({"content": {"headline": str(row['texto_na_imagem'])}}) if pd.notna(row['texto_na_imagem']) else None
            }
            records.append(record)

        print(f"Processados {len(records)} registros válidos.")

        # 3. Insert no Supabase (em lotes de 100 para evitar timeout)
        batch_size = 100
        for i in range(0, len(records), batch_size):
            batch = records[i:i+batch_size]
            response = supabase.table("imagens").insert(batch).execute()
            print(f"Lote {i//batch_size + 1} enviado com sucesso.")

        print("--- Sincronização Concluída! ---")

    except Exception as e:
        print(f"ERRO durante a sincronização: {str(e)}")

if __name__ == "__main__":
    sync_carrossels()
