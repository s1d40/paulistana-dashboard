/**
 * TOOL: update_supabase_preset (Versão FINAL com Chaves Fixas)
 */

console.log("=== INICIANDO TOOL: update_supabase_preset ===");

// CHAVES FIXAS PARA EVITAR ERRO DE AMBIENTE
const SUPABASE_URL = 'https://wolygamyyjgpoqsfefye.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbHlnYW15eWpncG9xc2ZlZnllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM1NTQ0OSwiZXhwIjoyMDkzOTMxNDQ5fQ.lrjXQbm_y6DkSA_2CsFsoFbdWoKZGpHUAvGGSEd79bY';

let session_id = "";
let new_content = "";

function unpack(obj) {
    console.log("DEBUG: Recebido para unpack:", JSON.stringify(obj));
    
    // 1. Tentar pegar do topo do objeto ou de .args (padrão de alguns agentes)
    let sid = obj.session_id || (obj.args ? obj.args.session_id : null);
    let cont = obj.new_content || (obj.args ? obj.args.new_content : null);

    // 2. Se não encontrou, e existe .input, tentar extrair de .input
    if ((!sid || !cont) && obj.input) {
        if (typeof obj.input === 'object') {
            sid = sid || obj.input.session_id;
            cont = cont || obj.input.new_content;
        } else if (typeof obj.input === 'string') {
            // Tentar JSON.parse
            try {
                const parsed = JSON.parse(obj.input);
                sid = sid || parsed.session_id;
                cont = cont || parsed.new_content;
            } catch (e) {
                // Tentar Regex para chave=valor ou chave:valor
                const sMatch = obj.input.match(/session_id[:=]\s*["']?([^"'\s,]+)["']?/i);
                const cMatch = obj.input.match(/new_content[:=]\s*["']?([\s\S]+?)(?=["']?\s*[}\n,]|active_preset_id|$)/i);
                if (sMatch && !sid) sid = sMatch[1].trim();
                if (cMatch && !cont) cont = cMatch[1].trim();
            }
        }
    }
    
    return { sid, cont };
}

const result = unpack($json);
session_id = (result.sid || "").trim();
new_content = (result.cont || "").trim();

try {
    // Tenta pegar dados do Webhook ou do input global
    const webhookNode = typeof $node !== 'undefined' && $node["Webhook"] ? $node["Webhook"] : null;
    const webhookData = webhookNode ? webhookNode.json : ($json.body || $json);
    
    const active_preset_id = webhookData.active_preset_id;

    console.log(`DEBUG: session_id="${session_id}", preset="${active_preset_id}"`);

    if (!session_id || !new_content) {
        return `ERRO: Argumentos insuficientes. O Agente deve fornecer 'session_id' e 'new_content'. Recebido: session_id="${session_id}"`;
    }

    if (!active_preset_id) {
        return `ERRO: Contexto ausente. active_preset_id não encontrado no payload.`;
    }

    const fetchResponse = await fetch(`${SUPABASE_URL}/rest/v1/content_presets?id=eq.${active_preset_id}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });

    const presets = await fetchResponse.json();
    if (!presets || presets.length === 0) return "ERRO: Preset não encontrado.";

    const currentPreset = presets[0];
    let sessionFound = false;

    const updatedSessions = currentPreset.sessions.map(session => {
        if (session.id === session_id) {
            sessionFound = true;
            if (session.isEssential === true && session.isEditable === false) {
                throw new Error(`A sessão [${session.title}] é estrutural e inviolável. Você não tem permissão para alterá-la.`);
            }
            return { ...session, content: new_content };
        }
        return session;
    });

    if (!sessionFound) return `ERRO: Sessão [${session_id}] não existe.`;

    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/content_presets?id=eq.${active_preset_id}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessions: updatedSessions, updated_at: new Date().toISOString() })
    });

    if (!updateResponse.ok) return `ERRO: Falha no Supabase (${updateResponse.statusText})`;

    return `SUCESSO: Sessão [${session_id}] atualizada.`;

} catch (error) {
    return `ERRO: ${error.message}`;
}