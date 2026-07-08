import { NextResponse } from 'next/server';
import { fetchProducts } from '@/services/supabase-service';

export const maxDuration = 60; // Aumentado para dar tempo do n8n acionar tools

export async function POST(req: Request) {
  try {
    const { 
      messages, 
      track, 
      active_preset_id, 
      current_sessions, 
      session_id,
      prompt, // Scriptwriter Global Prompt
      model,  // Scriptwriter Model
      temperature,
      architect_model, // Novo: Modelo do Arquiteto (UI Sidebar)
      architect_prompt, // Novo: DNA do Arquiteto (UI Sidebar)
      use_real_products // Novo: Flag para usar slugs de produtos reais
    } = await req.json();

    // 0. FETCH PRODUCTS IF NEEDED
    let productsContext = '';
    if (use_real_products) {
      const products = await fetchProducts();
      productsContext = [
        `## BANCO DE PRODUTOS (REFERÊNCIAS REAIS)`,
        `Você tem acesso aos slugs das embalagens e imagens reais dos produtos.`,
        `Ao configurar as cenas, se 'Produtos Reais' estiver ativo, você DEVE instruir o Roteirista a usar o campo 'slug_produto'.`,
        `---`,
        ...products.map(p => `- PRODUTO: ${p.Produto} | SLUG: ${p.slug_embalagem}`)
      ].join('\n');
    }

    // URL do seu novo Worker_Director no n8n (Agente Arquiteto)
    const N8N_DIRECTOR_WEBHOOK = 'https://n8n.sfaisolutions.com/webhook/3a3f27a3-75a4-4b48-b961-945eda83539d';

    // 1. DEFINIR A IDENTIDADE DO ARQUITETO (Priorizar o que vem da Sidebar)
    const architectIdentity = architect_prompt || `
# IDENTIDADE TÉCNICA
Você é um Agente de Configuração. Seu objetivo é coletar requisitos e atualizar os campos técnicos via ferramentas.

[ESPECIFICAÇÕES OBRIGATÓRIAS]
ID DA CONFIGURAÇÃO (PK): ${active_preset_id}

[SUAS FERRAMENTAS]
1. 'Atualizar_Card': Para atualizar o texto/conteúdo de uma sessão (card) JÁ EXISTENTE na Bancada de Trabalho.
2. 'Ajustar_Parametros_Globais': Para modelo de IA e temperatura.
3. 'Salvar_Novo_Preset': Para criar templates.
4. 'Gerenciar_Sessoes_Customizadas': Para CRIAR novas sessões/cards ou remover sessões existentes.

[FLUXO E ORDEM DE EXECUÇÃO DAS FERRAMENTAS - CRÍTICO]
Você DEVE SEMPRE executar as ferramentas ANTES de responder ao usuário por texto. Sua resposta deve ser apenas uma confirmação técnica do que foi feito.

Regras de Ouro:
1. Se o usuário pedir algo NOVO (ex: "adicione uma CTA", "crie uma aba de hashtags", "adicione uma restrição"):
   - 1º PASSO: Use 'Gerenciar_Sessoes_Customizadas' com ação 'create' para criar o card.
   - 2º PASSO: Use 'Atualizar_Card' para preencher o conteúdo.
2. Se o usuário pedir para alterar algo que já está visível na Bancada:
   - Use 'Atualizar_Card' diretamente.

[REGRAS DE RESPOSTA]
- Nunca diga "vou fazer", faça e diga "feito".
- Proibido gerar roteiros ou JSON no chat.
- Sua resposta deve ser curta e objetiva.
- Utilize o UUID ${active_preset_id} em todas as chamadas.
    `.trim();

    interface Session {
      id: string;
      title: string;
      content: string | null;
    }

    // 2. ESTADO ATUAL DO TRABALHO (VIRTUAL WORKBENCH)
    // Filtramos cards técnicos para não confundir o Arquiteto
    const strategicSessions = (current_sessions as Session[]).filter((s) => 
      !['template', 'framework'].includes(s.id)
    );

const cockpitPreview = [
  `# BANCADA DE TRABALHO (ESTRATÉGIA)`,
  `AVISO: Você é o Arquiteto. Sua única forma de resposta permitida é TEXTO SIMPLES.`,
  `Nunca use blocos de código JSON na sua resposta ao usuário.`,
  `---`,
  `## DIRETRIZES DE PRODUÇÃO ATUAIS:`,
  ...strategicSessions.map((s) => `### CARD: ${s.title.toUpperCase()} (ID: ${s.id})\nCONTEÚDO: ${s.content || '(Vazio - Use update_session para preencher)'}`),
  productsContext
].join('\n\n');

    // 3. MERGE FINAL MASTIGADO
    const fullSystemMessage = `${architectIdentity}\n\n${cockpitPreview}`;

    // 4. Preparar o pacote de configuração completo para o n8n
    const agentConfig = {
      id_post: session_id,
      active_preset_id: active_preset_id,
      architect_model: architect_model || 'gemini 3.1 pro',
      scriptwriter_config: {
        model: model || 'gpt5.4',
        temperature: temperature ?? 0.7,
        global_prompt: prompt,
        use_real_products: !!use_real_products
      },
      track: track,
      sessions_snapshot: current_sessions
    };

    const payloadBody = {
      message: messages[messages.length - 1].content,
      history: messages.slice(0, -1),
      session_id: session_id,
      id_post: session_id,
      // Enviar o modelo do arquiteto para o n8n mapear no nó da IA
      model: architect_model || 'gemini 3.1 pro', 
      system_message: fullSystemMessage, 
      agent_config: agentConfig,
      system_context: {
        id_post: session_id,
        active_preset_id: active_preset_id,
        track: track,
        instructions: `[SISTEMA: Você é o Arquiteto. Sua missão é povoar o Cockpit acima. ID do Preset: ${active_preset_id}]`
      }
    };

    let response = await fetch(N8N_DIRECTOR_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
      },
      body: JSON.stringify(payloadBody),
    });

    // SELF-HEALING LOGIC FOR 404 STATUS (deactivated or relocated n8n webhook)
    if (response.status === 404) {
      console.warn('[Director API] n8n webhook returned 404. Attempting self-healing...');
      const API_KEY = process.env.N8N_API_TOKEN || 'RqsEZoRFwm6zW8Rs';
      const BASE_URL = 'https://n8n.sfaisolutions.com/api/v1';
      
      try {
        const listRes = await fetch(`${BASE_URL}/workflows`, {
          headers: {
            'X-N8N-API-KEY': API_KEY,
            'Accept': 'application/json'
          }
        });

        if (listRes.ok) {
          const listData = await listRes.json();
          const workflows = listData.data;
          
          if (workflows && Array.isArray(workflows)) {
            // Find a workflow whose name contains "Director", "Arquiteto", or "Roteiro"
            const targetWf = workflows.find((wf: any) => 
              wf.name.toLowerCase().includes("director") || 
              wf.name.toLowerCase().includes("arquiteto") || 
              wf.name.toLowerCase().includes("roteiro")
            );

            if (targetWf) {
              console.log(`[Self-Heal] Found matching workflow: "${targetWf.name}" (ID: ${targetWf.id}, Active: ${targetWf.active})`);

              // Fetch details to extract webhook UUID
              const detailsRes = await fetch(`${BASE_URL}/workflows/${targetWf.id}`, {
                headers: {
                  'X-N8N-API-KEY': API_KEY,
                  'Accept': 'application/json'
                }
              });

              if (detailsRes.ok) {
                const wfDetails = await detailsRes.json();
                const webhookNode = wfDetails.nodes?.find((n: any) => n.type === 'n8n-nodes-base.webhook');

                if (webhookNode) {
                  const webhookId = webhookNode.webhookId;
                  const customPath = webhookNode.parameters?.path;
                  const finalPath = customPath || webhookId;

                  if (finalPath) {
                    const dynamicWebhookUrl = `https://n8n.sfaisolutions.com/webhook/${finalPath}`;
                    console.log(`[Self-Heal] Discovered webhook URL: ${dynamicWebhookUrl}`);

                    // If workflow is inactive, activate it
                    if (!targetWf.active) {
                      console.log(`[Self-Heal] Workflow is inactive. Attempting to activate...`);
                      const activateRes = await fetch(`${BASE_URL}/workflows/${targetWf.id}/activate`, {
                        method: 'POST',
                        headers: {
                          'X-N8N-API-KEY': API_KEY,
                          'Accept': 'application/json'
                        }
                      });

                      if (activateRes.ok) {
                        console.log('[Self-Heal] Successfully activated workflow via POST /activate');
                      } else {
                        // Alternate PATCH activation
                        const patchRes = await fetch(`${BASE_URL}/workflows/${targetWf.id}`, {
                          method: 'PATCH',
                          headers: {
                            'X-N8N-API-KEY': API_KEY,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                          },
                          body: JSON.stringify({ active: true })
                        });
                        if (patchRes.ok) {
                          console.log('[Self-Heal] Successfully activated workflow via PATCH');
                        }
                      }
                      
                      // Wait brief moment for n8n's routing table reload
                      await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    // Retry original webhook call
                    console.log(`[Self-Heal] Retrying original call to newly discovered URL: ${dynamicWebhookUrl}`);
                    const retryRes = await fetch(dynamicWebhookUrl, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
                      },
                      body: JSON.stringify(payloadBody),
                    });

                    if (retryRes.ok) {
                      console.log('[Self-Heal] Retry succeeded! Restored communication.');
                      response = retryRes;
                    } else {
                      console.error(`[Self-Heal] Retry failed with status ${retryRes.status}`);
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('[Self-Heal] Error in self-healing routine:', err);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Director API] n8n failed with status:', response.status, 'body:', errorText);
      throw new Error(`Falha na comunicação com o Cocreator Intelligence no n8n. Status: ${response.status}`);
    }

    const data = await response.json();
    let parsedData = data;
    if (typeof data === 'string') {
      try { parsedData = JSON.parse(data); } catch(e) {}
    }
    
    console.log('[Director API] n8n Response:', JSON.stringify(parsedData, null, 2));

    // Se o n8n retornar um roteiro (identificado pela presença de 'tipo_post')
    if (parsedData.tipo_post) {
      return NextResponse.json({ 
        tool_call: 'generate_script', 
        script: parsedData 
      });
    }

    // Caso contrário, retorna a mensagem de texto normal do chat
    return NextResponse.json({ 
      role: 'assistant', 
      content: parsedData.output || parsedData.message || (typeof data === 'string' ? data : 'Desculpe, não consegui processar sua solicitação.')
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Chat Director Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
