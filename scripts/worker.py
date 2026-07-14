import os
import time
import json
import subprocess
import base64
import requests
import uuid
import glob
import functools
import concurrent.futures
import sys
import traceback
from dotenv import load_dotenv
from supabase import create_client, Client
import replicate
from google.cloud import storage
from google.oauth2 import service_account

# Carrega variáveis de ambiente do .env.local do Dashboard
if os.path.exists('/var/www/painel.paulistanaemporio.com/.env.local'):
    load_dotenv('/var/www/painel.paulistanaemporio.com/.env.local', override=True)
else:
    load_dotenv('../dashboard/.env.local', override=True)

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
REPLICATE_API_TOKEN = os.environ.get("REPLICATE_API_TOKEN", "")
os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

# ============================================================================
# RETRY DECORATOR — Exponential backoff for network errors
# ============================================================================

RETRIABLE_EXCEPTIONS = (
    requests.exceptions.ConnectionError,
    requests.exceptions.Timeout,
    requests.exceptions.ChunkedEncodingError,
    ConnectionError,
    TimeoutError,
    OSError,
)

def retry_on_network_error(max_retries=3, base_delay=2, retriable_exceptions=None):
    """Decorator that retries a function on network errors with exponential backoff."""
    if retriable_exceptions is None:
        retriable_exceptions = RETRIABLE_EXCEPTIONS
    
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    error_msg = str(e).lower()
                    is_retriable = (
                        isinstance(e, retriable_exceptions) or
                        'server disconnected' in error_msg or
                        'connection reset' in error_msg or
                        'timeout' in error_msg or
                        'remoteerror' in error_msg or
                        'remoteprotocolerror' in error_msg or
                        'connection refused' in error_msg
                    )
                    
                    if is_retriable and attempt < max_retries:
                        delay = base_delay * (2 ** attempt)
                        print(f"  [RETRY] {func.__name__} falhou (tentativa {attempt + 1}/{max_retries + 1}): {e}")
                        print(f"  [RETRY] Aguardando {delay}s antes de tentar novamente...")
                        time.sleep(delay)
                        last_exception = e
                    else:
                        raise
            raise last_exception
        return wrapper
    return decorator

# ============================================================================
# SUPABASE CLIENT — Fresh client factory to avoid stale HTTP/2 connections
# ============================================================================

def get_fresh_supabase_client() -> Client:
    """Creates a fresh Supabase client to avoid stale HTTP/2 connections."""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def update_post_status(post_id: str, status: str, extra_fields: dict = None):
    """Safely updates post status using a fresh client."""
    try:
        db = get_fresh_supabase_client()
        update_data = {'status': status}
        if extra_fields:
            update_data.update(extra_fields)
        db.table('posts').update(update_data).eq('id_post', post_id).execute()
    except Exception as e:
        print(f"  [WARN] Falha ao atualizar status do post {post_id}: {e}")

# ============================================================================
# MEDIA GENERATION — With retry logic
# ============================================================================

@retry_on_network_error(max_retries=3, base_delay=2)
def generate_audio(text: str, voice_id="EXAVITQu4vr4xnSDxMaL"):
    print(f"  [ElevenLabs] Gerando áudio: {text[:50]}...")
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
    response = requests.post(url, json=data, headers=headers, timeout=90)
    if response.status_code != 200:
        raise Exception(f"Erro ElevenLabs ({response.status_code}): {response.text[:200]}")
    
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

