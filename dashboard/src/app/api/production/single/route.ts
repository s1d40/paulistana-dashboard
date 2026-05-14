import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { productName } = await req.json();

    if (!productName) {
      return NextResponse.json({ error: 'Nome do produto é obrigatório' }, { status: 400 });
    }

    // Webhook placeholder para disparar a geração de roteiro para um produto específico
    const N8N_SINGLE_PROD_WEBHOOK_URL = 'https://n8n.sfaisolutions.com/webhook/single-product-production-placeholder';

    const response = await fetch(N8N_SINGLE_PROD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
      },
      body: JSON.stringify({ product: productName, action: 'generate_script' }),
    });

    if (!response.ok) {
      throw new Error(`Falha ao disparar geração no n8n: ${response.status}`);
    }

    return NextResponse.json({ message: `Criação para "${productName}" iniciada! O roteiro aparecerá no chat em breve.` });
  } catch (error) {
    console.error('Single Production API Error:', error);
    return NextResponse.json({ error: 'Erro ao iniciar geração para o produto.' }, { status: 500 });
  }
}
