import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * YouTube Analytics API Route
 * GET /api/social/youtube?accountId=XXX
 * 
 * Busca dados do canal YouTube usando o token OAuth do cliente
 * (não mais uma API key fixa global).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');

  // Fallback para API_KEY global se não tiver accountId
  const GLOBAL_API_KEY = process.env.YOUTUBE_API_KEY;
  const GLOBAL_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

  try {
    let accessToken: string | null = null;
    let channelId: string | null = null;

    // Tentar buscar credenciais OAuth da conta
    if (accountId) {
      const { data: account } = await supabase
        .from('contas')
        .select('yt_credencial')
        .eq('id_conta', accountId)
        .single();

      if (account?.yt_credencial) {
        const ytCred = typeof account.yt_credencial === 'string'
          ? JSON.parse(account.yt_credencial)
          : account.yt_credencial;

        // Verificar se token não expirou
        if (ytCred.access_token) {
          if (ytCred.expires_at && new Date(ytCred.expires_at) <= new Date()) {
            // Tentar refresh
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const refreshRes = await fetch(`${appUrl}/api/auth/google/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conta_id: accountId }),
            });
            const refreshData = await refreshRes.json();
            if (refreshData.access_token) {
              accessToken = refreshData.access_token;
            }
          } else {
            accessToken = ytCred.access_token;
          }
          channelId = ytCred.channel_id;
        }
      }
    }

    // Se tem OAuth token, usar chamadas autenticadas
    if (accessToken) {
      // Busca dados do canal (autenticado)
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const channelData = await channelRes.json();

      if (!channelData.items || channelData.items.length === 0) {
        return NextResponse.json({ error: 'Canal não encontrado' }, { status: 404 });
      }

      const stats = channelData.items[0].statistics;
      const cId = channelData.items[0].id;

      // Busca os 10 vídeos mais recentes
      const videosRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${cId}&maxResults=10&order=date&type=video`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const videosData = await videosRes.json();

      let recentVideos = [];
      if (videosData.items && videosData.items.length > 0) {
        const videoIds = videosData.items.map((v: any) => v.id.videoId).join(',');
        const statsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const statsData = await statsRes.json();

        recentVideos = videosData.items.map((v: any) => {
          const videoStats = statsData.items?.find((s: any) => s.id === v.id.videoId)?.statistics || {};
          return {
            id: v.id.videoId,
            title: v.snippet.title,
            publishedAt: v.snippet.publishedAt,
            thumbnail: v.snippet.thumbnails?.medium?.url,
            views: parseInt(videoStats.viewCount || '0'),
            likes: parseInt(videoStats.likeCount || '0'),
            comments: parseInt(videoStats.commentCount || '0')
          };
        });
      }

      return NextResponse.json({
        channel: {
          subscribers: parseInt(stats.subscriberCount || '0'),
          totalViews: parseInt(stats.viewCount || '0'),
          videoCount: parseInt(stats.videoCount || '0')
        },
        recentVideos,
        auth: 'oauth'
      });
    }

    // Fallback: usar API Key global (modo legado)
    if (!GLOBAL_API_KEY || !GLOBAL_CHANNEL_ID) {
      return NextResponse.json({ error: 'YouTube não configurado para esta conta. Conecte via OAuth.' }, { status: 404 });
    }

    const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${GLOBAL_CHANNEL_ID}&key=${GLOBAL_API_KEY}`);
    const channelData = await channelRes.json();

    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('Canal não encontrado');
    }

    const stats = channelData.items[0].statistics;

    const videosRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${GLOBAL_CHANNEL_ID}&maxResults=10&order=date&type=video&key=${GLOBAL_API_KEY}`);
    const videosData = await videosRes.json();

    let recentVideos = [];
    if (videosData.items && videosData.items.length > 0) {
      const videoIds = videosData.items.map((v: any) => v.id.videoId).join(',');
      const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${GLOBAL_API_KEY}`);
      const statsData = await statsRes.json();

      recentVideos = videosData.items.map((v: any, index: number) => {
        const videoStats = statsData.items.find((s: any) => s.id === v.id.videoId)?.statistics || {};
        return {
          id: v.id.videoId,
          title: v.snippet.title,
          publishedAt: v.snippet.publishedAt,
          thumbnail: v.snippet.thumbnails.medium.url,
          views: parseInt(videoStats.viewCount || '0'),
          likes: parseInt(videoStats.likeCount || '0'),
          comments: parseInt(videoStats.commentCount || '0')
        };
      });
    }

    return NextResponse.json({
      channel: {
        subscribers: parseInt(stats.subscriberCount || '0'),
        totalViews: parseInt(stats.viewCount || '0'),
        videoCount: parseInt(stats.videoCount || '0')
      },
      recentVideos,
      auth: 'api_key'
    });

  } catch (error: any) {
    console.error('YouTube API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