@retry_on_network_error(max_retries=3, base_delay=3)
def generate_image(cena: dict, formato_video: str = "landscape"):
    prompt = cena.get('prompt_visual', '')
    print(f"  [Replicate] Gerando imagem ({formato_video}): {prompt[:50]}...")
    os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN
    
    # Extrai as configs do Replicate do JSON da cena (se existirem)
    replicate_config = cena.get('replicate', {})
    model_url = replicate_config.get('model_url', 'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions')
    
    # Converte URL REST ('https://api.replicate.com/v1/models/author/model/predictions') para string 'author/model'
    model_id = model_url.split('/models/')[-1].replace('/predictions', '') if '/models/' in model_url else "black-forest-labs/flux-schnell"
    
    # Determina aspect_ratio baseado no formato_video
    default_aspect = "16:9" if formato_video == "landscape" else "9:16"
    input_replicate = replicate_config.get('input', {"prompt": prompt, "aspect_ratio": default_aspect}).copy()
    
    # Se o input já veio do JSON mas não tem aspect_ratio, injeta o correto
    if 'aspect_ratio' not in input_replicate:
        input_replicate['aspect_ratio'] = default_aspect
    
    # 2. Injeção da Referência Visual
    image_reference_url = cena.get('imagem_referencia')
    
    if image_reference_url:
        # Replicate (ex: nano-banana) exige que image_input seja array
        if isinstance(image_reference_url, list):
            input_replicate['image_input'] = image_reference_url
        else:
            input_replicate['image_input'] = [image_reference_url]
    elif 'image_input' in input_replicate:
        if isinstance(input_replicate['image_input'], str):
            input_replicate['image_input'] = [input_replicate['image_input']]
        elif not input_replicate['image_input']:
            del input_replicate['image_input']
            
    # Garantir que o prompt não falte se o model default for flux-schnell e o JSON estiver vazio
    if 'prompt' not in input_replicate:
        input_replicate['prompt'] = prompt

    print(f"  [Info] Replicate Model: {model_id} | Ref: {image_reference_url}")

    output = replicate.run(
        model_id,
        input=input_replicate
    )
    
    # Para o Nano Banana, a saída geralmente é um array com a URL
    img_url = output[0] if isinstance(output, list) else output
    
    img_path = f"/tmp/image_{int(time.time() * 1000)}.webp"
    with open(img_path, "wb") as f:
        f.write(requests.get(img_url, timeout=60).content)
    return img_path

@retry_on_network_error(max_retries=3, base_delay=2)
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

# ============================================================================
# VIDEO ASSEMBLY
# ============================================================================

def assemble_scene(image_path, audio_path, json_path, output_path, animation_type="zoom_in", formato_video="portrait", com_legendas=True):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    video_maker_path = os.path.join(script_dir, "video_maker.py")
    cmd = [sys.executable, video_maker_path, image_path, audio_path, output_path, animation_type, json_path, "--format", formato_video]
    if not com_legendas:
        cmd.append("--no-subtitles")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        raise Exception(f"Erro no FFmpeg da cena: stdout: {res.stdout[-200:]}, stderr: {res.stderr[-300:]}")
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
        raise Exception(f"Erro ao concatenar vídeos: {res.stderr[-300:]}")
    
    # Cleanup concat list
    try:
        os.remove(list_file)
    except OSError:
        pass
    
    return output_path

# ============================================================================
# SCENE PROCESSING — With fresh client and retry
# ============================================================================

