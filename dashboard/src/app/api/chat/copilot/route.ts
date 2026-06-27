import { NextResponse } from 'next/server';

const N8N_STUDIO_COPILOT_WEBHOOK = 'https://n8n.sfaisolutions.com/webhook/620f72c7-bace-4839-a31c-abbf7aaf94eb';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, current_script, id_post } = body;

    if (!id_post) {
      return NextResponse.json({ error: 'id_post ausente.' }, { status: 400 });
    }

    // Pre-formatting everything for n8n to minimize logic there
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || '';
    
    const system_message = `Você é o Agente Inteligente do Estúdio de Vídeo (Studio Copilot).
Sua missão é ajudar o usuário a refinar o roteiro do vídeo que está na bancada de trabalho.

ID DO POST: ${id_post}

ESTADO ATUAL DO SCRIPT (Timeline):
${JSON.stringify(current_script, null, 2)}

DIRETRIZES:
1. Analise o pedido do usuário e modifique o 'ESTADO ATUAL DO SCRIPT' de acordo (inserindo, removendo ou alterando cenas, textos e prompts).
2. Você DEVE retornar EXCLUSIVAMENTE um objeto JSON válido contendo duas chaves:
   - "updated_script": O JSON completo do script modificado (preservando tipo_post, tema, etc).
   - "message": Uma mensagem curta e amigável confirmando o que você fez.
3. Não utilize ferramentas e não retorne nenhum outro texto fora do formato JSON.`;

    const payloadBody = { 
      id_post,
      session_id: id_post, // Standardizing for Postgres Chat Memory
      system_message,
      prompt: lastUserMessage,
      current_script,
      action: 'studio_copilot_chat'
    };

    let response = await fetch(N8N_STUDIO_COPILOT_WEBHOOK, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`
      },
      body: JSON.stringify(payloadBody),
    });

    // SELF-HEALING LOGIC FOR 404 STATUS (deactivated or relocated n8n webhook)
    if (response.status === 404) {
      console.warn('[Copilot API] n8n webhook returned 404. Attempting self-healing...');
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
            // Find a workflow whose name contains "copilot", "studio", or "video"
            const targetWf = workflows.find((wf: any) => 
              wf.name.toLowerCase().includes("copilot") || 
              wf.name.toLowerCase().includes("studio") || 
              wf.name.toLowerCase().includes("video")
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
      throw new Error(`Erro no n8n: ${response.statusText}`);
    }

    const rawText = await response.text();
    let data;

    // Função auxiliar para limpar markdown ```json ... ``` do output
    const sanitizeJsonString = (str: string) => {
      let cleaned = str.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/i, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '');
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.replace(/\s*```$/, '');
      }
      return cleaned.trim();
    };

    try {
      // Primeiro tenta parsear o raw text normal (caso o n8n mande JSON puro ou Text válido)
      data = JSON.parse(rawText);
    } catch (err) {
      // Se falhar (ex: texto sujo com markdown enviado pelo n8n), tenta sanitizar e parsear
      try {
        const cleanString = sanitizeJsonString(rawText);
        data = JSON.parse(cleanString);
      } catch (err2) {
        throw new Error(`O n8n retornou uma resposta que não pôde ser lida como JSON nem após sanitização: ${rawText.substring(0, 100)}...`);
      }
    }

    // Se a resposta vier no formato padrão de array de Agente do n8n: [{ output: "{...}" }]
    if (Array.isArray(data) && data.length > 0 && data[0].output && typeof data[0].output === 'string') {
      try {
        const cleanString = sanitizeJsonString(data[0].output);
        data = JSON.parse(cleanString);
      } catch (e) {
        console.error("Failed to parse n8n agent output array as JSON:", e);
      }
    } else if (data.output && typeof data.output === 'string') {
      try {
        const cleanString = sanitizeJsonString(data.output);
        data = JSON.parse(cleanString);
      } catch (e) {
        console.error("Failed to parse n8n agent output object as JSON:", e);
      }
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('[Copilot API] Error:', error);
    return NextResponse.json({ error: 'Falha ao processar comando do Copilot.' }, { status: 500 });
  }
}
