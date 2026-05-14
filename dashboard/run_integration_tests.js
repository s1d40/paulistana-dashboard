const fetch = require('node-fetch');

const N8N_WEBHOOK = 'https://n8n.sfaisolutions.com/webhook/3a3f27a3-75a4-4b48-b961-945eda83539d';
const MOCK_UUID = '0c4a8956-1d2f-4bdf-b134-3ddea1a9275f';

async function runScenario(name, userMessage) {
    console.log(`\n🚀 EXECUTANDO CENÁRIO: ${name}`);
    console.log(`👤 USUÁRIO: "${userMessage}"`);

    const architectIdentity = `# AI COCREATOR: MASTER ARCHITECT (DNA)

## 1. SUA MISSÃO SUPREMA
Você é o Arquiteto Estratégico. Seu trabalho é conversar com o usuário para CONFIGURAR os cards do Cockpit.
Você é um consultor, um diretor, um estrategista. Você NÃO é um executor.

## 2. REGRAS DE OURO (NUNCA QUEBRE)
1. TEXTO SIMPLES APENAS: Suas respostas no chat devem ser APENAS texto direto ao usuário.
2. PROIBIDO JSON: Você está proibido de gerar blocos de código JSON na resposta ao usuário.
3. DADO OBRIGATÓRIO: Toda chamada de ferramenta DEVE incluir o 'active_preset_id' dentro de 'ai_params'.

## 3. FERRAMENTAS SÃO SEU BRAÇO
Use 'Worker_Supabase_Presets' para mudar o cockpit.
Exemplo de chamada correta:
{ "action": "update_session", "ai_params": { "active_preset_id": "${MOCK_UUID}", "session_id": "persona", "new_content": "..." } }`;

    const cockpitPreview = `# BANCADA DE TRABALHO (ESTRATÉGIA)
AVISO: Você é o Arquiteto. Sua única forma de resposta permitida é TEXTO SIMPLES.
Nunca use blocos de código JSON na sua resposta ao usuário.
---
## DIRETRIZES DE PRODUÇÃO ATUAIS:
### CARD: PERSONA E MISSÃO (ID: persona)
CONTEÚDO: (Vazio - Use update_session para preencher)
### CARD: ESTÉTICA VISUAL (ID: estetica)
CONTEÚDO: Prompts 100% em inglês. Formato 16:9 obrigatório.
### CARD: ARTE DA NARRAÇÃO (TTS) (ID: narracao)
CONTEÚDO: (Vazio - Use update_session para preencher)`;

    const fullSystemMessage = `${architectIdentity}\n\n[DADOS TÉCNICOS OBRIGATÓRIOS]\nID DO PRESET ATUAL: ${MOCK_UUID}\nSEMPRE use este ID acima no campo 'active_preset_id' da ferramenta.\n\n${cockpitPreview}`;

    const body = {
        message: userMessage,
        history: [],
        session_id: "test-integration-session",
        id_post: "test-integration-post",
        model: "models/gemini-3.1-pro-preview",
        system_message: fullSystemMessage,
        agent_config: {
            active_preset_id: MOCK_UUID,
            architect_model: "models/gemini-3.1-pro-preview"
        },
        system_context: {
            active_preset_id: MOCK_UUID,
            track: "video",
            instructions: `[SISTEMA: Você é o Arquiteto. Sua missão é povoar o Cockpit acima. ID do Preset: ${MOCK_UUID}]`
        }
    };

    try {
        const response = await fetch(N8N_WEBHOOK, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer RqsEZoRFwm6zW8Rs' // Token extraído dos logs
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            console.error(`❌ Erro na Request: ${response.status}`);
            return;
        }

        const data = await response.json();
        console.log(`✅ RESPOSTA DO AGENTE:`);
        console.log(JSON.stringify(data, null, 2));

        if (data.output && data.output.includes('Call')) {
            console.log(`🛠️ FERRAMENTA DETECTADA NO OUTPUT`);
        }
    } catch (err) {
        console.error(`💥 CRASH: ${err.message}`);
    }
}

async function startTests() {
    // CENÁRIO 1: Atualização de Persona
    await runScenario("CENÁRIO 1: Update Persona", "Ajuste a persona para um mestre cervejeiro artesanal, tom educativo e apaixonado.");

    // CENÁRIO 2: Atualização de Estética (Inglês)
    await runScenario("CENÁRIO 2: Update Estética", "Quero uma estética de pub rústico, luz de velas, close-ups de espuma de cerveja gelada, slow motion.");

    // CENÁRIO 3: Renomear Projeto
    await runScenario("CENÁRIO 3: Renomear Projeto", "Gostei. Renomeie este projeto para 'Mestres da Malte'.");
}

startTests();
