import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
  const IG_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!ACCESS_TOKEN || !IG_ACCOUNT_ID) {
    return NextResponse.json({ error: 'Faltam credenciais do Instagram no .env.local' }, { status: 500 });
  }

  try {
    // Busca dados gerais do perfil (Seguidores, publicações)
    const profileRes = await fetch(`https://graph.facebook.com/v19.0/${IG_ACCOUNT_ID}?fields=followers_count,media_count,profile_picture_url,username&access_token=${ACCESS_TOKEN}`);
    const profileData = await profileRes.json();

    if (profileData.error) {
      throw new Error(profileData.error.message);
    }

    // Busca os 10 posts mais recentes (Reels/Imagens) com métricas
    const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${IG_ACCOUNT_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=10&access_token=${ACCESS_TOKEN}`);
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
