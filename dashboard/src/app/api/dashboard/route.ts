import { NextRequest, NextResponse } from 'next/server';
import { fetchNuvemshopData } from '@/services/nuvemshop';
import { fetchGAData, fetchAcquisitionData, fetchDeviceData, fetchTopPages } from '@/services/google-analytics';
import { fetchWordPressPosts } from '@/services/wordpress';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get('range') || '7d';
  const domain = searchParams.get('domain') || 'all';
  
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;

  // Mapeamento de domínios para Hostnames do GA
  const hostnames: Record<string, string | undefined> = {
    'store': 'paulistanaemporio.com',
    'blog': 'blog.paulistanaemporio.com',
    'all': undefined
  };

  const selectedHostname = hostnames[domain];

  try {
    // Busca dados em paralelo de todas as fontes
    const [nuvemshopData, gaData, acquisition, devices, topPages, wpPosts] = await Promise.all([
      domain === 'blog' 
        ? Promise.resolve({ categories: [], conversionRate: [], totalRevenue: [], orderCount: [] })
        : fetchNuvemshopData(days),
      fetchGAData(days, selectedHostname),
      fetchAcquisitionData(days, selectedHostname),
      fetchDeviceData(days, selectedHostname),
      fetchTopPages(days, selectedHostname, 10),
      (domain === 'blog' || domain === 'all') ? fetchWordPressPosts(10) : Promise.resolve([]),
    ]);

    // Consolidando os dados no formato que o Frontend espera
    const dashboardResponse = {
      categories: nuvemshopData.categories, 
      conversionRate: nuvemshopData.conversionRate.map(rate => parseFloat(rate)),
      totalRevenue: nuvemshopData.totalRevenue,
      orderCount: nuvemshopData.orderCount,
      activeUsers: gaData.activeUsers,
      pageViews: gaData.pageViews,
      acquisition,
      devices,
      topPages,
      wpPosts,
    };

    return NextResponse.json(dashboardResponse);
  } catch (error) {
    console.error('BFF Aggregation Error:', error);
    return NextResponse.json({ error: 'Falha ao agregar dados do Dashboard' }, { status: 500 });
  }
}
