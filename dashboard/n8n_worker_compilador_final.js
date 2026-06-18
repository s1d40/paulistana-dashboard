/**
 * WORKER: Compilador Final de Vídeo (VERSÃO BLINDADA & LEVE)
 * OBJETIVO: Concatenar fragmentos de cenas e adicionar trilha sonora.
 * AMBIENTE: Nó "Code" do n8n.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

// 1. Extração Segura de Dados (Detectando payload dentro de 'body')
let input = {};

function getBodyFromNode(nodeName) {
    try {
        const node = $(nodeName);
        if (node) {
            if (node.item && node.item.json) {
                if (node.item.json.body) return node.item.json.body;
                if (node.item.json.video_urls) return node.item.json;
            }
            if (typeof node.first === 'function') {
                const firstItem = node.first();
                if (firstItem && firstItem.json) {
                    if (firstItem.json.body) return firstItem.json.body;
                    if (firstItem.json.video_urls) return firstItem.json;
                }
            }
        }
    } catch (e) {
        // Ignora erro se o nó não existir no grafo
    }
    return null;
}

// Tenta obter do nó 'Webhook' ou 'webhook'
input = getBodyFromNode('Webhook') || getBodyFromNode('webhook') || {};

// Fallback para $input (se conectado diretamente ao webhook)
if (!input.video_urls) {
    try {
        if (typeof $input !== 'undefined') {
            if (typeof $input.first === 'function' && $input.first() && $input.first().json) {
                const firstJson = $input.first().json;
                input = firstJson.body || firstJson || {};
            } else if ($input.item && $input.item.json) {
                const itemJson = $input.item.json;
                input = itemJson.body || itemJson || {};
            }
        }
    } catch (e) {}
}

// Fallback para $json
if (!input.video_urls) {
    try {
        if (typeof $json !== 'undefined' && $json !== null) {
            input = $json.body || $json || {};
        }
    } catch (e) {}
}

// 1.1. Gerar ID único para o vídeo final
const videoFinalId = crypto.randomUUID();

const { id_post, video_urls, background_music_url } = input;

if (!id_post || !video_urls || !Array.isArray(video_urls) || video_urls.length === 0) {
    throw new Error("Dados inválidos: id_post e array video_urls são obrigatórios.");
}

const idStr = String(id_post).substring(0, 8);
const tmpDir = `/tmp/${id_post}_final`;
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

const listFilePath = `${tmpDir}/concat_list.txt`;
const finalVideoPath = `${tmpDir}/final_output.mp4`;
const gcsDestPath = `posts/${id_post}/final_video.mp4`;
const bucket = 'cocreator_content';

try {
    console.log(`[${idStr}] HEARTBEAT: Iniciando compilação final...`);

    // 2. Download dos fragmentos
    const localFiles = [];
    for (let i = 0; i < video_urls.length; i++) {
        const url = video_urls[i];
        const localPath = `${tmpDir}/scene_${i}.mp4`;
        console.log(`[${idStr}] HEARTBEAT: Baixando cena ${i}... URL: ${url.substring(0, 50)}...`);
        execSync(`curl -s -L "${url}" -o "${localPath}"`);
        localFiles.push(localPath);
    }

    console.log(`[${idStr}] HEARTBEAT: Todos os fragmentos baixados (${localFiles.length}).`);

    // 3. Criar arquivo de lista para o FFMPEG
    let listContent = "";
    localFiles.forEach(file => {
        listContent += `file '${file}'\n`;
    });
    fs.writeFileSync(listFilePath, listContent);
    console.log(`[${idStr}] HEARTBEAT: Lista FFMPEG criada em ${listFilePath}`);

    // 4. Comando FFMPEG para Concatenar (Ultra-Rápido via Stream Copy)
    const ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${listFilePath}" -c copy "${finalVideoPath}"`;

    console.log(`[${idStr}] HEARTBEAT: Executando FFMPEG...`);
    const ffmpegOut = execSync(ffmpegCmd, { encoding: 'utf-8', timeout: 300000 });
    console.log(`[${idStr}] HEARTBEAT: FFMPEG concluído com sucesso.`);

    // 5. Upload via Python Helper
    const pythonBin = '/root/n8n-tools/python-env/.venv/bin/python3';
    const uploadScript = '/root/n8n-tools/n8n_gcs_upload.py';
    console.log(`[${idStr}] HEARTBEAT: Enviando vídeo final para o GCS...`);
    
    const uploadCmd = `${pythonBin} ${uploadScript} "${finalVideoPath}" "${gcsDestPath}"`;
    execSync(uploadCmd, { encoding: 'utf-8' });
    console.log(`[${idStr}] HEARTBEAT: Upload concluído: ${gcsDestPath}`);

    // 6. Limpeza (Housekeeping)
    execSync(`rm -rf "${tmpDir}"`);
    console.log(`[${idStr}] HEARTBEAT: Cleanup concluído.`);

    // 7. Retorno Explícito para n8n
    return {
        status: "success",
        id_video_final: videoFinalId,
        id_post: id_post,
        video_final_url: `https://storage.googleapis.com/${bucket}/${gcsDestPath}`,
        ffmpeg_log: ffmpegOut.substring(0, 500)
    };

} catch (error) {
    // Limpeza em caso de falha
    if (fs.existsSync(tmpDir)) execSync(`rm -rf "${tmpDir}"`);
    
    const stderr = error.stderr ? error.stderr.toString() : '';
    console.error(`[${idStr}] ERRO NO COMPILADOR:`, error.message);
    throw new Error(`Falha na Compilação Final: ${error.message}\n${stderr}`);
}
