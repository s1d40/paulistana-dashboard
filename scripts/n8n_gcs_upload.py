import os
import sys
from google.cloud import storage

def upload_file(source_file, destination_blob_name):
    bucket_name = 'cocreator_content'
    # Tenta localizar a credencial em locais comuns
    possible_creds = [
        '/home/sid/cocreator-n8n/cocreator-470801-85fe137c8f33.json',
        '/root/cocreator-470801-85fe137c8f33.json',
        'cocreator-470801-85fe137c8f33.json'
    ]
    
    creds_path = None
    for p in possible_creds:
        if os.path.exists(p):
            creds_path = p
            break
            
    if creds_path:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path
    
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_filename(source_file)
    print(f"File {source_file} uploaded to {destination_blob_name}.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python n8n_gcs_upload.py <source_file> <destination_blob>")
        sys.exit(1)
    
    upload_file(sys.argv[1], sys.argv[2])
