import { NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const propertyId = process.env.GA_PROPERTY_ID;
  const credentialsJson = process.env.GA4_SERVICE_ACCOUNT_JSON;

  if (!propertyId || !credentialsJson) {
    return NextResponse.json({ error: 'Configuração do GA4 incompleta no .env.local' }, { status: 500 });
  }

  try {
    const credentials = JSON.parse(credentialsJson);
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      }
    });

    // 1. Relatório Geral (Sessões, Usuários Ativos, Visualizações) últimos 30 dias
    const [generalResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' }
      ]
    });

    // 2. Origem do Tráfego (Sessões por Fonte/Mídia)
    const [sourceResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionSourceMedium' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 5
    });

    // 3. Páginas mais visitadas
    const [pagesResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10
    });

    // Formatando os dados de retorno
    const kpis = {
      activeUsers: generalResponse.rows?.[0]?.metricValues?.[0]?.value || '0',
      pageViews: generalResponse.rows?.[0]?.metricValues?.[1]?.value || '0',
      bounceRate: Number(generalResponse.rows?.[0]?.metricValues?.[2]?.value || 0).toFixed(2),
      avgSessionSecs: Number(generalResponse.rows?.[0]?.metricValues?.[3]?.value || 0).toFixed(0)
    };

    const sources = sourceResponse.rows?.map(row => ({
      source: row.dimensionValues?.[0]?.value || 'Unknown',
      sessions: parseInt(row.metricValues?.[0]?.value || '0', 10)
    })) || [];

    const topPages = pagesResponse.rows?.map(row => ({
      path: row.dimensionValues?.[0]?.value || '/',
      title: row.dimensionValues?.[1]?.value || 'Sem título',
      views: parseInt(row.metricValues?.[0]?.value || '0', 10)
    })) || [];

    return NextResponse.json({ kpis, sources, topPages });
  } catch (error: any) {
    console.error('GA4 API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
