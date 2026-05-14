import os
from google.cloud import storage

def upload_images_to_gcs(credentials_path, bucket_name, source_folder, destination_folder):
    # Set credentials
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
    
    try:
        # Initialize the client
        client = storage.Client()
        bucket = client.bucket(bucket_name)
    except Exception as e:
        print(f"Erro ao conectar no GCP: {e}")
        return

    # Check if directory exists
    if not os.path.exists(source_folder):
        print(f"Diretório {source_folder} não encontrado.")
        return

    # List files
    files = [f for f in os.listdir(source_folder) if os.path.isfile(os.path.join(source_folder, f))]
    print(f"Encontradas {len(files)} imagens para upload...")

    for file_name in files:
        source_path = os.path.join(source_folder, file_name)
        # Use forward slashes for gcs destination path
        destination_blob_name = f"{destination_folder.strip('/')}/{file_name}"
        
        blob = bucket.blob(destination_blob_name)
        
        try:
            print(f"Fazendo upload de {file_name} -> gs://{bucket_name}/{destination_blob_name}...")
            blob.upload_from_filename(source_path)
            print(f"Upload concluído: {file_name}")
        except Exception as e:
            print(f"Erro no upload de {file_name}: {e}")

if __name__ == '__main__':
    CREDENTIALS_FILE = 'cocreator-470801-85fe137c8f33.json'
    BUCKET = 'cocreator_content'
    LOCAL_IMAGES_DIR = 'images'
    DESTINATION_PREFIX = 'embalagens'
    
    upload_images_to_gcs(CREDENTIALS_FILE, BUCKET, LOCAL_IMAGES_DIR, DESTINATION_PREFIX)
    print("Processo finalizado!")
