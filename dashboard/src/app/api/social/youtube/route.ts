import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

  if (!API_KEY || !CHANNEL_ID) {
    return NextResponse.json({ error: 'Faltam credenciais do YouTube no .env.local' }, { status: 500 });
  }

  try {
    // Busca dados gerais do canal (Inscritos, Visualizações totais, Vídeos)
    const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${API_KEY}`);
    const channelData = await channelRes.json();

    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('Canal não encontrado');
    }

    const stats = channelData.items[0].statistics;
    
    // Busca os 10 vídeos mais recentes
    const videosRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=10&order=date&type=video&key=${API_KEY}`);
    const videosData = await videosRes.json();

    // Busca estatísticas de cada vídeo
    let recentVideos = [];
    if (videosData.items && videosData.items.length > 0) {
      const videoIds = videosData.items.map((v: any) => v.id.videoId).join(',');
      const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${API_KEY}`);
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
      recentVideos
    });

  } catch (error: any) {
    console.error('YouTube API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
