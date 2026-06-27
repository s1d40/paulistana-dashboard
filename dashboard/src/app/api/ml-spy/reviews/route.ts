import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('item_id');
  if (!itemId) return NextResponse.json({ error: 'Missing item_id' }, { status: 400 });

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
    } catch (e) {
      console.warn("Could not get token for reviews");
    }

    const headers: Record<string, string> = {};
    if (mlToken) {
      headers['Authorization'] = `Bearer ${mlToken}`;
    }

    // Tentar descobrir o catalog_product_id
    let reviewTargetId = itemId;
    try {
      const itemRes = await fetch(`https://api.mercadolibre.com/items/${itemId}`, { headers });
      const itemData = await itemRes.json();
      if (itemData.catalog_product_id) {
        reviewTargetId = itemData.catalog_product_id;
      }
    } catch(e) {
      // continua usando itemId original
    }

    const res = await fetch(`https://api.mercadolibre.com/reviews/item/${reviewTargetId}`, { headers });
    if (!res.ok) throw new Error('Falha ao buscar reviews do Mercado Livre');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
