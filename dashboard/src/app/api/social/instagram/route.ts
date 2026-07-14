import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    let query = supabase
      .from('contas')
      .select('conta_id_instagram, ig_access_token, facebook_access_token')
      .not('conta_id_instagram', 'is', null);

    if (accountId) {
      query = query.eq('id_conta', accountId);
    }

    const { data: account, error: accError } = await query.limit(1).single();

    if (accError || !account) {
      return NextResponse.json({ error: 'Nenhuma conta do Instagram conectada no banco de dados' }, { status: 404 });
    }

    // Determina host e token baseado no tipo de autenticação
    // Se tem facebook_access_token, usa graph.facebook.com; senão, graph.instagram.com
    const isDirectIG = !account.facebook_access_token;
    const API_BASE = isDirectIG ? 'https://graph.instagram.com' : 'https://graph.facebook.com';
    const ACCESS_TOKEN = isDirectIG ? account.ig_access_token : (account.facebook_access_token || account.ig_access_token);
    const IG_ACCOUNT_ID = account.conta_id_instagram;

    // Busca dados gerais do perfil (Seguidores, publicações)
    const profileRes = await fetch(`${API_BASE}/v21.0/${IG_ACCOUNT_ID}?fields=followers_count,media_count,profile_picture_url,username&access_token=${ACCESS_TOKEN}`);
    const profileData = await profileRes.json();

    if (profileData.error) {
      throw new Error(profileData.error.message);
    }

    // Busca os 10 posts mais recentes (Reels/Imagens) com métricas
    const mediaRes = await fetch(`${API_BASE}/v21.0/${IG_ACCOUNT_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=10&access_token=${ACCESS_TOKEN}`);
    const mediaData = await mediaRes.json();

    // Para Reels ou vídeos, Instagram permite buscar 'plays' e 'reach' via Insights,
    // mas vamos simplificar com likes e comments no endpoint base para não esgotar limites de cara.
    
    const recentPosts = (mediaData.data || []).map((post: any) => ({
      id: post.id,
      caption: post.caption?.substring(0, 100) + '...' || '',
      type: post.media_type,
      thumbnail: post.thumbnail_url || post.media_url,
      permalink: post.permalink,
      publishedAt: post.timestamp,
      likes: post.like_count || 0,
      comments: post.comments_count || 0
    }));

    return NextResponse.json({
      profile: {
        username: profileData.username,
        followers: profileData.followers_count || 0,
        mediaCount: profileData.media_count || 0,
        picture: profileData.profile_picture_url
      },
      recentPosts
    });

  } catch (error: any) {
    console.error('Instagram API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
