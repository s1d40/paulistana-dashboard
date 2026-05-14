import { NextResponse } from 'next/server';

const N8N_AUDIO_PRODUCTION_WEBHOOK = 'https://n8n.sfaisolutions.com/webhook/fa8faa6a-cd80-42c8-a591-de5ab1312bc9';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id_post, chat_id, cenas } = body;

    if (!id_post || !cenas) {
      return NextResponse.json({ error: 'Dados incompletos para geração de áudio.' }, { status: 400 });
    }

    const response = await fetch(N8N_AUDIO_PRODUCTION_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
      },
      body: JSON.stringify({
        id_post,
        chat_id: chat_id || 1481670558, // Fallback para chat padrão
        cenas
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro no n8n: ${response.statusText}`);
    }

    return NextResponse.json({ success: true, message: 'Processamento de áudio iniciado.' });
  } catch (error: unknown) {
    console.error('Erro na rota de áudio:', error);
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
