import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('item_id');
  if (!itemId) return NextResponse.json({ error: 'Missing item_id' }, { status: 400 });

  try {
    const { data, error } = await supabase
      .from('ml_competitor_history')
      .select('*')
      .eq('product_id', itemId)
      .order('snapshot_date', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ history: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
