import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // O n8n vai mandar estes campos no final do workflow
    const { id_post, status, video_url, error_message } = body;

    if (!id_post) {
      return NextResponse.json({ error: 'id_post é obrigatório' }, { status: 400 });
    }

    // 1. Prepara a atualização do status na tabela de posts
    const updateData: any = {};
    if (status) updateData.status = status;
    if (error_message) updateData.roteiro_gerado = error_message; // Log de erro rápido

    // 2. Se o n8n enviar a URL do vídeo renderizado, salva na tabela 'videos'
    if (video_url) {
      updateData.status = 'Concluído'; // Garante o status de sucesso
      
      const { error: videoError } = await supabase
        .from('videos')
        .upsert({
          id_video_final: `vid_${id_post}`,
          id_post: id_post,
          video_final_url: video_url,
          data_compilacao: new Date().toISOString()
        }, { onConflict: 'id_video_final' });
        
      if (videoError) {
        console.error('Erro ao inserir o vídeo na tabela:', videoError);
      }
    }

    // 3. Atualiza o Post
    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id_post', id_post)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Erro no Callback do n8n:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
