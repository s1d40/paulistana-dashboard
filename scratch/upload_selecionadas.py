import os
from google.cloud import storage

CREDENTIALS_FILE = 'cocreator-470801-85fe137c8f33.json'
BUCKET_NAME = 'cocreator_content'
LOCAL_DIR = 'images/SELECIONADAS_FR'
DEST_PREFIX = 'produtos_reais'

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_FILE

try:
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
except Exception as e:
    print(f"Erro ao conectar no GCP: {e}")
    exit(1)

uploads = 0
files = os.listdir(LOCAL_DIR)

for filename in files:
    if filename.lower().endswith(('.png', '.webp', '.jpg', '.jpeg')):
        local_path = os.path.join(LOCAL_DIR, filename)
        dest_blob_name = f"{DEST_PREFIX}/{filename}"
        
        blob = bucket.blob(dest_blob_name)
        try:
            print(f"Subindo {filename} -> gs://{BUCKET_NAME}/{dest_blob_name} ...")
            blob.upload_from_filename(local_path)
            uploads += 1
        except Exception as e:
            print(f"Falha no upload de {filename}: {e}")

print(f"Sincronização 100% final. {uploads} imagens carregadas para sobrepor o Cloud Storage!")
