import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('q');

  if (!term) {
    return NextResponse.json({ error: 'Termo de busca é obrigatório' }, { status: 400 });
  }

  try {
    let mlToken = '';
    try {
      const scriptPath = path.join(process.cwd(), '../scripts/mercado_livre');
      mlToken = execSync('source venv/bin/activate && python print_token.py', { 
        cwd: scriptPath, 
        encoding: 'utf-8',
        stdio: 'pipe',
        shell: '/bin/bash'
      }).trim();
    } catch (tokenErr: any) {
      console.error("Erro ao obter ML Token:", tokenErr);
      return NextResponse.json({ error: 'Falha na autenticação com Mercado Livre' }, { status: 500 });
    }

    if (!mlToken) {
      return NextResponse.json({ error: 'Token ML não encontrado' }, { status: 500 });
    }

    const headers = { 'Authorization': `Bearer ${mlToken}` };
    
    // 1. Descobrir o SELLER_ID vinculado a este token
    const userRes = await fetch('https://api.mercadolibre.com/users/me', { headers });
    const userData = await userRes.json();
    const sellerId = userData.id;

    if (!sellerId) {
       return NextResponse.json({ error: 'Não foi possível identificar o usuário' }, { status: 500 });
    }

    // 2. Buscar os IDs dos anúncios ativos deste usuário filtrados pela palavra-chave
    const searchRes = await fetch(`https://api.mercadolibre.com/users/${sellerId}/items/search?status=active&q=${encodeURIComponent(term)}&limit=10`, { headers });
    const searchData = await searchRes.json();
    
    if (!searchData.results || searchData.results.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // 3. Buscar os detalhes desses itens (Título, Preço, Imagem)
    const itemsIds = searchData.results.join(',');
    const itemsRes = await fetch(`https://api.mercadolibre.com/items?ids=${itemsIds}`, { headers });
    const itemsData = await itemsRes.json();

    const formattedResults = itemsData.map((res: any) => {
      const item = res.body;
      return {
        id: item.id,
        title: item.title,
        price: item.price,
        permalink: item.permalink,
        thumbnail: item.thumbnail || item.secure_thumbnail,
        available_quantity: item.available_quantity,
        sold_quantity: item.sold_quantity
      };
    });

    return NextResponse.json({ results: formattedResults });

  } catch (error: any) {
    console.error("ML Spy My Items API Error:", error);
    return NextResponse.json({ error: error.message || 'Falha ao buscar itens do usuário' }, { status: 500 });
  }
}
