/**
 * TOOL: update_preset_settings (Versão FINAL com Chaves Fixas)
 */

console.log("=== INICIANDO TOOL: update_preset_settings ===");

// CHAVES FIXAS PARA EVITAR ERRO DE AMBIENTE
const SUPABASE_URL = 'https://wolygamyyjgpoqsfefye.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbHlnYW15eWpncG9xc2ZlZnllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM1NTQ0OSwiZXhwIjoyMDkzOTMxNDQ5fQ.lrjXQbm_y6DkSA_2CsFsoFbdWoKZGpHUAvGGSEd79bY';

let prompt = "";
let model = "";
let temperature = null;

function unpack(obj) {
    console.log("DEBUG: Recebido para unpack:", JSON.stringify(obj));

    // 1. Tentar pegar do topo do objeto ou de .args (padrão de alguns agentes)
    let p = obj.prompt || (obj.args ? obj.args.prompt : null);
    let m = obj.model || (obj.args ? obj.args.model : null);
    let t = obj.temperature || (obj.args ? obj.args.temperature : null);

    // 2. Se não encontrou, e existe .input, tentar extrair de .input
    if ((!p && !m && (t === null || t === undefined)) && obj.input) {
        if (typeof obj.input === 'object') {
            p = p || obj.input.prompt;
            m = m || obj.input.model;
            t = t || obj.input.temperature;
        } else if (typeof obj.input === 'string') {
            // Tentar JSON.parse
            try {
                const parsed = JSON.parse(obj.input);
                p = p || parsed.prompt;
                m = m || parsed.model;
                t = t || parsed.temperature;
            } catch (e) {
                // Tentar Regex para chave=valor ou chave:valor
                const pMatch = obj.input.match(/prompt[:=]\s*["']?([\s\S]+?)(?=["']?\s*[}\n,]|active_preset_id|$)/i);
                const mMatch = obj.input.match(/model[:=]\s*["']?([^"'\s,]+)["']?/i);
                const tMatch = obj.input.match(/temperature[:=]\s*["']?([0-9.]+)/i);
                if (pMatch && !p) p = pMatch[1].trim();
                if (mMatch && !m) m = mMatch[1].trim();
                if (tMatch && (t === null || t === undefined)) t = tMatch[1];
            }
        }
    }
    return { p, m, t };
}

const result = unpack($json);
prompt = (result.p || "").trim();
model = (result.m || "").trim();
temperature = result.t;

try {
    // Tenta pegar dados do Webhook ou do input global
    const webhookNode = typeof $node !== 'undefined' && $node["Webhook"] ? $node["Webhook"] : null;
    const webhookData = webhookNode ? webhookNode.json : ($json.body || $json);
    
    const active_preset_id = webhookData.active_preset_id;

    console.log(`DEBUG: active_preset_id="${active_preset_id}"`);

    if (!active_preset_id) {
        return "ERRO: Contexto ausente. active_preset_id não encontrado no payload.";
    }
    
    if (!prompt && !model && (temperature === null || isNaN(temperature))) {
        return "ERRO: Nada para atualizar. O Agente deve fornecer pelo menos um campo: 'prompt', 'model' ou 'temperature'.";
    }

    const updates = { updated_at: new Date().toISOString() };
    if (prompt) updates.prompt = prompt;
    if (model) updates.model = model;
    if (temperature !== null && !isNaN(temperature)) updates.temperature = parseFloat(temperature);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/content_presets?id=eq.${active_preset_id}`, {
        method: 'PATCH',
        headers: { 
            'apikey': SUPABASE_KEY, 
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    });

    if (!response.ok) throw new Error(`Falha Supabase: ${response.statusText}`);

    return `SUCESSO: Configurações atualizadas no cockpit.`;

} catch (error) {
    return `ERRO: ${error.message}`;
}