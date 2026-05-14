import os
import csv
from google.cloud import storage

CREDENTIALS_FILE = 'cocreator-470801-85fe137c8f33.json'
BUCKET_NAME = 'cocreator_content'
LOCAL_DIR = 'images/EMBALAGEM NOVA'
DEST_PREFIX = 'produtos_reais'
CSV_PATH = 'Cocreator_Content - Lista_Produtos_Atualizado.csv'

# Autenticação
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_FILE

try:
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
except Exception as e:
    print(f"Erro ao conectar no GCP: {e}")
    exit(1)

uploads = 0

with open(CSV_PATH, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        slug_embalagem = row.get('slug_embalagem')
        slug_imagem_real = row.get('slug_imagem_real')
        
        if not slug_embalagem or not slug_imagem_real:
            continue
            
        local_path = os.path.join(LOCAL_DIR, slug_imagem_real)
        
        if os.path.exists(local_path):
            # Preservar extensão original (png, jpg, webp)
            ext = os.path.splitext(slug_imagem_real)[1].lower()
            if not ext:
                ext = '.png'
                
            dest_blob_name = f"{DEST_PREFIX}/{slug_embalagem}{ext}"
            blob = bucket.blob(dest_blob_name)
            
            try:
                print(f"Subindo {slug_imagem_real} -> gs://{BUCKET_NAME}/{dest_blob_name} ...")
                blob.upload_from_filename(local_path)
                uploads += 1
            except Exception as e:
                print(f"Falha ao fazer upload de {slug_imagem_real}: {e}")
        else:
            print(f"Arquivo não encontrado localmente: {local_path}")

print(f"Sucesso! {uploads} imagens reais enviadas para a pasta '{DEST_PREFIX}' no bucket.")
