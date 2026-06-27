import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'paid'; // padrão: pagos
  
  const API_URL = process.env.NUVEMSHOP_API_BASE_URL;
  const API_TOKEN = process.env.NUVEMSHOP_API_TOKEN;

  if (!API_URL || !API_TOKEN) {
    return NextResponse.json({ error: 'Configuração da Nuvemshop ausente no .env' }, { status: 500 });
  }

  try {
    const res = await fetch(`${API_URL}/orders?status=${status}&per_page=50`, {
      headers: {
        'Authentication': `bearer ${API_TOKEN}`,
        'User-Agent': 'Cocreator Dashboard (suporte@sfaisolutions.com)',
        'Content-Type': 'application/json'
      },
      next: { revalidate: 60 } // cache de 1 minuto
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Nuvemshop API Error:', err);
      throw new Error(`Falha ao buscar pedidos da Nuvemshop: ${res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
