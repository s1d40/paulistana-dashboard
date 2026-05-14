import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Instância do SDK - Ele buscará o ADC localmente de forma automática!
const analyticsDataClient = new BetaAnalyticsDataClient();

export interface GAData {
  activeUsers: number[];
  pageViews: number[];
  acquisition?: { source: string; sessions: number }[];
  devices?: { device: string; activeUsers: number }[];
}

export interface PageMetric {
  path: string;
  title: string;
  views: number;
  users: number;
}

export async function fetchTopPages(days: number, hostname?: string, limit: number = 10): Promise<PageMetric[]> {
  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId || propertyId === 'seu_property_id_aqui') {
    return generateMockPageMetrics(hostname);
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${days - 1}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      dimensionFilter: hostname ? {
        filter: {
          fieldName: 'hostName',
          stringFilter: {
            value: hostname,
            matchType: 'EXACT',
          },
        },
      } : undefined,
      limit: limit,
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }]
    });

    return (response.rows || []).map(row => ({
      path: row.dimensionValues?.[0]?.value || '/',
      title: row.dimensionValues?.[1]?.value || 'Sem título',
      views: parseInt(row.metricValues?.[0]?.value || '0', 10),
      users: parseInt(row.metricValues?.[1]?.value || '0', 10)
    }));
  } catch (error) {
    console.error('GA Top Pages Error:', error);
    return [];
  }
}

function generateMockPageMetrics(hostname?: string): PageMetric[] {
  if (hostname === 'blog.paulistanaemporio.com') {
    return [
      { path: '/beneficios-do-mix-de-castanhas', title: '7 Benefícios Incríveis do Mix de Castanhas', views: 1250, users: 980 },
      { path: '/receita-com-damasco-jumbo', title: 'Receita Gourmet: Damasco Jumbo Recheado', views: 890, users: 720 },
      { path: '/como-consumir-psyllium', title: 'Psyllium: O Guia Completo de Como Consumir', views: 750, users: 610 },
      { path: '/cha-de-hibisco-emagrece', title: 'Chá de Hibisco Realmente Ajuda a Emagrecer?', views: 680, users: 540 },
      { path: '/melhores-sementes-para-saude', title: 'As 5 Melhores Sementes para Sua Dieta', views: 450, users: 380 },
    ];
  }
  
  return [
    { path: '/produto/mix-de-castanhas-premium', title: 'Mix de Castanhas Premium 500g', views: 2500, users: 1800 },
    { path: '/produto/damasco-jumbo-turco', title: 'Damasco Jumbo Turco Selecionado', views: 1800, users: 1400 },
    { path: '/produto/castanha-do-para-w1', title: 'Castanha do Pará W1 Inteira', views: 1650, users: 1200 },
    { path: '/produto/pistache-com-casca-salgado', title: 'Pistache com Casca Torrado e Salgado', views: 1400, users: 1100 },
    { path: '/produto/noz-pecan-inteira', title: 'Noz Pecan Inteira de Alta Qualidade', views: 950, users: 800 },
  ];
}

export async function fetchAcquisitionData(days: number, hostname?: string): Promise<{ source: string; sessions: number }[]> {
  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId || propertyId === 'seu_property_id_aqui') return [
    { source: 'Direct', sessions: 1200 },
    { source: 'Organic Search', sessions: 850 },
    { source: 'Paid Search', sessions: 640 },
    { source: 'Social', sessions: 430 },
  ];

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${days - 1}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'sessionSourceMedium' }],
      metrics: [{ name: 'sessions' }],
      dimensionFilter: hostname ? {
        filter: {
          fieldName: 'hostName',
          stringFilter: {
            value: hostname,
            matchType: 'EXACT',
          },
        },
      } : undefined,
      limit: 10
    });

    return (response.rows || []).map(row => ({
      source: row.dimensionValues?.[0]?.value || 'Desconhecido',
      sessions: parseInt(row.metricValues?.[0]?.value || '0', 10)
    }));
  } catch (error) {
    console.error('GA Acquisition Error:', error);
    return [];
  }
}

export async function fetchDeviceData(days: number, hostname?: string): Promise<{ device: string; activeUsers: number }[]> {
  const propertyId = process.env.GA_PROPERTY_ID;
  if (!propertyId || propertyId === 'seu_property_id_aqui') return [
    { device: 'mobile', activeUsers: 1500 },
    { device: 'desktop', activeUsers: 800 },
    { device: 'tablet', activeUsers: 150 },
  ];

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${days - 1}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
      dimensionFilter: hostname ? {
        filter: {
          fieldName: 'hostName',
          stringFilter: {
            value: hostname,
            matchType: 'EXACT',
          },
        },
      } : undefined,
    });

    return (response.rows || []).map(row => ({
      device: row.dimensionValues?.[0]?.value || 'Outros',
      activeUsers: parseInt(row.metricValues?.[0]?.value || '0', 10)
    }));
  } catch (error) {
    console.error('GA Device Error:', error);
    return [];
  }
}

export async function fetchGAData(days: number, hostname?: string): Promise<GAData> {
  const propertyId = process.env.GA_PROPERTY_ID;

  // MOCK DATA: Se a propriedade não estiver configurada
  if (!propertyId || propertyId === 'seu_property_id_aqui') {
    return generateMockGAData(days);
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${days - 1}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
      dimensionFilter: hostname ? {
        filter: {
          fieldName: 'hostName',
          stringFilter: {
            value: hostname,
            matchType: 'EXACT',
          },
        },
      } : undefined,
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }]
    });

    if (!response.rows || response.rows.length === 0) {
      return generateMockGAData(days); // Fallback preventivo
    }

    const activeUsers: number[] = [];
    const pageViews: number[] = [];

    response.rows.forEach(row => {
      const activeUsr = parseInt(row.metricValues?.[0]?.value || '0', 10);
      const views = parseInt(row.metricValues?.[1]?.value || '0', 10);
      activeUsers.push(activeUsr);
      pageViews.push(views);
    });

    // Ajuste de tamanho do array para alinhar com o ECharts
    while (activeUsers.length < days) {
       activeUsers.unshift(0);
       pageViews.unshift(0);
    }
    if (activeUsers.length > days) {
       activeUsers.splice(0, activeUsers.length - days);
       pageViews.splice(0, pageViews.length - days);
    }

    return { activeUsers, pageViews };
  } catch (error) {
    console.error('Falha ao buscar dados do Google Analytics (SDK/ADC):', error);
    return generateMockGAData(days); // Fallback para manter a UI estável
  }
}

function generateMockGAData(days: number): GAData {
  const activeUsers = Array.from({ length: days }).map(() => Math.floor(Math.random() * 800) + 200);
  const pageViews = activeUsers.map(users => Math.floor(users * (Math.random() * 2 + 1.5))); // ~ 1.5 a 3.5 views por user

  return { activeUsers, pageViews };
}
