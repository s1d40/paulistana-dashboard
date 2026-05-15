import { NextResponse } from 'next/server';

export const maxDuration = 120; // Aumentado pois geração de roteiro complexo pode demorar

export async function POST(req: Request) {
  try {
    const { user_prompt, system_message, config, image_url, image_url_packaging } = await req.json();

    // URL do seu novo Worker_Roteirista Stateless no n8n
    const N8N_ROTEIRISTA_WEBHOOK = 'https://n8n.sfaisolutions.com/webhook/1a24782d-a935-454f-af0a-be3a57e42a32';

    const response = await fetch(N8N_ROTEIRISTA_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
      },
      body: JSON.stringify({
        user_prompt,
        system_message,
        image_url,
        image_url_packaging,
        config: config || { temperature: 0.7, model: "gpt-5.4" }
      }),
    });

    if (!response.ok) {
      throw new Error('Falha na comunicação com o Roteirista de IA no n8n.');
    }

    const script = await response.json();

    return NextResponse.json({ script });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('API Roteirista Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
