import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// Mapeamento de rotas base para APIs externas
const API_ROUTES = {
  n8n: process.env.N8N_API_BASE_URL || 'https://n8n.example.com/webhook',
  nuvemshop: process.env.NUVEMSHOP_API_BASE_URL || 'https://api.nuvemshop.com.br/v1',
  ga: process.env.GA_API_BASE_URL || 'https://analyticsdata.googleapis.com/v1beta',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Apenas GET é permitido neste proxy (conforme requisito)
  // O Next.js já bloqueia outros métodos se não exportarmos POST, PUT, etc.
  // Mas para ser explícito e garantir a regra:
  if (request.method !== 'GET') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
  }

  const resolvedParams = await params;
  const pathArray = resolvedParams.path;
  
  if (!pathArray || pathArray.length < 2) {
    return NextResponse.json({ error: 'Bad Request: Invalid proxy path' }, { status: 400 });
  }

  const [service, ...restPath] = pathArray;
  const targetPath = restPath.join('/');

  let targetUrl = '';
  const headers = new Headers();

  // Verifica a sessão para proteger a rota (opcional, dependendo do caso de uso)
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
  }

  // Identifica o serviço destino e injeta tokens correspondentes
  if (service === 'n8n') {
    targetUrl = `${API_ROUTES.n8n}/${targetPath}`;
    headers.set('Authorization', `Bearer ${process.env.N8N_API_TOKEN}`);
  } else if (service === 'nuvemshop') {
    targetUrl = `${API_ROUTES.nuvemshop}/${targetPath}`;
    headers.set('Authentication', `bearer ${process.env.NUVEMSHOP_API_TOKEN}`);
    headers.set('User-Agent', 'Dashboard-BFF');
  } else if (service === 'ga') {
    targetUrl = `${API_ROUTES.ga}/${targetPath}`;
    headers.set('Authorization', `Bearer ${process.env.GA_API_TOKEN}`);
  } else {
    return NextResponse.json({ error: 'Service Not Found' }, { status: 404 });
  }

  // Repassa a query string, se houver
  const searchParams = request.nextUrl.search;
  const fullTargetUrl = `${targetUrl}${searchParams}`;

  try {
    const response = await fetch(fullTargetUrl, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('BFF Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Rejeitar categoricamente qualquer outro método (POST, PUT, DELETE, etc)
export async function POST() { return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 }); }
export async function PUT() { return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 }); }
export async function DELETE() { return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 }); }
export async function PATCH() { return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 }); }
