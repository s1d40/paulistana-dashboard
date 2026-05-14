/**
 * WORKER: Render de Cena Individual (VERSÃO BLINDADA)
 * OBJETIVO: Unir 1 Áudio + 1 Imagem + Timestamps em um fragmento .mp4
 * AMBIENTE: Nó "Code" do n8n (Configuração recomendada: Run once for each item)
 */

const { execSync } = require('child_process');
const fs = require('fs');

// 1. Extração Segura de Dados (Detectando payload dentro de 'body')
let input = (typeof $json !== 'undefined' && $json !== null) ? $json : $input.item.json;

// Se o n8n vier de um Webhook, os dados costumam estar dentro de 'body'
if (input.body && typeof input.body === 'object') {
    input = input.body;
}

// 2. Validação de Presença de Campos Críticos
const requiredFields = ['id_post', 'numero_cena', 'image_url', 'audio_url', 'timestamps_url', 'animacao'];
const missingFields = requiredFields.filter(field => !input[field]);

if (missingFields.length > 0) {
    throw new Error(`Dados ausentes no payload: ${missingFields.join(', ')}`);
}

const {
    id_post,
    numero_cena,
    image_url,
    audio_url,
    timestamps_url,
    animacao
} = input;

// 3. Definição de Caminhos Temporários (No HD para poupar RAM)
const idStr = String(id_post).substring(0, 8); // Força string para evitar erro de undefined
const imagePath = `/tmp/${id_post}_c${numero_cena}_img.jpg`;
const audioPath = `/tmp/${id_post}_c${numero_cena}_aud.mp3`;
const jsonPath = `/tmp/${id_post}_c${numero_cena}_time.json`;
const videoPath = `/tmp/${id_post}_c${numero_cena}_render.mp4`;
const gcsDestPath = `posts/${id_post}/videos/cena_${numero_cena}.mp4`;
const bucket = 'cocreator_content';

try {
    // 4. Download via Sistema (Evita buffers do Node.js)
    console.log(`[${idStr}] Baixando assets da cena ${numero_cena}...`);
    execSync(`curl -s -L "${image_url}" -o "${imagePath}"`);
    execSync(`curl -s -L "${audio_url}" -o "${audioPath}"`);
    execSync(`curl -s -L "${timestamps_url}" -o "${jsonPath}"`);

    // 5. Execução do Motor Python (Video Maker)
    const pythonBin = '/root/n8n-tools/python-env/.venv/bin/python3';
    const scriptPath = '/root/n8n-tools/video_maker.py';

    console.log(`[${idStr}] Iniciando Python Render (Anim: ${animacao})...`);
    const renderCmd = `${pythonBin} ${scriptPath} "${imagePath}" "${audioPath}" "${videoPath}" "${animacao}" "${jsonPath}"`;

    // Executa o render (Timeout de 5 minutos)
    const stdout = execSync(renderCmd, { encoding: 'utf-8', timeout: 300000 });

    // 6. Upload via Python Helper (GCS Library)
    // Usamos o script python que acabamos de subir para garantir compatibilidade
    const uploadScript = '/root/n8n-tools/n8n_gcs_upload.py';
    console.log(`[${idStr}] Fazendo upload do fragmento para o Cloud Storage via Python...`);

    const uploadCmd = `${pythonBin} ${uploadScript} "${videoPath}" "${gcsDestPath}"`;
    execSync(uploadCmd, { encoding: 'utf-8' });

    // 7. Housekeeping: Limpa arquivos temporários imediatamente
    [imagePath, audioPath, jsonPath, videoPath].forEach(path => {
        if (fs.existsSync(path)) fs.unlinkSync(path);
    });

    // 8. Retorno do Worker para o Supabase/Frontend
    return {
        status: "success",
        id_post: id_post,
        numero_cena: numero_cena,
        video_url: `https://storage.googleapis.com/${bucket}/${gcsDestPath}`,
        terminal_log: stdout
    };

} catch (error) {
    // Garantir limpeza em caso de crash
    [imagePath, audioPath, jsonPath, videoPath].forEach(path => {
        if (fs.existsSync(path)) {
            try { fs.unlinkSync(path); } catch (e) { }
        }
    });

    const stderr = error.stderr ? error.stderr.toString() : '';
    console.error(`[${idStr}] ERRO NO RENDER:`, error.message);

    throw new Error(`Falha no Render (Cena ${numero_cena}): ${error.message}\n${stderr}`);
}
