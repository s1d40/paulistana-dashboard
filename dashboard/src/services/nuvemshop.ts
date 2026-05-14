// services/nuvemshop.ts

export interface NuvemshopData {
  categories: string[];
  conversionRate: string[];
  totalRevenue: number[];
  orderCount: number[];
}

export async function fetchNuvemshopData(days: number): Promise<NuvemshopData> {
  const token = process.env.NUVEMSHOP_API_TOKEN;
  const storeId = process.env.NUVEMSHOP_API_BASE_URL?.split('/').pop();

  // MOCK DATA: Se os tokens não estiverem configurados ou se for ambiente de dev
  if (!token || token === 'seu_token_nuvemshop_aqui' || !storeId) {
    return generateMockNuvemshopData(days);
  }

  try {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - days + 1);
    minDate.setHours(0, 0, 0, 0);

    const response = await fetch(`https://api.nuvemshop.com.br/v1/${storeId}/orders?created_at_min=${minDate.toISOString()}`, {
      headers: {
        'Authentication': `bearer ${token}`,
        'User-Agent': 'Dashboard-BFF (sid@paulistanaemporio.com.br)'
      }
    });

    let orders = [];
    if (!response.ok) {
      if (response.status === 404) {
        // A API da Nuvemshop retorna 404 (Last page is 0) quando não há pedidos no filtro
        orders = [];
      } else {
        throw new Error(`Nuvemshop API Error: ${response.status} - ${await response.text()}`);
      }
    } else {
      orders = await response.json();
    }

    // Arrays para os últimos N dias
    const categories: string[] = [];
    const totalRevenue: number[] = Array(days).fill(0);
    const orderCount: number[] = Array(days).fill(0);
    const conversionRate: string[] = Array(days).fill("2.50"); // Mocado pois a conversão real exige juntar com tráfego do GA4

    // Gerar as labels de data e um mapa para facilitar o agrupamento
    const dateIndexMap = new Map<string, number>();
    
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const dateString = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      categories.push(dateString);
      dateIndexMap.set(dateString, i);
    }

    // Processar pedidos e agregar por dia
    if (Array.isArray(orders)) {
      orders.forEach(order => {
        if (!order.created_at) return;
        
        const orderDate = new Date(order.created_at);
        const dateString = orderDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        
        const index = dateIndexMap.get(dateString);
        if (index !== undefined) {
          totalRevenue[index] += parseFloat(order.total || '0');
          orderCount[index] += 1;
        }
      });
    }

    return { categories, conversionRate, totalRevenue, orderCount };
  } catch (error) {
    console.error('Falha ao buscar dados reais da Nuvemshop:', error);
    return generateMockNuvemshopData(days); // Fallback preventivo
  }
}

// Utilitário para gerar dados fictícios realistas
function generateMockNuvemshopData(days: number): NuvemshopData {
  const categories = Array.from({ length: days }).map((_, i) => `Dia ${i + 1}`);
  const conversionRate = categories.map(() => (Math.random() * 3 + 1.5).toFixed(2));
  const totalRevenue = categories.map(() => Math.floor(Math.random() * 5000) + 1500);
  const orderCount = categories.map(() => Math.floor(Math.random() * 50) + 10);

  return { categories, conversionRate, totalRevenue, orderCount };
}
