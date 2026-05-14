import os
import csv
from google.cloud import storage

def sync_assets(credentials_path, bucket_name, mapping_file, local_dir):
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
    
    try:
        client = storage.Client()
        bucket = client.bucket(bucket_name)
    except Exception as e:
        print(f'Erro ao conectar no GCP: {e}')
        return

    # Subpastas para evitar sobrescrita
    dir_real = os.path.join(local_dir, 'produtos_reais')
    dir_emb = os.path.join(local_dir, 'embalagens')
    
    for d in [dir_real, dir_emb]:
        if not os.path.exists(d):
            os.makedirs(d)
            print(f'Diretorio criado: {d}')

    mapping = []
    with open(mapping_file, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            mapping.append(row)

    print(f'Sincronizando {len(mapping)} produtos (Real e Embalagem)...')

    for item in mapping:
        product_name = item.get('Produto')
        slug_real = item.get('slug_imagem_real')
        slug_emb_base = item.get('slug_embalagem', '')
        slug_emb = slug_emb_base + '.png' if slug_emb_base and not slug_emb_base.endswith('.png') else slug_emb_base
        
        # 1. Tentar baixar Imagem Real
        if slug_real:
            found_real = False
            # Procura primeiro em produtos_reais, depois em outros como fallback
            for folder in ['produtos_reais', 'embalagens', 'embalagem']:
                blob_path = f'{folder}/{slug_real}'
                blob = bucket.blob(blob_path)
                if blob.exists():
                    local_path = os.path.join(dir_real, slug_real)
                    print(f'[REAL] Baixando: {blob_path} -> {local_path}')
                    blob.download_to_filename(local_path)
                    found_real = True
                    break
            if not found_real:
                print(f"AVISO: Imagem REAL de '{product_name}' ({slug_real}) nao encontrada.")

        # 2. Tentar baixar Embalagem
        if slug_emb:
            found_emb = False
            # Procura primeiro em embalagens/embalagem, depois em produtos_reais como fallback
            for folder in ['embalagens', 'embalagem', 'produtos_reais']:
                blob_path = f'{folder}/{slug_emb}'
                blob = bucket.blob(blob_path)
                if blob.exists():
                    local_path = os.path.join(dir_emb, slug_emb)
                    print(f'[EMB]  Baixando: {blob_path} -> {local_path}')
                    blob.download_to_filename(local_path)
                    found_emb = True
                    break
            if not found_emb:
                print(f"AVISO: Embalagem de '{product_name}' ({slug_emb}) nao encontrada.")

if __name__ == '__main__':
    # Use relative paths or the specific UNC path
    CREDENTIALS_FILE = 'cocreator-470801-85fe137c8f33.json'
    MAPPING_CSV = 'Cocreator_Content - Lista_Produtos_Atualizado_New.csv'
    LOCAL_SYNC_DIR = 'assets_sync_final'
    BUCKET = 'cocreator_content'
    
    sync_assets(CREDENTIALS_FILE, BUCKET, MAPPING_CSV, LOCAL_SYNC_DIR)
    print('\nProcesso finalizado!')