def process_scene(cena, post_id, voice_settings=None, formato_video="portrait", com_legendas=True):
    """Process a single scene with fresh Supabase client and retry logic."""
    num = cena['numero']
    raw_id_cena = cena.get('id_cena', '')
    
    # Sanitize id_cena: ensure it's always a valid UUID
    # The n8n script sometimes generates non-UUID ids like "cena_uuid_7"
    try:
        uuid.UUID(raw_id_cena)  # Validate it's a real UUID
        id_cena = raw_id_cena
    except (ValueError, AttributeError):
        # Generate a deterministic UUID from post_id + scene number
        id_cena = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{post_id}_{num}"))
    print(f"-> Processando cena {num}...")
    
    # Use fresh client to avoid stale HTTP/2 connections
    db = get_fresh_supabase_client()
    
    # Check if image exists (with retry via fresh client)
    @retry_on_network_error(max_retries=3, base_delay=2)
    def check_existing_image():
        fresh = get_fresh_supabase_client()
        return fresh.table('imagens').select('image_url').eq('id_post', post_id).eq('numero_cena', num).execute()
    
    @retry_on_network_error(max_retries=3, base_delay=2)
    def check_existing_audio():
        fresh = get_fresh_supabase_client()
        return fresh.table('audios').select('audio_url, timestamps').eq('id_post', post_id).eq('numero_cena', num).execute()
    
    img_res = check_existing_image()
    img_url = img_res.data[0]['image_url'] if img_res.data and img_res.data[0].get('image_url') else None
    
    aud_res = check_existing_audio()
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
        image_path = generate_image(cena, formato_video=formato_video)
        img_url = upload_to_gcs(image_path, post_id, f"imagem_{num}.webp")
        
        @retry_on_network_error(max_retries=3, base_delay=2)
        def save_image():
            fresh = get_fresh_supabase_client()
            fresh.table('imagens').upsert({
                'id_imagem': str(uuid.uuid4()),
                'id_post': post_id,
                'id_cena': id_cena,
                'numero_cena': num,
                'image_url': img_url,
                'prompt_utilizado': cena['prompt_visual'],
                'data_geracao': time.strftime('%Y-%m-%dT%H:%M:%S+00:00')
            }).execute()
        save_image()
        
    # Download or generate Audio
    if aud_url and json_url:
        print(f"  [Cache] Áudio da cena {num} já existe, baixando...")
        import urllib.request
        urllib.request.urlretrieve(aud_url, audio_path)
        urllib.request.urlretrieve(json_url, json_path)
    else:
        voice_id = voice_settings.get("voice_id", "EXAVITQu4vr4xnSDxMaL") if voice_settings else "EXAVITQu4vr4xnSDxMaL"
        audio_path, json_path = generate_audio(cena['texto_narrado'], voice_id=voice_id)
        aud_url = upload_to_gcs(audio_path, post_id, f"audio_{num}.mp3")
        json_url = upload_to_gcs(json_path, post_id, f"legenda_{num}.json")
        
        @retry_on_network_error(max_retries=3, base_delay=2)
        def save_audio():
            fresh = get_fresh_supabase_client()
            fresh.table('audios').upsert({
                'id_audio': str(uuid.uuid4()),
                'id_post': post_id,
                'id_cena': id_cena,
                'numero_cena': num,
                'audio_url': aud_url,
                'texto_narrado': cena['texto_narrado'],
                'timestamps': json_url,
                'data_geracao': time.strftime('%Y-%m-%dT%H:%M:%S+00:00')
            }).execute()
        save_audio()

    # Renderizar Cena com FFmpeg
    scene_output = f"/tmp/scene_{post_id}_{num}.mp4"
    animacao = cena.get('animacao', 'zoom_in')
    assemble_scene(image_path, audio_path, json_path, scene_output, animacao, formato_video, com_legendas)
    
    # Upload do Vídeo da Cena pro GCS e salvar na tabela
    cena_vid_url = upload_to_gcs(scene_output, post_id, f"video_cena_{num}.mp4")
    
    @retry_on_network_error(max_retries=3, base_delay=2)
    def save_scene_video():
        fresh = get_fresh_supabase_client()
        fresh.table('videos_cenas').upsert({
            'id': str(uuid.uuid4()),
            'id_post': post_id,
            'id_cena': id_cena,
            'numero_cena': num,
            'video_url': cena_vid_url,
            'status': 'Concluído',
            'data_geracao': time.strftime('%Y-%m-%dT%H:%M:%S+00:00')
        }).execute()
    save_scene_video()
    
    print(f"  ✅ Cena {num} concluída com sucesso!")
    return num, scene_output

# ============================================================================
# TEMP FILE CLEANUP
# ============================================================================

