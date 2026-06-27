import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json({ error: 'Post ID é obrigatório' }, { status: 400 });
    }

    // Ao invés de usar n8n, apenas mudamos o status para "Produzir".
    // O Worker Python rodando em background (worker.py) capturará isso e processará.
    const { error } = await supabase
      .from('posts')
      .update({ status: 'Produzir' })
      .eq('id_post', postId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Renderização iniciada pelo Worker! O vídeo aparecerá na biblioteca em breve.' });
  } catch (error) {
    console.error('Render API Error:', error);
    return NextResponse.json({ error: 'Erro ao iniciar renderização.' }, { status: 500 });
  }
}
