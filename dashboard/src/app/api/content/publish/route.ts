import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * API Route: Publicar Conteúdo
 * Integração com n8n para disparo em redes sociais
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, accountId, platform, scheduled_for } = body;

    if (!postId || !accountId || !platform) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    console.log(`[API Publish] Iniciando processo para post ${postId} na conta ${accountId} via ${platform}`);

    // 1. Buscar os dados finais do post para enviar ao n8n
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('captions, hashtags, titulo_post, tema_post')
      .eq('id_post', postId)
      .single();

    if (postError || !post) {
      throw new Error('Post não encontrado no banco de dados');
    }

    // 2. Buscar a URL do vídeo final
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('video_final_url')
      .eq('id_post', postId)
      .order('data_compilacao', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (videoError || !video?.video_final_url) {
      throw new Error('URL do vídeo final não encontrada. O vídeo precisa ser renderizado primeiro.');
    }

    // 3. Selecionar o webhook dedicado com base na plataforma
    let n8nWebhookUrl = '';
    
    switch (platform) {
      case 'youtube':
        n8nWebhookUrl = 'https://n8n.sfaisolutions.com/webhook/81b0dbd8-a5cb-4e78-ad11-e0b025ab25f5';
        break;
      case 'facebook':
        n8nWebhookUrl = 'https://n8n.sfaisolutions.com/webhook/5fe5ba03-8cec-4b61-b63a-ba70ad1d14ba';
        break;
      case 'instagram':
        n8nWebhookUrl = 'https://n8n.sfaisolutions.com/webhook/63e09a9b-fc19-4a14-818e-7ac30406c56e';
        break;
      case 'all':
        n8nWebhookUrl = 'https://n8n.sfaisolutions.com/webhook/d9c2e03e-83c8-432d-a97c-a9704846048d';
        break;
      default:
        n8nWebhookUrl = process.env.N8N_WEBHOOK_CONTEUDO_URL || '';
    }

    if (!n8nWebhookUrl) {
      throw new Error(`Configuração de Webhook para a plataforma '${platform}' ausente.`);
    }

    const payload = {
      action: 'publish_content',
      platform,
      id_post: postId,
      id_conta: accountId,
      metadata: {
        title: post.titulo_post,
        theme: post.tema_post,
        captions: post.captions,
        hashtags: post.hashtags,
        video_url: video.video_final_url
      }
    };

    const n8nRes = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_TOKEN || ''}`
      },
      body: JSON.stringify(payload),
    });

    if (!n8nRes.ok) {
      const errorText = await n8nRes.text();
      console.error('[API Publish] n8n Error:', errorText);
      throw new Error('O servidor de automação (n8n) recusou a solicitação.');
    }

    return NextResponse.json({ 
      success: true, 
      message: `Solicitação de publicação enviada com sucesso para ${platform}`,
      data: payload
    });

  } catch (error: any) {
    console.error('[API Publish] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar publicação' }, { status: 500 });
  }
}
