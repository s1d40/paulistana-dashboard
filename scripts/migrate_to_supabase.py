import os
import json
import gspread
from supabase import create_client, Client
from datetime import datetime
import uuid

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

def migrate_all():
    gc = gspread.service_account(filename=CREDENTIALS_FILE)

    # 1. Clientes
    clientes_raw = get_sheet_data(gc, 'Clientes')
    clientes = [{
        "id_cliente": r.get("id_cliente"),
        "nome_cliente": r.get("nome_cliente"),
        "chat_id": str(r.get("chat_id")) if r.get("chat_id") else None
    } for r in clientes_raw if is_valid_uuid(r.get("id_cliente"))]
    batch_upsert("clientes", clientes)

    # 2. Contas
    contas_raw = get_sheet_data(gc, 'Contas')
    contas = [{
        "id_conta": r.get("id_conta"),
        "id_cliente": r.get("id_cliente"),
        "nicho": r.get("nicho"),
        "nome_conta": r.get("nome_conta"),
        "conta_id_instagram": r.get("conta_id_instagram"),
        "ig_access_token": r.get("ig_access_token"),
        "yt_credencial": r.get("yt_credencial"),
        "conta_id_facebook": r.get("conta_id_facebook"),
        "facebook_access_token": r.get("facebook_access_token"),
        "conta_id_threads": r.get("conta_id_threads"),
        "threads_access_token": r.get("threads_access_token")
    } for r in contas_raw if is_valid_uuid(r.get("id_conta"))]
    batch_upsert("contas", contas)

    # 3. Produtos
    produtos_raw = get_sheet_data(gc, 'DB_Produtos_Paulistana')
    produtos = [{
        "slug_imagem_real": r.get("slug_imagem_real"),
        "produto": r.get("Produto"),
        "slug_embalagem": r.get("slug_embalagem"),
        "restricao_narrativa": r.get("Restricao_Narrativa"),
        "restricao_visual": r.get("Restricao_Visual")
    } for r in produtos_raw if r.get("slug_imagem_real")]
    batch_upsert("produtos", produtos)

    # 4. Posts
    posts_raw = get_sheet_data(gc, 'Posts')
    valid_post_ids = set()
    posts = []
    for r in posts_raw:
        pid = r.get("id_post")
        if not is_valid_uuid(pid): continue
        
        valid_post_ids.add(pid)
        posts.append({
            "id_post": pid,
            "id_conta": r.get("id_conta") if is_valid_uuid(r.get("id_conta")) else None,
            "tema_post": r.get("tema_post"),
            "titulo_post": r.get("titulo_post"),
            "roteiro_gerado": r.get("roteiro_gerado"),
            "prompt_imagem": r.get("prompt_imagem"),
            "captions": r.get("captions"),
            "status": r.get("status"),
            "instagram_url": r.get("instagram_url"),
            "agendado": str(r.get("agendado_para") or r.get("agendado") or ''),
            "feedback": r.get("feedback"),
            "tipo_post": r.get("tipo_post"),
            "data_criacao": r.get("data_criacao") if r.get("data_criacao") else datetime.now().isoformat()
        })
    batch_upsert("posts", posts)

    # 5. Imagens
    imagens_raw = get_sheet_data(gc, 'Imagens') + get_sheet_data(gc, 'Imagens_Carrossel')
    imagens = []
    for r in imagens_raw:
        pid = r.get("id_post")
        url = r.get("image_url") or r.get("url_imagem_fundo")
        if pid in valid_post_ids and url:
            imagens.append({
                "id_post": pid,
                "image_url": url,
                "url_imagem_fundo": r.get("url_imagem_fundo"),
                "prompt_utilizado": r.get("prompt_utilizado"),
                "texto_na_imagem": r.get("texto_na_imagem"),
                "numero_cena": int(r.get("numero_cena")) if str(r.get("numero_cena")).isdigit() else None,
                "sincronizado_pinecone": str(r.get("Sincronizado_Pinecone"))
            })
    batch_upsert("imagens", imagens)

    # 6. Áudios
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

    # 7. Vídeos
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
    migrate_all()