def cleanup_temp_files(post_id: str):
    """Remove all temporary files for a given post ID."""
    patterns = [
        f"/tmp/img_{post_id}_*",
        f"/tmp/aud_{post_id}_*",
        f"/tmp/json_{post_id}_*",
        f"/tmp/scene_{post_id}_*",
        f"/tmp/final_{post_id}*",
    ]
    removed = 0
    for pattern in patterns:
        for f in glob.glob(pattern):
            try:
                os.remove(f)
                removed += 1
            except OSError:
                pass
    if removed > 0:
        print(f"  [CLEANUP] {removed} arquivo(s) temporário(s) removido(s) para post {post_id[:8]}.")

# ============================================================================
# POST PROCESSING — Main orchestration with scene-level resilience
# ============================================================================

def process_post(post):
    post_id = post['id_post']
    tema = post.get('tema_post', 'Sem título')
    try:
        print(f"\n{'='*60}")
        print(f"--- Iniciando Produção: {tema} ({post_id[:8]}...) ---")
        print(f"{'='*60}")
        
        # Parse script
        roteiro = post.get('roteiro_gerado')
        if isinstance(roteiro, str):
            roteiro = json.loads(roteiro)
            
        formato_video = roteiro.get('formato_video', post.get('formato_video', 'landscape'))
        com_legendas = roteiro.get('com_legendas', post.get('com_legendas', False))
        print(f"  [Config] Formato: {formato_video} | Legendas: {'SIM' if com_legendas else 'NÃO'}")
            
        cenas = roteiro.get('cenas', [])
        if not cenas:
            raise Exception("Nenhuma cena encontrada no roteiro.")
        
        total_cenas = len(cenas)
        update_post_status(post_id, f"Processando (0/{total_cenas} cenas)")
            
        scene_outputs = {}
        failed_scenes = []
        
        # Process scenes in parallel (max_workers=2 for ElevenLabs rate limit)
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            futures = {executor.submit(process_scene, cena, post_id, roteiro.get('voice_settings'), formato_video, com_legendas): cena for cena in cenas}
            completed = 0
            for future in concurrent.futures.as_completed(futures):
                cena = futures[future]
                try:
                    num, scene_output = future.result()
                    scene_outputs[num] = scene_output
                    completed += 1
                    update_post_status(post_id, f"Processando ({completed}/{total_cenas} cenas)")
                except Exception as exc:
                    print(f"-> ❌ Cena {cena['numero']} falhou após todos os retries: {exc}")
                    failed_scenes.append(cena['numero'])
        
        # Evaluate: if too many scenes failed, abort
        if len(failed_scenes) > 0 and len(failed_scenes) >= total_cenas * 0.5:
            raise Exception(f"{len(failed_scenes)}/{total_cenas} cenas falharam: {failed_scenes}. Abortando.")
        
        if len(failed_scenes) > 0:
            print(f"-> ⚠️ {len(failed_scenes)} cena(s) falharam ({failed_scenes}), mas continuando com as {len(scene_outputs)} bem-sucedidas.")
                    
        # Sort videos in correct scene order
        scene_videos = [scene_outputs[num] for num in sorted(scene_outputs.keys())]
        
        if not scene_videos:
            raise Exception("Nenhuma cena foi processada com sucesso.")
        
        # Concatenate scenes
        update_post_status(post_id, "Compilando vídeo final...")
        final_video_path = f"/tmp/final_{post_id}.mp4"
        concatenate_videos(scene_videos, final_video_path)
        
        # Upload final video to GCS
        update_post_status(post_id, "Fazendo upload do vídeo...")
        final_video_url = upload_to_gcs(final_video_path, post_id, "video_final.mp4")
        
        # Update Supabase with fresh client
        fresh_db = get_fresh_supabase_client()
        
        fresh_db.table('videos').upsert({
            'id_video_final': str(uuid.uuid4()),
            'id_post': post_id,
            'video_final_url': final_video_url,
            'data_compilacao': time.strftime('%Y-%m-%dT%H:%M:%S+00:00')
        }).execute()
        
        status_final = 'Concluído' if len(failed_scenes) == 0 else 'Concluído (parcial)'
        fresh_db.table('posts').update({
            'status': status_final,
            'video_status': 'Concluído',
            'audio_status': 'Concluído',
            'images_status': 'Concluído'
        }).eq('id_post', post_id).execute()
        
        print(f"-> ✅ Post produzido com sucesso! ({len(scene_outputs)}/{total_cenas} cenas)")
        return True
        
    except Exception as e:
        traceback.print_exc()
        print(f"-> ❌ Erro fatal no post {post_id[:8]}: {e}")
        try:
            fresh_db = get_fresh_supabase_client()
            fresh_db.table('posts').update({'status': 'Erro na Produção'}).eq('id_post', post_id).execute()
        except Exception as fallback_err:
            print(f"-> ⚠️ Falha crítica ao atualizar erro do post: {fallback_err}")
        return False
    finally:
        cleanup_temp_files(post_id)

