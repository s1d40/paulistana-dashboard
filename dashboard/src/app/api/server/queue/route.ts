import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { action, id_post } = await req.json();
    
    if (action === 'reset_all') {
      // Reset ALL 'Processando' to 'Produzir'
      const { error } = await supabase
        .from('posts')
        .update({ status: 'Produzir' })
        .eq('status', 'Processando');
        
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Fila resetada' });
    }
    
    if (action === 'reset_item' && id_post) {
      const { error } = await supabase
        .from('posts')
        .update({ status: 'Produzir' })
        .eq('id_post', id_post);
        
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Item resetado' });
    }
    
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error resetting queue:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
