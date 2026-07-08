import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const { id_post, tema_post, user_prompt, system_message } = await req.json();

    const finalUserPrompt = user_prompt || `Crie uma legenda chamativa para o vídeo sobre: ${tema_post}`;
    
    // URL do Webhook do n8n para gerar legendas
    const N8N_LEGENDA_WEBHOOK = 'https://n8n.sfaisolutions.com/webhook/b65906d4-5c3b-4e56-904c-e67575aa1b76';

    const payloadBody = {
      id_post: id_post,
      tema_post: tema_post,
      user_prompt: finalUserPrompt,
      system_message: system_message || "",
    };

    let response = await fetch(N8N_LEGENDA_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
      },
      body: JSON.stringify(payloadBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha n8n Legenda (Status ${response.status}): ${errorText}`);
    }

    const rawText = await response.text();
    let data: any = rawText;
    
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      data = { text: rawText };
    }

    return NextResponse.json({ success: true, data });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('API Legenda Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
