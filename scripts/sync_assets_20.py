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

    # Subpastas locais para organizacao
    dir_real = os.path.join(local_dir, 'produtos_reais')
    dir_emb = os.path.join(local_dir, 'embalagem')
    
    for d in [dir_real, dir_emb]:
        if not os.path.exists(d):
            os.makedirs(d)
            print(f'Diretorio criado: {d}')

    mapping = []
    # Usando a nova planilha de 20 itens
    with open(mapping_file, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            mapping.append(row)

    print(f'Sincronizando {len(mapping)} produtos especificos...')

    for item in mapping:
        product_name = item.get('Produto')
        slug_real = item.get('slug_imagem_real')
        slug_emb_base = item.get('slug_embalagem', '')
        # Garante extensao .png para o slug da embalagem
        slug_emb = slug_emb_base + '.png' if slug_emb_base and not slug_emb_base.endswith('.png') else slug_emb_base
        
        print(f'\n--- Processando: {product_name} ---')

        # 1. Tentar baixar Imagem Real da pasta 'produtos_reais'
        if slug_real:
            blob_path_real = f'produtos_reais/{slug_real}'
            blob_real = bucket.blob(blob_path_real)
            if blob_real.exists():
                local_path_real = os.path.join(dir_real, slug_real)
                print(f'[REAL] OK: {blob_path_real} -> {local_path_real}')
                blob_real.download_to_filename(local_path_real)
            else:
                print(f"[REAL] ERRO: Nao encontrado em 'produtos_reais/{slug_real}'")

        # 2. Tentar baixar Embalagem da pasta 'embalagem'
        if slug_emb:
            blob_path_emb = f'embalagem/{slug_emb}'
            blob_emb = bucket.blob(blob_path_emb)
            if blob_emb.exists():
                local_path_emb = os.path.join(dir_emb, slug_emb)
                print(f'[EMB]  OK: {blob_path_emb} -> {local_path_emb}')
                blob_emb.download_to_filename(local_path_emb)
            else:
                print(f"[EMB]  ERRO: Nao encontrado em 'embalagem/{slug_emb}'")

if __name__ == '__main__':
    CREDENTIALS_FILE = 'cocreator-470801-85fe137c8f33.json'
    MAPPING_CSV = 'Cocreator_Content - Lista_Produtosatualizada.csv'
    LOCAL_SYNC_DIR = 'assets_sync_final_20'
    BUCKET = 'cocreator_content'
    
    sync_assets(CREDENTIALS_FILE, BUCKET, MAPPING_CSV, LOCAL_SYNC_DIR)
    print('\nSincronizacao finalizada!')
