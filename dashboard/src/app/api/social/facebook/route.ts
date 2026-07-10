import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * API Route: Facebook Page Insights
 * GET /api/social/facebook?accountId=xxx
 * 
 * Busca insights da Facebook Page via Graph API
 * Usa o facebook_access_token e conta_id_facebook da tabela contas
 * Requer permissão: pages_read_user_content, pages_read_engagement
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    let query = supabase
      .from('contas')
      .select('conta_id_facebook, facebook_access_token, nome_conta')
      .not('conta_id_facebook', 'is', null)
      .not('facebook_access_token', 'is', null);

    if (accountId) {
      query = query.eq('id_conta', accountId);
    }

    const { data: account, error: accError } = await query.limit(1).single();

    if (accError || !account) {
      return NextResponse.json({ error: 'Nenhuma Facebook Page conectada nesta conta' }, { status: 404 });
    }

    const ACCESS_TOKEN = account.facebook_access_token;
    const PAGE_ID = account.conta_id_facebook;

    // 1. Busca informações da Page (nome, seguidores, foto)
    const pageRes = await fetch(
      `https://graph.facebook.com/v21.0/${PAGE_ID}?fields=name,followers_count,fan_count,picture.type(large),category,about&access_token=${encodeURIComponent(ACCESS_TOKEN)}`
    );
    const pageData = await pageRes.json();

    if (pageData.error) {
      console.error('[FB Insights] Page data error:', pageData.error);
      throw new Error(pageData.error.message);
    }

    // 2. Busca insights da Page (últimos 28 dias)
    const insightsRes = await fetch(
      `https://graph.facebook.com/v21.0/${PAGE_ID}/insights?metric=page_impressions,page_engaged_users,page_post_engagements,page_fans&period=day&date_preset=last_28d&access_token=${encodeURIComponent(ACCESS_TOKEN)}`
    );
    const insightsData = await insightsRes.json();

    // Processar métricas de insights
    let totalImpressions = 0;
    let totalEngagedUsers = 0;
    let totalPostEngagements = 0;
    let dailyImpressions: { date: string; value: number }[] = [];

    if (insightsData.data) {
      for (const metric of insightsData.data) {
        const values = metric.values || [];
        const total = values.reduce((sum: number, v: any) => sum + (v.value || 0), 0);

        switch (metric.name) {
          case 'page_impressions':
            totalImpressions = total;
            dailyImpressions = values.map((v: any) => ({
              date: v.end_time?.split('T')[0] || '',
              value: v.value || 0
            }));
            break;
          case 'page_engaged_users':
            totalEngagedUsers = total;
            break;
          case 'page_post_engagements':
            totalPostEngagements = total;
            break;
        }
      }
    }

    // 3. Busca os posts mais recentes da Page com métricas de engajamento
    const feedRes = await fetch(
      `https://graph.facebook.com/v21.0/${PAGE_ID}/posts?fields=id,message,created_time,full_picture,shares,reactions.summary(total_count),comments.summary(total_count)&limit=10&access_token=${encodeURIComponent(ACCESS_TOKEN)}`
    );
    const feedData = await feedRes.json();

    const recentPosts = (feedData.data || []).map((post: any) => ({
      id: post.id,
      message: post.message?.substring(0, 120) || 'Post sem texto',
      picture: post.full_picture || null,
      createdAt: post.created_time,
      reactions: post.reactions?.summary?.total_count || 0,
      comments: post.comments?.summary?.total_count || 0,
      shares: post.shares?.count || 0,
    }));

    return NextResponse.json({
      page: {
        name: pageData.name || account.nome_conta,
        followers: pageData.followers_count || pageData.fan_count || 0,
        category: pageData.category || 'Página',
        picture: pageData.picture?.data?.url || null,
        about: pageData.about || null,
      },
      insights: {
        impressions: totalImpressions,
        engagedUsers: totalEngagedUsers,
        postEngagements: totalPostEngagements,
        dailyImpressions,
      },
      recentPosts,
    });

  } catch (error: any) {
    console.error('[FB Insights] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