# ============================================================================
# QUEUE MANAGEMENT
# ============================================================================

MAX_POSTS_PER_CYCLE = 3

def check_queue():
    """Check for posts waiting in queue and process up to MAX_POSTS_PER_CYCLE."""
    fresh_db = get_fresh_supabase_client()
    
    # Primary: posts explicitly queued for production
    res = fresh_db.table("posts").select("*").eq("status", "Produzir").order("data_criacao").limit(MAX_POSTS_PER_CYCLE).execute()
    posts = res.data or []
    
    # Fallback: rescue posts stuck in 'Processando' that already have a script
    # This handles cases where the dashboard lost its autoProduceQueue (e.g., page refresh)
    if len(posts) < MAX_POSTS_PER_CYCLE:
        remaining = MAX_POSTS_PER_CYCLE - len(posts)
        rescue_res = fresh_db.table("posts").select("*").eq("status", "Processando").not_.is_("roteiro_gerado", "null").order("data_criacao").limit(remaining).execute()
        rescued = rescue_res.data or []
        # Filter out posts whose roteiro_gerado is just a placeholder
        for rp in rescued:
            roteiro = rp.get('roteiro_gerado', '')
            roteiro_str = str(roteiro)
            if roteiro_str and 'Gerando...' not in roteiro_str and len(roteiro_str) > 100:
                posts.append(rp)
                print(f"[{time.strftime('%H:%M:%S')}] 🔧 Resgatando post travado: {rp.get('tema_post', 'N/A')} ({rp['id_post'][:8]}...)")
    
    if not posts:
        return
    
    print(f"\n[{time.strftime('%H:%M:%S')}] {len(posts)} post(s) encontrado(s) na fila.")
    
    for post in posts:
        post_id = post['id_post']
        print(f"\n[{time.strftime('%H:%M:%S')}] Iniciando produção: {post.get('tema_post', 'N/A')} ({post_id[:8]}...)")
        
        # Lock the post immediately
        try:
            fresh_db = get_fresh_supabase_client()
            fresh_db.table("posts").update({"status": "Processando"}).eq("id_post", post_id).execute()
        except Exception as e:
            print(f"-> ⚠️ Falha ao travar post {post_id[:8]}: {e}")
            continue
        
        process_post(post)

# ============================================================================
# MAIN LOOP
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🎬 Worker Daemon (Video Orchestrator) v2.0")
    print(f"   Supabase: {SUPABASE_URL}")
    print(f"   Max posts por ciclo: {MAX_POSTS_PER_CYCLE}")
    print(f"   Retry: 3x com backoff exponencial")
    print("=" * 60)
    
    while True:
        try:
            check_queue()
        except Exception as e:
            print(f"[{time.strftime('%H:%M:%S')}] Erro no loop principal: {e}")
            time.sleep(5)
        time.sleep(10)
