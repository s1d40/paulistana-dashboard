#!/usr/bin/env python3
import subprocess
import json
import sys
import argparse
import math
import os

def get_audio_duration(audio_path):
    cmd = [
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', audio_path
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        raise Exception(f"Erro ao ler duração do áudio: {result.stderr}")
    return float(result.stdout.strip())

def gerar_legenda_capcut(json_path, output_ass_path, resolution="portrait"):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # CORREÇÃO: Trata se o JSON salvo for direto uma lista de palavras ou um objeto com a chave 'palavras'
    if isinstance(data, list):
        if len(data) > 0 and "palavras" in data[0]:
            words = data[0]["palavras"]
        else:
            words = data
    elif isinstance(data, dict):
        words = data.get('palavras', [])
    else:
        words = []

    if not words:
        return None

    chunks = []
    chunk_size = 4
    for i in range(0, len(words), chunk_size):
        chunks.append(words[i:i+chunk_size])

    res_x = 1080 if resolution == "portrait" else 1920
    res_y = 1920 if resolution == "portrait" else 1080

    ass_content = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {res_x}
PlayResY: {res_y}
WrapStyle: 1

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CapCut,Arial,80,&H00FFFFFF,&H0000FFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,2,50,50,400,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    
    def formatar_tempo(segundos):
        h = int(segundos // 3600)
        m = int((segundos % 3600) // 60)
        s = segundos % 60
        return f"{h}:{m:02d}:{s:05.2f}"

    eventos = []
    for chunk in chunks:
        for i, word_ativa in enumerate(chunk):
            start_t = word_ativa.get('start', 0)
            end_t = chunk[i+1]['start'] if i+1 < len(chunk) else chunk[-1].get('end', start_t + 1)
            
            start_str = formatar_tempo(start_t)
            end_str = formatar_tempo(end_t)
            
            linha_texto = ""
            for j, w in enumerate(chunk):
                if j == i:
                    linha_texto += f"{{\\c&H00FFFF&}}{{\\fscx115\\fscy115}}{w.get('text', '')}{{\\r}} "
                else:
                    linha_texto += f"{w.get('text', '')} "
                    
            eventos.append(f"Dialogue: 0,{start_str},{end_str},CapCut,,0,0,0,,{linha_texto.strip()}")

    with open(output_ass_path, 'w', encoding='utf-8') as f:
        f.write(ass_content + "\n".join(eventos))
        
    return output_ass_path


def run_animator():
    parser = argparse.ArgumentParser(description="SFAI Animator - Profissional Reels Generator")
    parser.add_argument("image_path")
    parser.add_argument("audio_path")
    parser.add_argument("output_path")
    parser.add_argument("animation_type")
    parser.add_argument("json_path")
    parser.add_argument("--format", choices=["portrait", "landscape"], default="portrait", help="Formato do vídeo (portrait=9:16, landscape=16:9)")
    parser.add_argument("--no-subtitles", action="store_true", help="Desabilitar a geração de legendas")
    
    args = parser.parse_args()
    
    try:
        if not os.path.exists(args.image_path) or not os.path.exists(args.audio_path) or not os.path.exists(args.json_path):
            raise Exception("Arquivo de imagem, áudio ou json não encontrado na pasta /tmp/")

        ass_gerado = None
        ass_path = None
        if not args.no_subtitles:
            ass_path = args.output_path.replace('.mp4', '.ass')
            ass_gerado = gerar_legenda_capcut(args.json_path, ass_path, resolution=args.format)

        duration = get_audio_duration(args.audio_path)
        fps = 30
        total_frames = int(duration * fps)
        
        target_w = 1080 if args.format == "portrait" else 1920
        target_h = 1920 if args.format == "portrait" else 1080
        # Correção do Jitter/Tremedeira do FFmpeg (zoompan fractional pixel rounding bug):
        # Aumentamos a resolução interna de trabalho (upscale) antes do zoompan.
        # Assim, o erro de arredondamento de 1 sub-pixel do FFmpeg é diluído quando a
        # imagem retorna para o tamanho original (downscale), deixando a câmera suave.
        upscale_factor = 2
        uw, uh = target_w * upscale_factor, target_h * upscale_factor
        
        z_pan = 1.3
        z_step = 0.15
        
        animations = {
            'zoom_in': {'z': f'zoom+{z_step}/({duration}*{fps})', 'x': 'iw/2-(iw/zoom/2)', 'y': 'ih/2-(ih/zoom/2)'},
            'zoom_out': {'z': f'({1.0+z_step})-on*{z_step}/({duration}*{fps})', 'x': 'iw/2-(iw/zoom/2)', 'y': 'ih/2-(ih/zoom/2)'},
            'pan_left': {'z': str(z_pan), 'x': f'(iw-iw/zoom)-(on*(iw-iw/zoom)/({duration}*{fps}))', 'y': 'ih/2-(ih/zoom/2)'},
            'pan_right': {'z': str(z_pan), 'x': f'on*(iw-iw/zoom)/({duration}*{fps})', 'y': 'ih/2-(ih/zoom/2)'},
            'pan_up': {'z': str(z_pan), 'x': 'iw/2-(iw/zoom/2)', 'y': f'(ih-ih/zoom)-(on*(ih-ih/zoom)/({duration}*{fps}))'},
            'pan_down': {'z': str(z_pan), 'x': 'iw/2-(iw/zoom/2)', 'y': f'on*(ih-ih/zoom)/({duration}*{fps})'},
            'diag_up_right': {'z': str(z_pan), 'x': f'on*(iw-iw/zoom)/({duration}*{fps})', 'y': f'(ih-ih/zoom)-(on*(ih-ih/zoom)/({duration}*{fps}))'},
            'diag_down_left': {'z': str(z_pan), 'x': f'(iw-iw/zoom)-(on*(iw-iw/zoom)/({duration}*{fps}))', 'y': f'on*(ih-ih/zoom)/({duration}*{fps})'}
        }
        
        anim = animations.get(args.animation_type, animations['zoom_in'])
        
        filter_complex = (
            f"scale={uw}:{uh}:force_original_aspect_ratio=increase,crop={uw}:{uh},"
            f"zoompan=z='{anim['z']}':x='{anim['x']}':y='{anim['y']}':d={total_frames}:s={uw}x{uh}:fps={fps},"
            f"scale={target_w}:{target_h}:flags=bicubic,setsar=1"
        )
        
        if ass_gerado and os.path.exists(ass_gerado):
            filter_complex += f",ass='{ass_gerado}'"

        cmd = [
            'ffmpeg', '-y',

            '-i', args.image_path,
            '-i', args.audio_path,
            '-filter_complex', filter_complex,
            '-threads', '4',
            '-c:v', 'libx264', '-preset', 'faster', '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-b:a', '128k',
            '-shortest',
            args.output_path
        ]
        
        # CORREÇÃO: Captura os erros reais do FFmpeg
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if proc.returncode != 0:
            raise Exception(f"FFmpeg Error:\n{proc.stderr}")
        
        if ass_path and os.path.exists(ass_path):
            os.remove(ass_path)
            
        print(json.dumps({
            "status": "success",
            "message": "Vídeo gerado com sucesso",
            "output": args.output_path
        }))

    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    run_animator()
