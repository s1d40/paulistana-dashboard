import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos a chave de admin para burlar RLS apenas do lado do servidor se necessário
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // Busca todos os anúncios rastreados
    const { data: ads, error: adsError } = await supabase
      .from('ml_tracked_ads')
      .select('*')
      .order('created_at', { ascending: false });

    if (adsError) throw adsError;

    // Busca o histórico de preços dos últimos 30 dias
    const { data: history, error: histError } = await supabase
      .from('ml_tracked_ads_history')
      .select('*')
      .order('snapshot_date', { ascending: true });

    if (histError) throw histError;

    // Agrupa o histórico por ID do anúncio
    const historyMap: Record<string, any[]> = {};
    history?.forEach(record => {
      if (!historyMap[record.ml_item_id]) {
        historyMap[record.ml_item_id] = [];
      }
      historyMap[record.ml_item_id].push({
        date: record.snapshot_date,
        price: Number(record.price),
        status: record.status
      });
    });

    // Mescla tudo e devolve ao Frontend
    const results = ads?.map(ad => ({
      ...ad,
      history: historyMap[ad.ml_item_id] || []
    })) || [];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Sniper API Error:", error);
    return NextResponse.json({ error: error.message || 'Falha ao buscar alvos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { url, custom_name } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'A URL do anúncio é obrigatória' }, { status: 400 });
    }

    // Extrai o ID do Mercado Livre (Ex: MLB1234567) da URL com Regex
    // Geralmente as URLs são produto.mercadolivre.com.br/MLB-123456789-...
    const match = url.match(/MLB[_-]?(\d+)/i);
    if (!match) {
      return NextResponse.json({ error: 'Não foi possível encontrar o código MLB na URL informada' }, { status: 400 });
    }

    const mlItemId = `MLB${match[1]}`;

    const { data, error } = await supabase
      .from('ml_tracked_ads')
      .insert([{ 
        ml_item_id: mlItemId, 
        custom_name: custom_name || `Alvo: ${mlItemId}`,
        url: url 
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Código de erro Postgres para violação de UNIQUE
        return NextResponse.json({ error: 'Este anúncio já está sendo rastreado!' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, target: data });
  } catch (error: any) {
    console.error("Sniper POST Error:", error);
    return NextResponse.json({ error: error.message || 'Falha ao cadastrar alvo' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mlItemId = searchParams.get('id');

    if (!mlItemId) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const { error } = await supabase
      .from('ml_tracked_ads')
      .delete()
      .eq('ml_item_id', mlItemId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sniper DELETE Error:", error);
    return NextResponse.json({ error: error.message || 'Falha ao deletar alvo' }, { status: 500 });
  }
}
