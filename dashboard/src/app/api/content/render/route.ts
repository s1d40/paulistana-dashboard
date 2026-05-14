import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json({ error: 'Post ID é obrigatório' }, { status: 400 });
    }

    // Webhook placeholder para disparar o Render de Vídeo (video_maker.py no servidor)
    const N8N_RENDER_WEBHOOK_URL = 'https://n8n.sfaisolutions.com/webhook/render-video-placeholder';

    const response = await fetch(N8N_RENDER_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
      },
      body: JSON.stringify({ post_id: postId, action: 'render_full_video' }),
    });

    if (!response.ok) {
      throw new Error(`Falha ao disparar render no n8n: ${response.status}`);
    }

    return NextResponse.json({ message: 'Renderização iniciada! O vídeo aparecerá na biblioteca em breve.' });
  } catch (error) {
    console.error('Render API Error:', error);
    return NextResponse.json({ error: 'Erro ao iniciar renderização.' }, { status: 500 });
  }
}
