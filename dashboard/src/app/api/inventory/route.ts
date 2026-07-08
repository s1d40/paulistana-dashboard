import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();

  try {
    // 1. Fetch distinct titles to group platforms by title 
    // In a real database we'd do a GROUP BY, but let's fetch all and group in memory since it's a manageable size.
    const { data: plataformas, error: platError } = await supabase
      .from('produtos_plataformas')
      .select('id, title, price, thumbnail, platform, slug_imagem_real, slug_embalagem, permalink')
      .order('title', { ascending: true });

    if (platError) {
      console.error("Error fetching platforms:", platError);
      return NextResponse.json({ error: platError.message }, { status: 500 });
    }

    // Agrupar por 'title' normalizado (ou slug_imagem_real)
    const grouped = new Map<string, any>();

    plataformas?.forEach((p) => {
      // Usa slug_imagem_real se existir para agrupar, senao usa titulo normalizado
      const key = p.slug_imagem_real || p.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          title: p.title,
          slug_imagem_real: p.slug_imagem_real,
          slug_embalagem: p.slug_embalagem,
          thumbnail: p.thumbnail, // thumbnail base
          platforms: {},
          prices: []
        });
      }
      
      const group = grouped.get(key);
      group.platforms[p.platform] = {
        price: p.price,
        permalink: p.permalink
      };
      
      if (p.price && p.price > 0) {
        group.prices.push(Number(p.price));
      }
      
      // Update thumbnail if not set
      if (!group.thumbnail && p.thumbnail) {
        group.thumbnail = p.thumbnail;
      }
    });

    const inventoryArray = Array.from(grouped.values()).map(item => ({
      ...item,
      avgPrice: item.prices.length > 0 ? (item.prices.reduce((a:number,b:number)=>a+b,0) / item.prices.length) : 0
    }));

    return NextResponse.json(inventoryArray);

  } catch (err: any) {
    console.error("Inventory API Exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
