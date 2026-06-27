import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  if (!category) {
    return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
  }

  try {
    // Buscar o histórico da categoria
    const { data, error } = await supabase
      .from('ml_competitor_history')
      .select('*')
      .eq('category_id', category)
      .order('snapshot_date', { ascending: true });

    if (error) {
      throw error;
    }

    // Agrupar por product_id para facilitar o gráfico no frontend (Recharts)
    const historyByProduct: Record<string, any> = {};
    
    data.forEach((row) => {
      if (!historyByProduct[row.product_id]) {
        historyByProduct[row.product_id] = {
          product_id: row.product_id,
          title: row.title,
          thumbnail: row.thumbnail,
          permalink: row.permalink,
          data: []
        };
      }
      historyByProduct[row.product_id].data.push({
        date: row.snapshot_date,
        rank: row.rank,
        price: row.price
      });
    });

    // Converter para array para o frontend
    const results = Object.values(historyByProduct);

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("ML Spy History API Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to fetch history' }, { status: 500 });
  }
}
