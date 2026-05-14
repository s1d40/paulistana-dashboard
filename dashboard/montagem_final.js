const { execSync } = require('child_process');
const fs = require('fs');

// 1. O n8n entrega todos os itens do loop anterior
const items = $input.all();
if (items.length === 0) throw new Error("Nenhum vídeo recebido para concatenar.");

const postId = items[0].json.video_path.match(/\/tmp\/(.+?)_cena/)[1];

// 2. Cria a lista de arquivos para o FFmpeg
let concatList = "";
const videoPaths = [];

items.sort((a, b) => {
    const numA = parseInt(a.json.video_path.match(/_cena_(\d+)/)[1]);
    const numB = parseInt(b.json.video_path.match(/_cena_(\d+)/)[1]);
    return numA - numB;
});

// Loop populando as listas originais
items.forEach(item => {
    const vPath = item.json.video_path;
    concatList += `file '${vPath}'\n`;
    videoPaths.push(vPath);
});

// CRÍTICO: Remove caminhos duplicados caso o n8n tenha duplicado itens na entrada
const uniqueVideoPaths = [...new Set(videoPaths)];

// Recria o texto do concatList apenas com os caminhos únicos para o FFmpeg não colar a cena duas vezes
let uniqueConcatList = "";
uniqueVideoPaths.forEach(vp => {
    uniqueConcatList += `file '${vp}'\n`;
});

const listPath = `/tmp/${postId}_concat_list.txt`;
fs.writeFileSync(listPath, uniqueConcatList);

// 3. O Comando FFmpeg
const finalVideoPath = `/tmp/${postId}_final.mp4`;
const command = `ffmpeg -y -f concat -safe 0 -i ${listPath} -c:v libx264 -c:a aac -vsync vfr ${finalVideoPath}`;

try {
    // 4. Executa a colagem
    execSync(command, { encoding: 'utf-8' });

    // 5. Limpar a sujeira com VERIFICAÇÃO DE SEGURANÇA (Evita o erro ENOENT)
    uniqueVideoPaths.forEach(vp => {
        if (fs.existsSync(vp)) {
            fs.unlinkSync(vp);
        }
    });

    if (fs.existsSync(listPath)) {
        fs.unlinkSync(listPath);
    }

    // ==========================================
    // O PULO DO GATO: Lendo o arquivo físico e transformando em binário do n8n!
    // ==========================================
    const videoBuffer = fs.readFileSync(finalVideoPath);
    const videoBinary = await this.helpers.prepareBinaryData(videoBuffer, `${postId}_final.mp4`, 'video/mp4');

    // 6. Retorna o JSON E o Binário juntos!
    return {
        json: {
            status: "video_final_pronto",
            id_post: postId
        },
        binary: {
            video_final: videoBinary
        }
    };
} catch (error) {
    throw new Error(`Erro ao concatenar vídeos: ${error.message}`);
}