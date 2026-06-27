import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mlb = searchParams.get('mlb');

    if (!mlb) {
      return NextResponse.json({ error: 'MLB is required' }, { status: 400 });
    }

    // Pega o token executando o script python
    let mlToken;
    try {
      // Como o dashboard roda via pm2 ou local, o caminho pro script precisa ser relativo a raiz do projeto
      const scriptPath = path.join(process.cwd(), '../scripts/mercado_livre');
      mlToken = execSync('source venv/bin/activate && python print_token.py', { 
        cwd: scriptPath, 
        encoding: 'utf-8', 
        shell: '/bin/bash' 
      }).trim();
    } catch (e: any) {
      console.error('Erro ao pegar token ML:', e);
      return NextResponse.json({ error: 'Erro de autenticação local no ML' }, { status: 500 });
    }

    // Chama a API do Mercado Livre
    const res = await fetch(`https://api.mercadolibre.com/items/${mlb}`, {
      headers: { 'Authorization': `Bearer ${mlToken}` }
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Erro na API do ML: ${res.status} ${err}` }, { status: res.status });
    }

    const data = await res.json();
    
    // Podemos pegar o nickname do vendedor fazendo outra request para /users/:id se precisarmos
    let sellerName = 'Desconhecido';
    if (data.seller_id) {
      try {
        const sellerRes = await fetch(`https://api.mercadolibre.com/users/${data.seller_id}`, {
          headers: { 'Authorization': `Bearer ${mlToken}` }
        });
        if (sellerRes.ok) {
          const sellerData = await sellerRes.json();
          sellerName = sellerData.nickname;
        }
      } catch (e) {}
    }

    return NextResponse.json({
      title: data.title,
      price: data.price,
      permalink: data.permalink,
      thumbnail: data.thumbnail,
      seller_name: sellerName
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
