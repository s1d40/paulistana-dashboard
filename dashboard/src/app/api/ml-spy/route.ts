import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

const categoryCache = new Map<string, string[]>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const term = searchParams.get('q');
  const sort = searchParams.get('sort'); // 'price_asc' | 'price_desc' | 'relevance'

  if (!category && !term) {
    return NextResponse.json({ error: 'É necessário informar uma categoria ou um termo de busca.' }, { status: 400 });
  }

  try {
    // Busca o token do Mercado Livre rodando o script Python que já tem a lógica de renovação (refresh_token)
    let mlToken = '';
    try {
      const scriptPath = path.join(process.cwd(), '../scripts/mercado_livre');
      mlToken = execSync('source venv/bin/activate && python print_token.py', { 
        cwd: scriptPath, 
        encoding: 'utf-8',
        stdio: 'pipe',
        shell: '/bin/bash'
      }).trim();
    } catch (tokenErr: any) {
      console.warn("Aviso: Não foi possível obter o token renovado via Python.", tokenErr.message || tokenErr);
      if (tokenErr.stderr) {
        console.warn("STDERR do Python:", tokenErr.stderr.toString());
      }
      return NextResponse.json({ error: `ML Token API Error: ${tokenErr.message || tokenErr}` }, { status: 500 });
    }

    const headers: Record<string, string> = {};
    if (mlToken) {
      headers['Authorization'] = `Bearer ${mlToken}`;
    }

    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filterFull = searchParams.get('full') === 'true';

    let finalResults: any[] = [];
    let topProducts: any[] = [];

    // Se o usuário digitou um termo de busca, usamos a nova abordagem via catálogo (anti-scraping bypass)
    if (term) {
      const ANDRE_SELLER_ID = 428354884;
      const lowerTerm = term.toLowerCase();
      
      // 1. Busca os itens ativos do nosso seller (até 100 itens para cobrir o inventário principal)
      const mySearchRes = await fetch(`https://api.mercadolibre.com/users/${ANDRE_SELLER_ID}/items/search?status=active&limit=100`, { headers });
      const mySearchData = await mySearchRes.json();
      const myItemIds = mySearchData.results || [];

      if (myItemIds.length > 0) {
        // 2. Busca os detalhes em lotes de 20
        let myProducts: any[] = [];
        for (let i = 0; i < myItemIds.length; i += 20) {
          const chunk = myItemIds.slice(i, i + 20).join(',');
          const itemsRes = await fetch(`https://api.mercadolibre.com/items?ids=${chunk}`, { headers });
          if (itemsRes.ok) {
            const itemsData = await itemsRes.json();
            itemsData.forEach((itemObj: any) => {
              const body = itemObj.body;
              // Aplicar o filtro de category se existir, e o termo
              const matchTerm = body?.title && body.title.toLowerCase().includes(lowerTerm);
              const matchCategory = !category || body?.category_id === category;
              if (matchTerm && matchCategory) {
                myProducts.push(body);
              }
            });
          }
        }

        // 3. Para cada produto com catálogo, buscar os concorrentes
        let currentOffset = 0; // Controla quantos items globais já foram processados
        for (const myProd of myProducts) {
          if (!myProd.catalog_product_id) continue;
          if (finalResults.length >= limit) break;

          try {
            // Busca detalhes do produto no catálogo para pegar nome e marca
            const pDetailsRes = await fetch(`https://api.mercadolibre.com/products/${myProd.catalog_product_id}`, { headers });
            const pDetails = await pDetailsRes.json();

            // Busca concorrentes no catálogo
            const pItemsRes = await fetch(`https://api.mercadolibre.com/products/${myProd.catalog_product_id}/items?limit=50`, { headers });
            const pItemsData = await pItemsRes.json();

            if (pItemsData.results && pDetails.name) {
              const competitors = pItemsData.results;
              const brandAttr = pDetails.attributes?.find((a: any) => a.id === 'BRAND');

              // Busca detalhes completos dos concorrentes (para frete, localizacao etc)
              // Pegamos em lotes de 20
              for (let i = 0; i < competitors.length; i += 20) {
                if (finalResults.length >= limit) break;

                const compChunk = competitors.slice(i, i + 20);
                const compIds = compChunk.map((c: any) => c.item_id);

                if (compIds.length > 0) {
                  const compDetailsRes = await fetch(`https://api.mercadolibre.com/items?ids=${compIds.join(',')}`, { headers });
                  const compDetailsData = await compDetailsRes.json();

                  const compDetailsMap = new Map();
                  if (compDetailsRes.ok) {
                      compDetailsData.forEach((d: any) => {
                          if (d.body) compDetailsMap.set(d.body.id, d.body);
                      });
                  }

                  for (const item of compChunk) {
                    // Trata paginação simulada
                    if (currentOffset < offset) {
                      currentOffset++;
                      continue;
                    }

                    if (finalResults.length >= limit) break;

                    const detail = compDetailsMap.get(item.item_id) || item;

                    if (!detail.price) continue;
                    if (filterFull && detail.shipping?.logistic_type !== 'fulfillment') continue;

                    const originalPrice = detail.original_price || detail.price;
                    const discountStr = originalPrice > detail.price ? Math.round(((originalPrice - detail.price) / originalPrice) * 100) : 0;

                    let reviewsCount = 0;
                    let ratingAverage = 0;
                    try {
                      const targetReviewId = myProd.catalog_product_id;
                      const revRes = await fetch(`https://api.mercadolibre.com/reviews/item/${targetReviewId}`, { headers });
                      if (revRes.ok) {
                        const revData = await revRes.json();
                        reviewsCount = revData.paging?.total || 0;
                        ratingAverage = revData.rating_average || 0;
                      }
                    } catch (e) {}

                    const estimatedSales = reviewsCount * 20;
                    const estimatedRevenue = estimatedSales * detail.price;

                    finalResults.push({
                      rank: finalResults.length + 1,
                      id: item.item_id,
                      title: pDetails.name || detail.title,
                      brand: brandAttr ? brandAttr.value_name : 'Genérico',
                      seller_category: detail.category_id || item.category_id,
                      price: detail.price,
                      original_price: detail.original_price,
                      discount_percentage: discountStr,
                      permalink: detail.permalink || `https://produto.mercadolivre.com.br/${item.item_id.replace('MLB', 'MLB-')}`,
                      thumbnail: pDetails.pictures?.[0]?.url || pDetails.pictures?.[0]?.secure_url || detail.thumbnail || '',
                      catalog_product_id: myProd.catalog_product_id,
                      seller_id: item.seller_id,
                      location: detail.seller_address?.city?.name && detail.seller_address?.state?.name
                        ? `${detail.seller_address.city.name}, ${detail.seller_address.state.name}`
                        : 'Desconhecida',
                      warranty: detail.warranty || 'Sem garantia',
                      shipping: {
                        free_shipping: detail.shipping?.free_shipping,
                        tags: detail.shipping?.logistic_type === 'fulfillment' ? ['fulfillment'] : []
                      },
                      reviews_count: reviewsCount,
                      rating_average: ratingAverage,
                      estimated_sales: estimatedSales,
                      estimated_revenue: estimatedRevenue
                    });
                  }
                }
              }
            }
          } catch (e) {
            console.error("Erro ao processar produto do catalogo", e);
          }
        }
      }
    }

    // Se o usuário não pesquisou por termo OU se o termo pesquisado não rendeu resultados nos produtos ativos,
    // tentamos buscar no Highlights da categoria (se a categoria foi fornecida).
    if (finalResults.length === 0 && (!term || category)) {
      // Sem termo ou fallback, buscar Melhores Vendedores (Highlights)
      const hlRes = await fetch(`https://api.mercadolibre.com/highlights/MLB/category/${category || 'MLB1403'}`, { headers, cache: 'no-store' });
      const hlData = await hlRes.json();
      if (hlData.content && hlData.content.length > 0) {
        topProducts = hlData.content.filter((c: any) => c.type === 'PRODUCT').slice(offset);
      }
      
      // Loop antigo apenas para Highlights
      if (topProducts.length > 0) {
        for (const prod of topProducts) {
          if (finalResults.length >= limit) break;
          
          try {
            const pDetailsRes = await fetch(`https://api.mercadolibre.com/products/${prod.id}`, { headers });
            const pDetails = await pDetailsRes.json();
            
            const pItemsRes = await fetch(`https://api.mercadolibre.com/products/${prod.id}/items`, { headers });
            const pItemsData = await pItemsRes.json();
            
            if (pItemsData.results && pDetails.name) {
              const topCompetitors = pItemsData.results.slice(0, 3);
              const brandAttr = pDetails.attributes?.find((a: any) => a.id === 'BRAND');
              
              for (const item of topCompetitors) {
                if (!item.price) continue;
                if (filterFull && item.shipping?.logistic_type !== 'fulfillment') continue;
                
                const originalPrice = item.original_price || item.price;
                const discountStr = originalPrice > item.price ? Math.round(((originalPrice - item.price) / originalPrice) * 100) : 0;
                
                let reviewsCount = 0;
                let ratingAverage = 0;
                try {
                  const targetReviewId = prod.id || item.item_id;
                  const revRes = await fetch(`https://api.mercadolibre.com/reviews/item/${targetReviewId}`, { headers });
                  if (revRes.ok) {
                    const revData = await revRes.json();
                    reviewsCount = revData.paging?.total || 0;
                    ratingAverage = revData.rating_average || 0;
                  }
                } catch(e) {}
                
                const estimatedSales = reviewsCount * 20;
                const estimatedRevenue = estimatedSales * item.price;
  
                finalResults.push({
                  rank: finalResults.length + 1,
                  id: item.item_id,
                  title: pDetails.name,
                  brand: brandAttr ? brandAttr.value_name : 'Genérico',
                  seller_category: item.category_id,
                  price: item.price,
                  original_price: item.original_price,
                  discount_percentage: discountStr,
                  permalink: `https://produto.mercadolivre.com.br/${item.item_id.replace('MLB', 'MLB-')}`,
                  thumbnail: pDetails.pictures?.[0]?.url || pDetails.pictures?.[0]?.secure_url || '',
                  catalog_product_id: prod.id,
                  seller_id: item.seller_id,
                  location: item.seller_address?.city?.name && item.seller_address?.state?.name 
                    ? `${item.seller_address.city.name}, ${item.seller_address.state.name}` 
                    : 'Desconhecida',
                  warranty: item.warranty || 'Sem garantia',
                  shipping: {
                    free_shipping: item.shipping?.free_shipping,
                    tags: item.shipping?.logistic_type === 'fulfillment' ? ['fulfillment'] : []
                  },
                  reviews_count: reviewsCount,
                  rating_average: ratingAverage,
                  estimated_sales: estimatedSales,
                  estimated_revenue: estimatedRevenue
                });
                
                if (finalResults.length >= limit) break;
              }
            }
          } catch (e) {}
        }
      }
    }
      
    // Ordenação em memória (se solicitada)
    if (sort === 'price_asc') {
      finalResults.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      finalResults.sort((a, b) => b.price - a.price);
    }

    // Re-aplica os Ranks finais após a ordenação
    finalResults = finalResults.map((item, index) => ({ ...item, rank: index + 1 }));

    finalResults = finalResults.slice(0, limit);

    if (finalResults.length > 0) {
      return NextResponse.json({ results: finalResults });
    }

    return NextResponse.json({ results: [] });
  } catch (error: any) {
    console.error("ML Spy API Error:", error);
    return NextResponse.json({ error: error.message || 'Falha ao buscar concorrentes' }, { status: 500 });
  }
}
