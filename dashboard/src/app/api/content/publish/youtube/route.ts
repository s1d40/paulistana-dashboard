import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route: Publicar vídeo no YouTube
 * POST /api/content/publish/youtube
 * Body: { id_post, id_conta }
 * 
 * Fluxo:
 * 1. Busca dados do post (título, captions, vídeo URL)
 * 2. Busca yt_credencial da conta (OAuth tokens)
 * 3. Refresh do token se necessário
 * 4. Download do vídeo
 * 5. Upload via YouTube Data API v3 (resumable upload)
 * 6. Salva youtube_url no post
 * 
 * Chamado pelo n8n Schedule Trigger ou pelo frontend diretamente.
 */
export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { id_post, id_conta } = await request.json();

    if (!id_post || !id_conta) {
      return NextResponse.json({ error: 'id_post e id_conta são obrigatórios' }, { status: 400 });
    }

    console.log(`[YT Publish] Iniciando publicação do post ${id_post} para conta ${id_conta}`);

    // 1. Buscar dados do post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('titulo_post, tema_post, captions, hashtags, roteiro_gerado')
      .eq('id_post', id_post)
      .single();

    if (postError || !post) {
      throw new Error(`Post não encontrado: ${postError?.message}`);
    }

    // 2. Buscar URL do vídeo final (tabela 'videos' primeiro, fallback para 'production_batches')
    const { data: video } = await supabase
      .from('videos')
      .select('video_final_url')
      .eq('id_post', id_post)
      .order('data_compilacao', { ascending: false })
      .limit(1)
      .maybeSingle();

    let videoFinalUrl = video?.video_final_url;

    if (!videoFinalUrl) {
      const { data: batch } = await supabase
        .from('production_batches')
        .select('video_final_url')
        .eq('id_post', id_post)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      videoFinalUrl = batch?.video_final_url;
    }

    if (!videoFinalUrl) {
      throw new Error('Vídeo final não encontrado. O vídeo precisa ser renderizado primeiro.');
    }

    // 3. Buscar credenciais YouTube da conta
    const { data: account, error: accountError } = await supabase
      .from('contas')
      .select('yt_credencial, nome_conta')
      .eq('id_conta', id_conta)
      .single();

    if (accountError || !account?.yt_credencial) {
      throw new Error('Conta não encontrada ou sem credenciais YouTube. Conecte o YouTube primeiro.');
    }

    let ytCred = typeof account.yt_credencial === 'string'
      ? JSON.parse(account.yt_credencial)
      : account.yt_credencial;

    if (!ytCred.access_token || !ytCred.refresh_token) {
      throw new Error('Credenciais YouTube incompletas. Reconecte o YouTube.');
    }

    // 4. Refresh do token se expirado
    if (ytCred.expires_at && new Date(ytCred.expires_at) <= new Date(Date.now() + 60000)) {
      console.log(`[YT Publish] Token expirado, renovando...`);

      const clientId = process.env.GOOGLE_YOUTUBE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_YOUTUBE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('GOOGLE_YOUTUBE_CLIENT_ID/SECRET não configurados');
      }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: ytCred.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        // Se o refresh falhar, marcar a conta como necessitando reconexão
        if (tokenData.error === 'invalid_grant') {
          throw new Error('YouTube token revogado. O usuário precisa reconectar o YouTube.');
        }
        throw new Error(`Falha ao renovar token: ${JSON.stringify(tokenData)}`);
      }

      ytCred.access_token = tokenData.access_token;
      ytCred.expires_at = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

      // Salvar token atualizado no banco
      await supabase
        .from('contas')
        .update({ yt_credencial: JSON.stringify(ytCred) })
        .eq('id_conta', id_conta);

      console.log(`[YT Publish] ✅ Token renovado`);
    }

    // 5. Download do vídeo
    console.log(`[YT Publish] Baixando vídeo: ${videoFinalUrl}`);
    const videoRes = await fetch(videoFinalUrl);

    if (!videoRes.ok) {
      throw new Error(`Falha ao baixar vídeo: HTTP ${videoRes.status}`);
    }

    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    const videoSizeMB = (videoBuffer.length / 1024 / 1024).toFixed(1);
    console.log(`[YT Publish] Vídeo baixado: ${videoSizeMB}MB`);

    // 6. Montar metadados do vídeo
    const title = (post.titulo_post || post.tema_post || 'Sem título').slice(0, 100);
    const description = [
      post.captions || '',
      '',
      post.hashtags || '',
    ].join('\n').slice(0, 5000);

    // 7. Iniciar Resumable Upload (Step 1: metadata)
    console.log(`[YT Publish] Iniciando upload resumable para YouTube...`);

    const initRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ytCred.access_token}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': String(videoBuffer.length),
          'X-Upload-Content-Type': 'video/mp4',
        },
        body: JSON.stringify({
          snippet: {
            title,
            description,
            categoryId: '24', // Entertainment
            defaultLanguage: 'pt',
            defaultAudioLanguage: 'pt',
          },
          status: {
            privacyStatus: 'public',
            selfDeclaredMadeForKids: false,
            madeForKids: false,
          },
        }),
      }
    );

    if (!initRes.ok) {
      const errorBody = await initRes.text();
      console.error(`[YT Publish] Init failed:`, errorBody);
      throw new Error(`YouTube rejeitou o upload: ${initRes.status} - ${errorBody}`);
    }

    const uploadUrl = initRes.headers.get('location');
    if (!uploadUrl) {
      throw new Error('YouTube não retornou URL de upload (Location header missing)');
    }

    // 8. Upload do vídeo (Step 2: binary)
    console.log(`[YT Publish] Enviando ${videoSizeMB}MB para YouTube...`);

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(videoBuffer.length),
      },
      body: videoBuffer,
    });

    if (!uploadRes.ok) {
      const errorBody = await uploadRes.text();
      console.error(`[YT Publish] Upload failed:`, errorBody);
      throw new Error(`Falha no upload do vídeo: ${uploadRes.status}`);
    }

    const uploadResult = await uploadRes.json();
    const youtubeVideoId = uploadResult.id;
    const youtubeUrl = `https://www.youtube.com/shorts/${youtubeVideoId}`;

    console.log(`[YT Publish] ✅ Vídeo publicado! ID: ${youtubeVideoId}`);
    console.log(`[YT Publish] URL: ${youtubeUrl}`);

    // 9. Salvar URL do YouTube no post
    await supabase
      .from('posts')
      .update({ youtube_url: youtubeUrl })
      .eq('id_post', id_post);

    return NextResponse.json({
      success: true,
      youtube_url: youtubeUrl,
      youtube_video_id: youtubeVideoId,
      channel: ytCred.channel_name || account.nome_conta,
      video_size_mb: videoSizeMB,
    });

  } catch (error: any) {
    console.error('[YT Publish] Error:', error.message);
    return NextResponse.json({ 
      error: error.message || 'Erro interno ao publicar no YouTube',
      success: false,
    }, { status: 500 });
  }
}
