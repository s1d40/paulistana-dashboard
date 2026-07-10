import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * API Route: Instagram Comments
 * GET /api/instagram/comments?accountId=xxx
 * 
 * Busca comentários recentes de todos os posts do Instagram via Graph API
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId obrigatório' }, { status: 400 });
    }

    // 1. Buscar credenciais da conta
    const { data: account, error: accError } = await supabase
      .from('contas')
      .select('conta_id_instagram, ig_access_token, conta_id_facebook, facebook_access_token, nome_conta')
      .eq('id_conta', accountId)
      .single();

    if (accError || !account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const { ig_access_token, conta_id_instagram } = account;

    if (!ig_access_token || !conta_id_instagram) {
      return NextResponse.json({ error: 'Credenciais do Instagram ausentes nesta conta' }, { status: 400 });
    }

    // 2. Determinar API com base no token disponível
    let mediaUrl = '';
    const { facebook_access_token, conta_id_facebook } = account;

    if (facebook_access_token && conta_id_facebook) {
      // Fluxo Legado: Conectado via Facebook Login
      mediaUrl = `https://graph.facebook.com/v21.0/${conta_id_instagram}/media?fields=id,caption,thumbnail_url,media_url,timestamp,media_type,comments.limit(10){id,text,username,timestamp,like_count,replies{id,text,username,timestamp}}&limit=10&access_token=${facebook_access_token}`;
    } else {
      // Fluxo Novo: Conectado via Instagram Business Login
      mediaUrl = `https://graph.instagram.com/v21.0/me/media?fields=id,caption,thumbnail_url,media_url,timestamp,media_type,comments.limit(10){id,text,username,timestamp,like_count,replies{id,text,username,timestamp}}&limit=10&access_token=${ig_access_token}`;
    }

    console.log(`[IG Comments] Fetching for account ${accountId}, URL: ${mediaUrl.split('access_token')[0]}`);

    const res = await fetch(mediaUrl);
    const data = await res.json();

    if (data.error) {
      console.error('[IG Comments] API Error:', data.error);
      return NextResponse.json({
        error: data.error.message || 'Erro na API do Instagram',
        code: data.error.code,
        type: data.error.type
      }, { status: 400 });
    }

    // 3. Formatar comentários agrupados por post
    const allComments: any[] = [];

    for (const media of (data.data || [])) {
      const comments = media.comments?.data || [];
      for (const comment of comments) {
        allComments.push({
          id: comment.id,
          postId: media.id,
          postCaption: (media.caption || '').substring(0, 80) + ((media.caption || '').length > 80 ? '...' : ''),
          postThumbnail: media.thumbnail_url || media.media_url || '',
          postType: media.media_type || 'IMAGE',
          username: comment.username || 'usuário',
          text: comment.text || '',
          timestamp: comment.timestamp,
          likes: comment.like_count || 0,
          replies: (comment.replies?.data || []).map((r: any) => ({
            id: r.id,
            username: r.username || '',
            text: r.text || '',
            timestamp: r.timestamp,
            isFromMe: r.username === account.nome_conta
          })),
          platform: 'instagram'
        });
      }
    }

    // Ordenar por mais recente
    allComments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      comments: allComments,
      accountName: account.nome_conta,
      totalComments: allComments.length
    });

  } catch (error: any) {
    console.error('[IG Comments] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/instagram/comments
 * Body: { accountId, commentId, text }
 * 
 * Responde a um comentário no Instagram
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, commentId, text } = body;

    if (!accountId || !commentId || !text) {
      return NextResponse.json({ error: 'accountId, commentId e text obrigatórios' }, { status: 400 });
    }

    const { data: account, error: accError } = await supabase
      .from('contas')
      .select('ig_access_token, facebook_access_token, conta_id_facebook')
      .eq('id_conta', accountId)
      .single();

    if (accError || !account?.ig_access_token) {
      return NextResponse.json({ error: 'Credenciais não encontradas' }, { status: 404 });
    }

    // Responder ao comentário
    let replyUrl = '';
    
    if (account.facebook_access_token && account.conta_id_facebook) {
      replyUrl = `https://graph.facebook.com/v21.0/${commentId}/replies?access_token=${account.facebook_access_token}`;
    } else {
      replyUrl = `https://graph.instagram.com/v21.0/${commentId}/replies?access_token=${account.ig_access_token}`;
    }

    console.log(`[IG Reply] Replying to comment ${commentId}, API: ${replyUrl.includes('graph.facebook.com') ? 'Facebook' : 'Instagram'}`);

    const res = await fetch(replyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();

    if (data.error) {
      console.error('[IG Reply] API Error:', data.error);
      return NextResponse.json({
        error: data.error.message || 'Erro ao responder comentário',
        code: data.error.code
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      replyId: data.id
    });

  } catch (error: any) {
    console.error('[IG Reply] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
