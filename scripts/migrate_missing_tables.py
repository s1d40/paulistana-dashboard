import os
import json
import gspread
from supabase import create_client, Client
from datetime import datetime
import uuid
import time

# Configurações do Google Sheets
CREDENTIALS_FILE = 'cocreator-470801-85fe137c8f33.json'
DOC_NAME = 'Cocreator_Content'

# Configurações do Supabase
SUPABASE_URL = "https://wolygamyyjgpoqsfefye.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbHlnYW15eWpncG9xc2ZlZnllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM1NTQ0OSwiZXhwIjoyMDkzOTMxNDQ5fQ.lrjXQbm_y6DkSA_2CsFsoFbdWoKZGpHUAvGGSEd79bY"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def is_valid_uuid(val):
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

def get_sheet_data(gc, sheet_name):
    print(f"Buscando dados da aba '{sheet_name}'...")
    try:
        sh = gc.open(DOC_NAME)
        worksheet = sh.worksheet(sheet_name)
        all_values = worksheet.get_all_values()
        if not all_values:
            return []
        
        headers = all_values[0]
        valid_indices = [i for i, h in enumerate(headers) if h.strip()]
        clean_headers = [headers[i] for i in valid_indices]
        
        data = []
        for row in all_values[1:]:
            row_padded = row + [''] * (max(valid_indices) + 1 - len(row))
            item = {clean_headers[j]: row_padded[valid_indices[j]] for j in range(len(valid_indices))}
            data.append(item)
        return data
    except Exception as e:
        print(f"Erro ao buscar {sheet_name}: {e}")
        return []

def batch_upsert(table_name, data, chunk_size=500):
    if not data:
        return
    print(f"Inserindo/Atualizando {len(data)} registros em '{table_name}'...")
    for i in range(0, len(data), chunk_size):
        chunk = data[i:i + chunk_size]
        try:
            supabase.table(table_name).upsert(chunk).execute()
        except Exception as e:
            print(f"Erro ao inserir lote em {table_name}: {e}")

def migrate_missing():
    gc = gspread.service_account(filename=CREDENTIALS_FILE)

    # Pegar posts válidos para filtrar assets
    posts_raw = get_sheet_data(gc, 'Posts')
    valid_post_ids = {r.get("id_post") for r in posts_raw if is_valid_uuid(r.get("id_post"))}

    # 1. Produtos (Usando a aba correta)
    produtos_raw = get_sheet_data(gc, 'Lista_Produtos')
    produtos = [{
        "slug_imagem_real": r.get("slug_imagem_real"),
        "produto": r.get("Produto"),
        "slug_embalagem": r.get("slug_embalagem"),
        "restricao_narrativa": r.get("Restricao_Narrativa"),
        "restricao_visual": r.get("Restricao_Visual")
    } for r in produtos_raw if r.get("slug_imagem_real")]
    batch_upsert("produtos", produtos)

    time.sleep(5) # Pausa para evitar quota

    # 2. Áudios
    audios_raw = get_sheet_data(gc, 'Audios')
    audios = []
    for r in audios_raw:
        pid = r.get("id_post")
        aid = r.get("id_audio") or f"{pid}_{r.get('numero_cena')}"
        if pid in valid_post_ids and aid:
            audios.append({
                "id_audio": aid,
                "id_post": pid,
                "audio_url": r.get("audio_url"),
                "texto_narrado": r.get("texto_narrado"),
                "numero_cena": int(r.get("numero_cena")) if str(r.get("numero_cena")).isdigit() else None,
                "timestamps": r.get("timestamps")
            })
    batch_upsert("audios", audios)

    time.sleep(5)

    # 3. Vídeos
    videos_raw = get_sheet_data(gc, 'Videos_Finais')
    videos = []
    for i, r in enumerate(videos_raw):
        pid = r.get("id_post")
        vid = r.get("id_video_final") or f"v_{pid}_{i}"
        if pid in valid_post_ids and vid:
            videos.append({
                "id_video_final": vid,
                "id_post": pid,
                "video_final_url": r.get("video_final_url") or r.get("video_url")
            })
    batch_upsert("videos", videos)

if __name__ == '__main__':
    print("Migrando tabelas restantes...")
    migrate_missing()
    print("Finalizado!")
