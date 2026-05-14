import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json({ error: 'Post ID é obrigatório' }, { status: 400 });
    }

    const N8N_APPROVE_WEBHOOK_URL = 'https://n8n.sfaisolutions.com/webhook/3d1f22e0-af2a-4733-89aa-b859586564f1';

    const response = await fetch(N8N_APPROVE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
      },
      body: JSON.stringify({ post_id: postId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('N8N Approve Error:', response.status, errorText);
      throw new Error(`Falha ao disparar aprovação no n8n: ${response.status}`);
    }

    return NextResponse.json({ message: 'Solicitação de aprovação enviada com sucesso!' });
  } catch (error) {
    console.error('Approve API Error:', error);
    return NextResponse.json({ error: 'Erro ao processar solicitação de aprovação.' }, { status: 500 });
  }
}
