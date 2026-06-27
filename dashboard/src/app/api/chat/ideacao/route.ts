import { NextResponse } from 'next/server';

export const maxDuration = 120; // 2 minutos para geração

export async function POST(req: Request) {
  try {
    // Pegamos a requisição vinda do ChatPanel
    const body = await req.json();
    
    // O payload padrão do ChatPanel mapeia "message" -> user_prompt
    // Adicionamos a capacidade de injetar o preset_id e outras configs.
    const { message, sessionId, systemMessage, attachments, preset_id } = body;

    // Substitua pelo webhook oficial do seu Agente de Ideação no n8n
    const N8N_IDEATION_WEBHOOK = 'https://n8n.sfaisolutions.com/webhook/dc2fb4a9-cfd3-441b-a1b5-ff377fb77e0c';

    const payload = {
      action: 'chat',
      message: message,
      sessionId: sessionId,
      systemMessage: systemMessage,
      attachments: attachments || [],
      preset_id: preset_id
    };

    let response = await fetch(N8N_IDEATION_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    // SELF-HEALING LOGIC FOR 404 STATUS (deactivated or relocated n8n webhook)
    if (response.status === 404) {
      console.warn('[Ideação API] n8n webhook returned 404. Attempting self-healing...');
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
            // Find a workflow whose name contains "ideacao", "ideação", or "pauta"
            const targetWf = workflows.find((wf: any) => 
              wf.name.toLowerCase().includes("ideacao") || 
              wf.name.toLowerCase().includes("ideação") || 
              wf.name.toLowerCase().includes("pauta")
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
                      body: JSON.stringify(payload),
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
      throw new Error(`Falha na comunicação com o Agente de Ideação (Status: ${response.status})`);
    }

    // O ChatPanel aceita "output", "response", "message" ou "text"
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('API Ideação Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
