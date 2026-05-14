const { execSync } = require('child_process');
const fs = require('fs');

// 1. Pegamos os 3 arquivos binários
const imageBuffer = await this.helpers.getBinaryDataBuffer($itemIndex, 'imagem_base');
const audioBuffer = await this.helpers.getBinaryDataBuffer($itemIndex, 'audio_base');
const jsonBuffer = await this.helpers.getBinaryDataBuffer($itemIndex, 'json_tempos');

const postId = $json.id_post;
const numeroCena = $json.numero_cena;
const animationType = $json.animacao;
// 2. Montamos os caminhos físicos no WSL
const imagePath = `/tmp/${postId}_cena_${numeroCena}.png`;
const audioPath = `/tmp/${postId}_cena_${numeroCena}.mp3`;
const jsonPath = `/tmp/${postId}_cena_${numeroCena}.json`;
const videoPath = `/tmp/${postId}_cena_${numeroCena}.mp4`;

// 3. Gravamos os 3 arquivos físicos no HD
fs.writeFileSync(imagePath, imageBuffer);
fs.writeFileSync(audioPath, audioBuffer);
fs.writeFileSync(jsonPath, jsonBuffer);

// 4. Comando FFmpeg via Python com 5 ARGUMENTOS
const command = `/root/n8n-tools/python-env/.venv/bin/python3 /root/n8n-tools/video_maker.py "${imagePath}" "${audioPath}" "${videoPath}" "${animationType}" "${jsonPath}"`;

try {
    const stdout = execSync(command, { encoding: 'utf-8', timeout: 120000 });
    return {
        json: { status: "sucesso", video_path: videoPath, terminal_log: stdout }
    };
} catch (error) {
    // A MÁGICA: Capturamos tudo que o Python tentou falar antes de morrer
    const saidaPadrao = error.stdout ? error.stdout.toString() : '';
    const saidaErro = error.stderr ? error.stderr.toString() : '';

    throw new Error(
        `Falha na Cena ${numeroCena}!\n\n` +
        `🔴 RESPOSTA DO PYTHON (STDOUT):\n${saidaPadrao}\n\n` +
        `🔴 ERRO DE SISTEMA (STDERR):\n${saidaErro}\n\n` +
        `🔴 ERRO NODE:\n${error.message}`
    );
}