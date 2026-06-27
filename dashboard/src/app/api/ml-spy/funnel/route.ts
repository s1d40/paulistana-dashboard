import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function GET() {
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
      console.warn("Sem token ML para funil.");
    }

    if (!mlToken) {
      return NextResponse.json({ error: 'Token ML não configurado' }, { status: 500 });
    }

    const headers = { 'Authorization': `Bearer ${mlToken}` };
    const ANDRE_SELLER_ID = 428354884;

    // Busca os top 50 itens ativos
    const searchRes = await fetch(`https://api.mercadolibre.com/users/${ANDRE_SELLER_ID}/items/search?status=active&limit=50`, { headers });
    const searchData = await searchRes.json();
    const itemIds = searchData.results || [];

    if (itemIds.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Busca os detalhes dos itens
    const itemsRes = await fetch(`https://api.mercadolibre.com/items?ids=${itemIds.slice(0, 50).join(',')}`, { headers });
    const itemsData = await itemsRes.json();

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];

    const results: any[] = [];

    // Busca visitas em lotes para não estourar o limite (máx 5 em paralelo)
    for (let i = 0; i < itemsData.length; i += 5) {
      const batch = itemsData.slice(i, i + 5);
      const batchPromises = batch.map(async (resObj: any) => {
        const item = resObj.body;
        if (!item) return null;

        let visits = 0;
        try {
          const vRes = await fetch(`https://api.mercadolibre.com/items/${item.id}/visits?date_from=${startDate}&date_to=${endDate}`, { headers });
          if (vRes.ok) {
            const vData = await vRes.json();
            visits = vData.total_visits || 0;
          }
        } catch(e) {}

        let health = 100;
        try {
          const hRes = await fetch(`https://api.mercadolibre.com/items/${item.id}/health`, { headers });
          if (hRes.ok) {
            const hData = await hRes.json();
            health = Math.round(hData.health * 100);
          }
        } catch(e) {}

        return {
          id: item.id,
          title: item.title,
          price: item.price,
          thumbnail: item.secure_thumbnail || item.thumbnail,
          permalink: item.permalink,
          sold_quantity: item.sold_quantity,
          visits_30d: visits,
          health: health,
          // CR = Vendas totais / Visitas (Aproximação pra rankear piores)
          conversion_score: visits > 0 ? (item.sold_quantity / visits) * 100 : 0
        };
      });

      const resolved = await Promise.all(batchPromises);
      resolved.forEach(r => { if (r) results.push(r); });
    }

    // Ordena do pior conversor (mais visitas, menos vendas) pro melhor
    // Fórmula: visits_30d alto mas sold_quantity baixo -> baixa conversão
    results.sort((a, b) => a.conversion_score - b.conversion_score);

    return NextResponse.json({ results });

  } catch (error: any) {
    console.error("Erro no funil:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
