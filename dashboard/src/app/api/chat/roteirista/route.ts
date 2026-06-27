import { NextResponse } from 'next/server';

export const maxDuration = 120; // Aumentado pois geração de roteiro complexo pode demorar

export async function POST(req: Request) {
  try {
    const { user_prompt, system_message, config, image_url, image_url_packaging } = await req.json();

    // URL do seu novo Worker_Roteirista Stateless no n8n
    const N8N_ROTEIRISTA_WEBHOOK = 'https://n8n.sfaisolutions.com/webhook/1a24782d-a935-454f-af0a-be3a57e42a32';

    const payloadBody = {
      user_prompt,
      system_message,
      image_url,
      image_url_packaging,
      config: config || { temperature: 0.7, model: "gpt-5.4" }
    };

    let response = await fetch(N8N_ROTEIRISTA_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
      },
      body: JSON.stringify(payloadBody),
    });

    // SELF-HEALING LOGIC FOR 404 STATUS (deactivated or relocated n8n webhook)
    if (response.status === 404) {
      console.warn('[Roteirista API] n8n webhook returned 404. Attempting self-healing...');
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
            // Find a workflow whose name contains "roteirista", "roteiro", or "script"
            const targetWf = workflows.find((wf: any) => 
              wf.name.toLowerCase().includes("roteirista") || 
              wf.name.toLowerCase().includes("roteiro") || 
              wf.name.toLowerCase().includes("script")
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
      throw new Error(`Falha n8n (Status ${response.status}): ${errorText}`);
    }

    const rawText = await response.text();
    let scriptData: any = rawText;
    
    // Tenta limpar blocos markdown e converter pra objeto caso a IA tenha retornado como string bruta
    const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    try {
      scriptData = JSON.parse(cleanedText);
    } catch (e) {
      // Se não for JSON, mantém como texto limpo
      scriptData = cleanedText;
    }

    return NextResponse.json({ script: scriptData });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('API Roteirista Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
