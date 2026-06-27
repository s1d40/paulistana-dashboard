import os
import time
import json
import subprocess
import base64
import requests
from dotenv import load_dotenv

load_dotenv('../dashboard/.env.local')

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
REPLICATE_API_TOKEN = os.environ.get("REPLICATE_API_TOKEN", "")
os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

import replicate

def generate_audio(text: str, voice_id="EXAVITQu4vr4xnSDxMaL"):
    print(f"[ElevenLabs] Gerando áudio para: {text[:30]}...")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps"
    headers = {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    response = requests.post(url, json=data, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Erro ElevenLabs: {response.text}")
    
    res_json = response.json()
    audio_bytes = base64.b64decode(res_json["audio_base64"])
    
    audio_path = "/tmp/audio_test.mp3"
    with open(audio_path, "wb") as f:
        f.write(audio_bytes)
        
    alignment = res_json["alignment"]
    
    # Converter character alignment para words
    words = []
    chars = alignment["characters"]
    start_times = alignment["character_start_times_seconds"]
    end_times = alignment["character_end_times_seconds"]
    
    current_word = ""
    current_start = None
    
    for i, c in enumerate(chars):
        if current_start is None:
            current_start = start_times[i]
            
        if c == ' ' or i == len(chars) - 1:
            if c != ' ':
                current_word += c
            end_t = end_times[i]
            words.append({
                "text": current_word.strip(),
                "start": current_start,
                "end": end_t
            })
            current_word = ""
            current_start = None
        else:
            current_word += c
            
    json_path = "/tmp/timestamps_test.json"
    with open(json_path, "w") as f:
        json.dump(words, f)
        
    return audio_path, json_path

def generate_image(prompt: str):
    print(f"[Replicate] Gerando imagem para prompt: {prompt[:30]}...")
    # FLUX.1 schnell (fast generation)
    output = replicate.run(
        "black-forest-labs/flux-schnell",
        input={"prompt": prompt, "aspect_ratio": "16:9"}
    )
    # output is a list of image URLs
    img_url = output[0]
    
    img_path = "/tmp/image_test.webp"
    img_data = requests.get(img_url).content
    with open(img_path, "wb") as f:
        f.write(img_data)
        
    return img_path

def assemble_video(image_path, audio_path, json_path, output_path, animation_type="zoom_in"):
    print(f"[FFMPEG] Montando vídeo: {output_path}")
    cmd = [
        "python3", "video_maker.py", 
        image_path, audio_path, output_path, animation_type, json_path
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        raise Exception(f"Erro ao gerar vídeo: {result.stderr}")
    return json.loads(result.stdout)

from supabase import create_client

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_run():
    print("Buscando um roteiro real no banco de dados...")
    # Busca um item de uma lista existente
    response = supabase.table("production_lists").select("items").limit(1).execute()
    if not response.data or not response.data[0]['items']:
        print("Nenhum item encontrado no banco!")
        return
        
    item = response.data[0]['items'][0]
    
    # Se 'captions' existir, usamos como texto falado. Senão, 'prompt'
    script_text = item.get('captions') or item.get('prompt')
    
    # O 'prompt' geralmente é a instrução de imagem ou contexto visual
    # Vamos usar o tema para a geração da imagem para garantir um bom resultado no FLUX,
    # já que às vezes o prompt pode conter instruções de texto ao invés de descrição visual
    prompt_image = f"A high quality professional photo of {item.get('tema')}, highly detailed, cinematic lighting"
    
    print(f"\n--- Item Selecionado ---")
    print(f"Tema: {item.get('tema')}")
    print(f"Texto Falado: {script_text[:100]}...")
    
    audio_path, json_path = generate_audio(script_text)
    image_path = generate_image(prompt_image)
    
    output_path = f"/tmp/real_test_{int(time.time())}.mp4"
    assemble_video(image_path, audio_path, json_path, output_path)
    
    print(f"Vídeo real gerado com sucesso em: {output_path}")

if __name__ == "__main__":
    test_run()
