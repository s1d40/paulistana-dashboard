import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { items, my_product_id } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Nenhum concorrente selecionado' }, { status: 400 });
    }

    // Preparar os dados para inserção na tabela ml_watchlist
    const rowsToInsert = items.map((item: any) => ({
      product_id: item.id, // ID do anúncio no ML (ex: MLB12345)
      category_id: item.category_id || 'UNKNOWN',
      title: item.title,
      thumbnail: item.thumbnail,
      permalink: item.permalink,
      my_product_id: my_product_id || null // Qual é a referência interna
    }));

    // Inserir usando UPSERT (para não dar erro se o cara já estiver na lista)
    const { data, error } = await supabase
      .from('ml_watchlist')
      .upsert(rowsToInsert, { onConflict: 'product_id' })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: `${items.length} concorrentes adicionados à lista de vigia.`, data });

  } catch (error: any) {
    console.error("ML Watchlist API Error:", error);
    return NextResponse.json({ error: error.message || 'Falha ao adicionar na lista de vigia' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('ml_watchlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      // Agrupar IDs de 20 em 20 para a API do ML
      const chunkSize = 20;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const ids = chunk.map((d: any) => d.product_id).join(',');
        try {
          const mlRes = await fetch(`https://api.mercadolibre.com/items?ids=${ids}`);
          if (mlRes.ok) {
            const mlData = await mlRes.json();
            const priceMap = new Map();
            const sellerMap = new Map();
            mlData.forEach((item: any) => {
              if (item.body) {
                priceMap.set(item.body.id, item.body.price);
                sellerMap.set(item.body.id, item.body.seller_id);
              }
            });
            chunk.forEach((d: any) => {
              d.current_price = priceMap.get(d.product_id) || null;
              d.seller_id = sellerMap.get(d.product_id) || null;
            });
          }
        } catch (e) {
          console.error("Erro ao buscar preços do ML na Watchlist:", e);
        }
      }
    }

    return NextResponse.json({ results: data });
  } catch (error: any) {
    console.error("ML Watchlist GET API Error:", error);
    return NextResponse.json({ error: error.message || 'Falha ao carregar lista de vigia' }, { status: 500 });
  }
}
