import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const N8N_BASE = process.env.N8N_WEBHOOK_BASE_URL || 'https://n8n.sfaisolutions.com/webhook';

/**
 * API Route: Publicar Conteúdo (v2)
 * 
 * Arquitetura modular:
 * - YouTube: direto via Next.js API (OAuth por conta)
 * - Instagram: n8n webhook publish-ig-v2 (Dual API: IG Business + FB Page)
 * - Facebook: n8n webhook publish-fb-v2 (Graph API 3-step upload)
 * - All: dispara os 3 em paralelo
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, accountId, platform, scheduled_for } = body;

    if (!postId || !accountId || !platform) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    console.log(`[API Publish] Iniciando para post ${postId} | conta ${accountId} | plataforma: ${platform}`);

    // 1. Buscar dados do post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('captions, hashtags, titulo_post, tema_post')
      .eq('id_post', postId)
      .single();

    if (postError || !post) {
      throw new Error('Post não encontrado no banco de dados');
    }

    // 2. Buscar URL do vídeo final
    const { data: video } = await supabase
      .from('videos')
      .select('video_final_url')
      .eq('id_post', postId)
      .order('data_compilacao', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fallback: tentar production_batches se videos não tiver
    let videoUrl = video?.video_final_url;
    if (!videoUrl) {
      const { data: batch } = await supabase
        .from('production_batches')
        .select('video_final_url')
        .eq('id_post', postId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      videoUrl = batch?.video_final_url;
    }

    if (!videoUrl) {
      throw new Error('URL do vídeo final não encontrada. O vídeo precisa ser renderizado primeiro.');
    }

    // 3. Buscar dados da conta
    const { data: account, error: accountError } = await supabase
      .from('contas')
      .select('conta_id_instagram, ig_access_token, facebook_access_token, conta_id_facebook, yt_credencial, nome_conta')
      .eq('id_conta', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Conta não encontrada no banco de dados');
    }

    // 4. Montar caption
    let caption = (post.captions || post.tema_post || '').trim();
    if (post.hashtags) caption += '\n\n' + post.hashtags.trim();
    const titulo = (post.titulo_post || post.tema_post || 'Sem título').slice(0, 100);

    // 5. Determinar tipo de autenticação IG
    const isDirectIG = !account.facebook_access_token;
    const igApiBase = isDirectIG ? 'https://graph.instagram.com' : 'https://graph.facebook.com';
    const igToken = isDirectIG ? account.ig_access_token : (account.facebook_access_token || account.ig_access_token);

    // 6. Disparar publicação por plataforma
    const results: Record<string, any> = {};
    const errors: string[] = [];

    const publishIG = async () => {
      if (!account.conta_id_instagram || !igToken) {
        errors.push('Instagram: conta sem credenciais IG');
        return;
      }
      try {
        const res = await fetch(`${N8N_BASE}/publish-ig-v2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_post: postId,
            id_conta: accountId,
            igApiBase,
            igToken,
            igAccountId: account.conta_id_instagram,
            igAuthType: isDirectIG ? 'instagram_direct' : 'facebook',
            videoUrl,
            caption,
            titulo,
            tema: post.tema_post || '',
          }),
        });
        results.instagram = await res.json();
        console.log(`[API Publish] ✅ Instagram OK`);
      } catch (e: any) {
        errors.push(`Instagram: ${e.message}`);
        console.error(`[API Publish] ❌ Instagram:`, e.message);
      }
    };

    const publishFB = async () => {
      if (!account.conta_id_facebook || !account.facebook_access_token) {
        errors.push('Facebook: conta sem credenciais FB');
        return;
      }
      try {
        const res = await fetch(`${N8N_BASE}/publish-fb-v2`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_post: postId,
            id_conta: accountId,
            fbPageId: account.conta_id_facebook,
            fbToken: account.facebook_access_token,
            videoUrl,
            caption,
            titulo,
            tema: post.tema_post || '',
          }),
        });
        results.facebook = await res.json();
        console.log(`[API Publish] ✅ Facebook OK`);
      } catch (e: any) {
        errors.push(`Facebook: ${e.message}`);
        console.error(`[API Publish] ❌ Facebook:`, e.message);
      }
    };

    const publishYT = async () => {
      if (!account.yt_credencial) {
        errors.push('YouTube: conta sem credenciais YT');
        return;
      }
      try {
        // YouTube é direto via Next.js (mesmo servidor)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const res = await fetch(`${appUrl}/api/content/publish/youtube`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_post: postId, id_conta: accountId }),
        });
        results.youtube = await res.json();
        console.log(`[API Publish] ✅ YouTube OK`);
      } catch (e: any) {
        errors.push(`YouTube: ${e.message}`);
        console.error(`[API Publish] ❌ YouTube:`, e.message);
      }
    };

    // Despachar com base na plataforma
    switch (platform) {
      case 'instagram':
        await publishIG();
        break;
      case 'facebook':
        await publishFB();
        break;
      case 'youtube':
        await publishYT();
        break;
      case 'all':
        // Paralelo: dispara os 3 ao mesmo tempo
        await Promise.allSettled([publishIG(), publishFB(), publishYT()]);
        break;
      default:
        throw new Error(`Plataforma desconhecida: ${platform}`);
    }

    return NextResponse.json({ 
      success: errors.length === 0, 
      message: errors.length === 0 
        ? `Publicação em ${platform} concluída com sucesso!`
        : `Publicação parcial: ${errors.join('; ')}`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('[API Publish] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar publicação' }, { status: 500 });
  }
}
