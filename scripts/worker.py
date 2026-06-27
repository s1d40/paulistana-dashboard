import os
import time
import json
import subprocess
import base64
import requests
import uuid
from dotenv import load_dotenv
from supabase import create_client, Client
import replicate
from google.cloud import storage
from google.oauth2 import service_account

# Carrega variáveis de ambiente do .env.local do Dashboard
load_dotenv('/var/www/painel.paulistanaemporio.com/.env') if __import__('os').path.exists('/var/www/painel.paulistanaemporio.com/.env') else load_dotenv('../dashboard/.env.local')

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
REPLICATE_API_TOKEN = os.environ.get("REPLICATE_API_TOKEN", "")
os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_audio(text: str, voice_id="EXAVITQu4vr4xnSDxMaL"):
    print(f"  [ElevenLabs] Gerando áudio: {text[:30]}...")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps"
    headers = {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }
    response = requests.post(url, json=data, headers=headers, timeout=60)
    if response.status_code != 200:
        raise Exception(f"Erro ElevenLabs: {response.text}")
    
    res_json = response.json()
    audio_bytes = base64.b64decode(res_json["audio_base64"])
    ts = int(time.time() * 1000)
    audio_path = f"/tmp/audio_{ts}.mp3"
    with open(audio_path, "wb") as f:
        f.write(audio_bytes)
        
    alignment = res_json.get("alignment", {})
    words = []
    if alignment and "characters" in alignment:
        chars = alignment["characters"]
        start_times = alignment["character_start_times_seconds"]
        end_times = alignment["character_end_times_seconds"]
        current_word = ""
        current_start = None
        for i, c in enumerate(chars):
            if current_start is None:
                current_start = start_times[i]
            if c == ' ' or i == len(chars) - 1:
                if c != ' ': current_word += c
                words.append({"text": current_word.strip(), "start": current_start, "end": end_times[i]})
                current_word = ""
                current_start = None
            else:
                current_word += c
                
    json_path = f"/tmp/timestamps_{ts}.json"
    with open(json_path, "w") as f:
        json.dump(words, f)
        
    return audio_path, json_path

def generate_image(prompt: str):
    print(f"  [Replicate] Gerando imagem: {prompt[:30]}...")
    os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN
    output = replicate.run(
        "black-forest-labs/flux-schnell",
        input={"prompt": prompt, "aspect_ratio": "16:9"}
    )
    img_url = output[0]
    img_path = f"/tmp/image_{int(time.time() * 1000)}.webp"
    with open(img_path, "wb") as f:
        f.write(requests.get(img_url).content)
    return img_path

def upload_to_gcs(file_path: str, post_id: str, file_name: str):
    print(f"  [GCS] Fazendo upload de {file_name}...")
    gcs_json_str = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not gcs_json_str:
        print("  [GCS] Credenciais ausentes, ignorando upload.")
        return f"https://storage.googleapis.com/cocreator_content/posts/{post_id}/{file_name}"
        
    gcs_info = json.loads(gcs_json_str)
    credentials = service_account.Credentials.from_service_account_info(gcs_info)
    client = storage.Client(credentials=credentials, project=gcs_info['project_id'])
    
    bucket_name = "cocreator_content"
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(f"posts/{post_id}/{file_name}")
    blob.upload_from_filename(file_path)
    return blob.public_url

def assemble_scene(image_path, audio_path, json_path, output_path, animation_type="zoom_in"):
    cmd = ["python3", "video_maker.py", image_path, audio_path, output_path, animation_type, json_path]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        raise Exception(f"Erro no FFmpeg da cena: stdout: {res.stdout}, stderr: {res.stderr}")
    return output_path

def concatenate_videos(video_paths, output_path):
    print("  [FFMPEG] Juntando todas as cenas...")
    list_file = f"/tmp/concat_list_{int(time.time())}.txt"
    with open(list_file, "w") as f:
        for vp in video_paths:
            f.write(f"file '{vp}'\n")
            
    cmd = ['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', list_file, '-c', 'copy', output_path]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        raise Exception(f"Erro ao concatenar vídeos: {res.stderr}")
    return output_path

import concurrent.futures

