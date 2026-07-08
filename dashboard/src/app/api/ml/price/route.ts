import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { execSync } from 'child_process';
import path from 'path';

// Função auxiliar para extrair o MLB ID de um link do Mercado Livre
function extractMlbId(urlOrId: string) {
  if (urlOrId.startsWith('MLB')) {
    // Se já vier no formato MLB123456 ou MLB-123456
    return urlOrId.replace('-', '');
  }
  
  // Se vier como URL: https://produto.mercadolivre.com.br/MLB-3623912061-mix-de-vegetais...
  const match = urlOrId.match(/MLB-?(\d+)/);
  if (match) {
    return `MLB${match[1]}`;
  }
  
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idOrUrl = searchParams.get('id');

    if (!idOrUrl) {
      return NextResponse.json(
        { error: 'Parâmetro "id" ou link do Mercado Livre não fornecido' },
        { status: 400 }
      );
    }

    const mlbId = extractMlbId(idOrUrl);
    if (!mlbId) {
      return NextResponse.json(
        { error: 'Não foi possível extrair um ID MLB válido (ex: MLB123456)' },
        { status: 400 }
      );
    }

    // 1. Obter o Token executando o script Python
    let mlToken = '';
    try {
      // O Next.js roda dentro de /dashboard, então voltamos uma pasta para acessar /scripts
      const scriptPath = path.join(process.cwd(), '../scripts/mercado_livre');
      
      mlToken = execSync('source venv/bin/activate && python print_token.py', { 
        cwd: scriptPath, 
        encoding: 'utf-8',
        shell: '/bin/bash'
      }).trim();

      if (!mlToken.startsWith('APP_USR-')) {
        throw new Error('Token retornado é inválido');
      }
    } catch (e) {
      console.error('Erro ao gerar token do Mercado Livre:', e);
      return NextResponse.json(
        { error: 'Falha na autenticação interna com o Mercado Livre' },
        { status: 500 }
      );
    }

    // 2. Fazer a consulta na API do ML
    const mlResponse = await fetch(`https://api.mercadolibre.com/items/${mlbId}`, {
      headers: {
        'Authorization': `Bearer ${mlToken}`
      },
      // Evitar cache agressivo do Next.js se quisermos preços em tempo real
      cache: 'no-store'
    });

    if (!mlResponse.ok) {
      return NextResponse.json(
        { error: `Erro na API do ML: ${mlResponse.statusText}` },
        { status: mlResponse.status }
      );
    }

    const mlData = await mlResponse.json();

    // 3. Retornar os dados formatados
    return NextResponse.json({
      success: true,
      data: {
        mlb_id: mlbId,
        title: mlData.title,
        price: mlData.price,
        original_price: mlData.original_price, // Caso esteja em promoção
        currency_id: mlData.currency_id,
        permalink: mlData.permalink,
        seller_id: mlData.seller_id
      }
    });

  } catch (error: any) {
    console.error('Erro na Rota ML Price:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
