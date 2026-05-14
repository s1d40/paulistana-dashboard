import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json();

    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_CONTEUDO_URL || 'https://n8n.example.com/webhook/chat';

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
      },
      body: JSON.stringify({ message, sessionId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('N8N HTTP Error:', response.status, response.statusText, errorText);
      throw new Error(`Falha ao comunicar com o n8n: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('text/event-stream')) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const text = await response.text();
      return NextResponse.json({ response: text });
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ response: 'Desculpe, ocorreu um erro ao processar sua mensagem.' }, { status: 500 });
  }
}
