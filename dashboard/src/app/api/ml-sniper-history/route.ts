import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ml_item_id, price, status } = body;

    if (!ml_item_id || price === undefined) {
      return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Verifica se já temos o preço salvo hoje
    const { data: existing } = await supabase
      .from('ml_tracked_ads_history')
      .select('id')
      .eq('ml_item_id', ml_item_id)
      .eq('snapshot_date', today)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, message: 'Já atualizado hoje' });
    }

    // Se não tem, insere
    const { data, error } = await supabase
      .from('ml_tracked_ads_history')
      .insert([{
        ml_item_id,
        price,
        status,
        snapshot_date: today
      }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sniper History API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
