import re

with open('/home/sid/cocreator-n8n/scripts/worker.py', 'r') as f:
    content = f.read()

replacement = """def process_scene(cena, post_id):
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
            'id_imagem': f"img_{id_cena}",
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
            'id_audio': f"aud_{id_cena}",
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
        'id': f"vid_cena_{id_cena}",
        'id_post': post_id,
        'id_cena': id_cena,
        'numero_cena': num,
        'video_url': cena_vid_url,
        'status': 'Concluído',
        'data_geracao': time.strftime('%Y-%m-%dT%H:%M:%S+00:00')
    }).execute()
    
    return num, scene_output"""

pattern = r"def process_scene\(cena, post_id\):.*?(?=\n\nimport concurrent.futures|\n\ndef process_post)"
# wait, process_post is right after process_scene

import re
content = re.sub(r"def process_scene\(cena, post_id\):.*?(?=\n\ndef process_post)", replacement, content, flags=re.DOTALL)

with open('/home/sid/cocreator-n8n/scripts/worker.py', 'w') as f:
    f.write(content)
