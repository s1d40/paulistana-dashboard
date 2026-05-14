import { NextResponse } from 'next/server';

/**
 * API Route: Publicar Conteúdo
 * Integração com n8n para disparo em redes sociais
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, accountId, platform } = body;

    if (!postId || !accountId || !platform) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    console.log(`[API Publish] Solicitando publicação para post ${postId} na conta ${accountId} via ${platform}`);

    // Aqui integraria com o n8n ou serviço de fila
    // Exemplo de payload para n8n:
    /*
    const n8nRes = await fetch(process.env.N8N_PUBLISH_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, accountId, platform }),
    });
    */

    // Simulando delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({ 
      success: true, 
      message: `Solicitação de publicação enviada para ${platform}`,
      data: { postId, accountId, platform }
    });
  } catch (error) {
    console.error('[API Publish] Error:', error);
    return NextResponse.json({ error: 'Erro interno ao processar publicação' }, { status: 500 });
  }
}
