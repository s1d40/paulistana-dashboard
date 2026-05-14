/**
 * TOOL: save_as_new_preset (Versão FINAL com Chaves Fixas)
 */

console.log("=== INICIANDO TOOL: save_as_new_preset ===");

// CHAVES FIXAS PARA EVITAR ERRO DE AMBIENTE
const SUPABASE_URL = 'https://wolygamyyjgpoqsfefye.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbHlnYW15eWpncG9xc2ZlZnllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM1NTQ0OSwiZXhwIjoyMDkzOTMxNDQ5fQ.lrjXQbm_y6DkSA_2CsFsoFbdWoKZGpHUAvGGSEd79bY';

let name = "";
let description = "";

function unpack(obj) {
    console.log("DEBUG: Recebido para unpack:", JSON.stringify(obj));
    
    // 1. Tentar pegar do topo do objeto ou de .args (padrão de alguns agentes)
    let n = obj.name || (obj.args ? obj.args.name : null);
    let d = obj.description || (obj.args ? obj.args.description : null);

    // 2. Se não encontrou, e existe .input, tentar extrair de .input
    if ((!n || !d) && obj.input) {
        if (typeof obj.input === 'object') {
            n = n || obj.input.name;
            d = d || obj.input.description;
        } else if (typeof obj.input === 'string') {
            // Tentar JSON.parse
            try {
                const parsed = JSON.parse(obj.input);
                n = n || parsed.name;
                d = d || parsed.description;
            } catch (e) {
                // Tentar Regex para chave=valor ou chave:valor
                const nMatch = obj.input.match(/name[:=]\s*["']?([^"'\n,]+)["']?/i);
                const dMatch = obj.input.match(/description[:=]\s*["']?([\s\S]+?)(?=["']?\s*[}\n,]|active_preset_id|$)/i);
                if (nMatch && !n) n = nMatch[1].trim();
                if (dMatch && !d) d = dMatch[1].trim();
            }
        }
    }
    
    return { n, d };
}

const result = unpack($json);
name = (result.n || "").trim();
description = (result.d || "").trim();

try {
    // Tenta pegar dados do Webhook ou do input global
    const webhookNode = typeof $node !== 'undefined' && $node["Webhook"] ? $node["Webhook"] : null;
    const webhookData = webhookNode ? webhookNode.json : ($json.body || $json);
    
    const { active_preset_id, track, current_sessions } = webhookData;

    console.log(`DEBUG: name="${name}", description="${description}", preset="${active_preset_id}"`);

    if (!name || !description) {
        return `ERRO: Argumentos insuficientes. O Agente deve fornecer 'name' e 'description'. Recebido: name="${name}", description="${description}"`;
    }

    if (!active_preset_id || !current_sessions) {
        return `ERRO: Contexto ausente. active_preset_id ou current_sessions não encontrados no payload.`;
    }

    const fetchResponse = await fetch(`${SUPABASE_URL}/rest/v1/content_presets?id=eq.${active_preset_id}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });

    const basePresets = await fetchResponse.json();
    if (!basePresets || basePresets.length === 0) throw new Error("Preset original não encontrado.");

    const basePreset = basePresets[0];
    const finalSessions = basePreset.sessions.map(baseSession => {
        if (!baseSession.isEssential) {
            const updatedVersion = current_sessions.find(s => s.id === baseSession.id);
            return updatedVersion ? updatedVersion : baseSession;
        }
        return baseSession;
    });

    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/content_presets`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            name: name,
            description: description,
            track: track || basePreset.track,
            sessions: finalSessions,
            prompt: basePreset.prompt,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
    });

    const newData = await insertResponse.json();
    return `SUCESSO: Novo preset '${name}' criado com ID ${newData[0].id}.`;

} catch (error) {
    return `ERRO: ${error.message}`;
}