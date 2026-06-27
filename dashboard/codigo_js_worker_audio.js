const items = $input.all();
const agrupamentoPorCena = {};

console.log("=== INICIO DO PROCESSAMENTO JS ===");
console.log(`Recebidos ${items.length} itens do(s) nó(s) anterior(es).`);

function processItemData(data, sourceIndex) {
    if (!data) return;
    
    // Log para ver a raiz do objeto
    console.log(`\n[Processando Item ${sourceIndex}] Chaves disponíveis:`, Object.keys(data));

    // 1. Tenta identificar se é o payload do Webhook
    // O webhook do n8n costuma vir com headers, params, query, body
    const idCenaBody = data.body?.id_cena || data.id_cena;
    
    if (idCenaBody) {
        console.log(`👉 Identificado como Webhook! ID Cena: ${idCenaBody}`);
        if (!agrupamentoPorCena[idCenaBody]) {
            agrupamentoPorCena[idCenaBody] = { id_cena: idCenaBody };
        }
        agrupamentoPorCena[idCenaBody].numero_cena = data.body?.numero_cena || data.numero_cena;
        agrupamentoPorCena[idCenaBody].id_post = data.body?.id_post || data.id_post;
        agrupamentoPorCena[idCenaBody].texto_narrado = data.body?.texto_narrado || data.texto_narrado;
    }
    
    // 2. Tenta identificar se é retorno do Google Cloud Storage
    else if (data.kind === "storage#object" && data.name) {
        console.log(`👉 Identificado como GCS Object! Nome do arquivo: ${data.name}`);
        
        const parts = data.name.split('/');
        const fileNameWithExt = parts[parts.length - 1]; 
        const idCenaMatch = fileNameWithExt.replace(/\.mp3$|\.json$/, '');
        
        console.log(`   - ID Cena extraído do nome: ${idCenaMatch}`);

        if (!agrupamentoPorCena[idCenaMatch]) {
            agrupamentoPorCena[idCenaMatch] = { id_cena: idCenaMatch };
        }

        const publicUrl = `https://storage.googleapis.com/${data.bucket}/${data.name}`;

        if (data.name.endsWith('.mp3')) {
            console.log(`   - Áudio URL registrada.`);
            agrupamentoPorCena[idCenaMatch].audio_url = publicUrl;
        } else if (data.name.endsWith('.json')) {
            console.log(`   - Timestamps JSON registrado.`);
            agrupamentoPorCena[idCenaMatch].timestamps = publicUrl;
        }
    } else {
        console.log("⚠️ Objeto não reconhecido nem como Webhook nem como GCS:", JSON.stringify(data).substring(0, 100) + "...");
    }
}

// Itera sobre todos os itens de entrada
items.forEach((item, index) => {
    console.log(`\n--- Analisando item.json #${index} ---`);
    
    if (Array.isArray(item.json)) {
        console.log("Este item.json é um ARRAY com", item.json.length, "elementos.");
        item.json.forEach((subItem, subIndex) => processItemData(subItem, `${index}.${subIndex}`));
    } else {
        console.log("Este item.json é um OBJETO.");
        processItemData(item.json, index);
    }
});

console.log("\n=== ESTADO FINAL DO AGRUPAMENTO ANTES DO FILTRO ===");
console.log(JSON.stringify(agrupamentoPorCena, null, 2));

const saidaFinal = Object.values(agrupamentoPorCena)
    .filter(cena => {
        const hasAudio = !!cena.audio_url;
        const hasPostId = !!cena.id_post;
        console.log(`Filtro para Cena ${cena.id_cena} -> audio_url: ${hasAudio}, id_post: ${hasPostId}`);
        return hasAudio && hasPostId;
    })
    .map(cena => ({ json: cena }));

console.log(`\n=== RETORNANDO ${saidaFinal.length} ITENS PARA O POSTGRES ===`);

return saidaFinal;