def process_scene(cena, post_id):
    num = cena['numero']
    id_cena = cena.get('id_cena', f"cena_{post_id}_{num}")
    print(f"-> Processando cena {num}...")
    
    # Check if image exists
    img_res = supabase.table('imagens').select('image_url').eq('id_post', post_id).eq('numero_cena', num).execute()
    img_url = img_res.data[0]['image_url'] if img_res.data and img_res.data[0].get('image_url') else None
    
    # Check if audio exists
    aud_res = supabase.table('audios').select('audio_url, timestamps').eq('id_post', post_id).eq('numero_cena', num).execute()
    aud_url = aud_res.data[0]['audio_url'] if aud_res.data and aud_res.data[0].get('audio_url') else None
    json_url = aud_res.data[0]['timestamps'] if aud_res.data and aud_res.data[0].get('timestamps') else None
    
    image_path = f"/tmp/img_{post_id}_{num}.webp"
    audio_path = f"/tmp/aud_{post_id}_{num}.mp3"
    json_path = f"/tmp/json_{post_id}_{num}.json"
    
    # Download or generate Image
    if img_url:
        print(f"  [Cache] Imagem da cena {num} já existe, baixando...")
        import urllib.request
        urllib.request.urlretrieve(img_url, image_path)
    else:
        # 2. Gerar Imagem
        image_path = generate_image(cena['prompt_visual'])
        img_url = upload_to_gcs(image_path, post_id, f"imagem_{num}.webp")
        supabase.table('imagens').upsert({
            'id_imagem': str(uuid.uuid4()),
            'id_post': post_id,
            'id_cena': id_cena,
            'numero_cena': num,
            'image_url': img_url,
            'prompt_utilizado': cena['prompt_visual'],
            'data_geracao': time.strftime('%Y-%m-%dT%H:%M:%S+00:00')
        }).execute()
        
    # Download or generate Audio
    if aud_url and json_url:
        print(f"  [Cache] Áudio da cena {num} já existe, baixando...")
        import urllib.request
        urllib.request.urlretrieve(aud_url, audio_path)
        urllib.request.urlretrieve(json_url, json_path)
    else:
        # 1. Gerar Áudio
        audio_path, json_path = generate_audio(cena['texto_narrado'])
        aud_url = upload_to_gcs(audio_path, post_id, f"audio_{num}.mp3")
        json_url = upload_to_gcs(json_path, post_id, f"legenda_{num}.json")
        supabase.table('audios').upsert({
            'id_audio': str(uuid.uuid4()),
            'id_post': post_id,
            'id_cena': id_cena,
            'numero_cena': num,
            'audio_url': aud_url,
            'texto_narrado': cena['texto_narrado'],
            'timestamps': json_url,
            'data_geracao': time.strftime('%Y-%m-%dT%H:%M:%S+00:00')
        }).execute()

    # 5. Renderizar Cena com FFmpeg
    scene_output = f"/tmp/scene_{post_id}_{num}.mp4"
    animacao = cena.get('animacao', 'zoom_in')
    assemble_scene(image_path, audio_path, json_path, scene_output, animacao)
    
    # 6. Fazer upload do Vídeo da Cena pro GCS e salvar na tabela
    cena_vid_url = upload_to_gcs(scene_output, post_id, f"video_cena_{num}.mp4")
    
    supabase.table('videos_cenas').upsert({
        'id': str(uuid.uuid4()),
        'id_post': post_id,
        'id_cena': id_cena,
        'numero_cena': num,
        'video_url': cena_vid_url,
        'status': 'Concluído',
        'data_geracao': time.strftime('%Y-%m-%dT%H:%M:%S+00:00')
    }).execute()
    
    return num, scene_output

def process_post(post):
    post_id = post['id_post']
    try:
        print(f"\n--- Iniciando Produção do Post: {post.get('tema_post')} ({post_id}) ---")
        
        # O banco pode armazenar JSON como string ou dict
        roteiro = post.get('roteiro_gerado')
        if isinstance(roteiro, str):
            roteiro = json.loads(roteiro)
            
        cenas = roteiro.get('cenas', [])
        if not cenas:
            raise Exception("Nenhuma cena encontrada no roteiro.")
            
        scene_outputs = {}
        # Usando multi-threading para processar cenas em paralelo (max_workers=5 para não sobrecarregar API e FFmpeg)
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(process_scene, cena, post_id): cena for cena in cenas}
            for future in concurrent.futures.as_completed(futures):
                cena = futures[future]
                try:
                    num, scene_output = future.result()
                    scene_outputs[num] = scene_output
                except Exception as exc:
                    print(f"-> Cena {cena['numero']} gerou uma exceção: {exc}")
                    raise exc
                    
        # Ordenar os vídeos pela ordem correta das cenas
        scene_videos = [scene_outputs[num] for num in sorted(scene_outputs.keys())]
        
        # Concatena cenas
        final_video_path = f"/tmp/final_{post_id}.mp4"
        concatenate_videos(scene_videos, final_video_path)
        
        # Upload GCS do Video Final
        final_video_url = upload_to_gcs(final_video_path, post_id, "video_final.mp4")
        
        # Atualiza Supabase
        supabase.table('videos').upsert({
            'id_video_final': str(uuid.uuid4()),
            'id_post': post_id,
            'video_final_url': final_video_url,
            'data_compilacao': time.strftime('%Y-%m-%dT%H:%M:%S+00:00')
        }).execute()
        
        supabase.table('posts').update({
            'status': 'Concluído',
            'video_status': 'Concluído',
            'audio_status': 'Concluído',
            'images_status': 'Concluído'
        }).eq('id_post', post_id).execute()
        
        print("-> Post produzido e publicado com sucesso!")
        return True
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"-> Erro no post {post_id}: {e}")
        supabase.table('posts').update({'status': 'Erro na Produção'}).eq('id_post', post_id).execute()
        return False

def check_queue():
    # Busca posts aguardando produção
    res = supabase.table("posts").select("*").in_("status", ["Produzir", "Processando"]).execute()
    posts = res.data
    
    if not posts:
        return
        
    print(f"[{time.strftime('%H:%M:%S')}] {len(posts)} post(s) encontrado(s) na fila.")
    for post in posts:
        # Trava o registro
        supabase.table("posts").update({"status": "Processando"}).eq("id_post", post['id_post']).execute()
        process_post(post)

if __name__ == "__main__":
    print("Iniciando Worker Daemon (Video Orchestrator)...")
    while True:
        try:
            check_queue()
        except Exception as e:
            print(f"Erro no loop principal: {e}")
        time.sleep(10)
