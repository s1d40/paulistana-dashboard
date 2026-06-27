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
      // No Windows use 'venv\\Scripts\\activate', no Linux/Mac use 'source venv/bin/activate'
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

    // Se o usuário digitou um termo de busca, usamos a API de itens (Sites) diretamente
    if (term) {
      let currentOffset = offset;
      let totalFetched = 0;
      let hasMore = true;
      const mlLimit = 50; // Sempre busca 50 por vez do ML
      let sortParam = '';
      if (sort === 'price_asc') sortParam = '&sort=price_asc';
      if (sort === 'price_desc') sortParam = '&sort=price_desc';
      
      let catParam = category ? `&category=${category}` : ''; 
      
      while (finalResults.length < limit && hasMore && totalFetched < 250) { // max 5 páginas (250 itens)
        const searchRes = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(term)}${catParam}&limit=${mlLimit}&offset=${currentOffset}${sortParam}`, { headers, cache: 'no-store' });
        const searchData = await searchRes.json();
        
        if (searchData.results && searchData.results.length > 0) {
          let items = searchData.results;
          totalFetched += items.length;
          
          for (const item of items) {
          if (!item.price) continue;
          if (filterFull && item.shipping?.logistic_type !== 'fulfillment') continue;
          
          const originalPrice = item.original_price || item.price;
          const discountStr = originalPrice > item.price ? Math.round(((originalPrice - item.price) / originalPrice) * 100) : 0;
          
          let sellerCategoryName = item.category_id;
          // Pular busca de nome de categoria por item para acelerar a API, usar cache se der
          
          // Buscar reviews
          let reviewsCount = 0;
          let ratingAverage = 0;
          try {
            const targetReviewId = item.catalog_product_id || item.id;
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
            id: item.id,
            title: item.title,
            brand: 'Genérico', // Não temos atributo de marca garantido aqui
            seller_category: sellerCategoryName,
            price: item.price,
            original_price: item.original_price,
            discount_percentage: discountStr,
            permalink: item.permalink,
            thumbnail: item.thumbnail?.replace('-I.jpg', '-O.jpg') || '',
            catalog_product_id: item.catalog_product_id || null,
            seller_id: item.seller?.id,
            location: item.address?.city_name && item.address?.state_name 
              ? `${item.address.city_name}, ${item.address.state_name}` 
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
        currentOffset += mlLimit;
      } else {
        hasMore = false;
      }
    }
    } else {
      // Sem termo, buscar Melhores Vendedores (Highlights)
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
