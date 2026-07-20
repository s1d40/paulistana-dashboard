import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { execSync } from 'child_process';
import path from 'path';

const ANDRE_SELLER_ID = 428354884;

export async function POST(req: Request) {
  try {
    console.log("==========================================");
    console.log("🕵️ Iniciando Descoberta Automática de Concorrentes (via Catálogo)");
    console.log("==========================================");

    // 1. Pega o token do ML
    let mlToken;
    try {
      const scriptPath = path.join(process.cwd(), '../scripts/mercado_livre');
      mlToken = execSync('source venv/bin/activate && python print_token.py', { 
        cwd: scriptPath, 
        encoding: 'utf-8', 
        shell: '/bin/bash' 
      }).trim();
    } catch (e: any) {
      throw new Error("Erro ao pegar token ML: " + (e.message || e));
    }

    const headers = { 'Authorization': `Bearer ${mlToken}` };

    // 2. Busca todos os anúncios ativos do André (paginação até 200)
    console.log("🔍 Buscando lista de produtos do André no ML...");
    let myItemIds: string[] = [];
    let offset = 0;
    
    while (offset < 200) {
      const searchRes = await fetch(
        `https://api.mercadolibre.com/users/${ANDRE_SELLER_ID}/items/search?status=active&limit=100&offset=${offset}`,
        { headers }
      );
      if (!searchRes.ok) throw new Error("Falha ao buscar itens do vendedor.");
      const searchData = await searchRes.json();
      const ids = searchData.results || [];
      myItemIds.push(...ids);
      if (ids.length < 100) break;
      offset += 100;
    }
    
    console.log(`Encontrados ${myItemIds.length} produtos do André.`);

    // 3. Busca detalhes em lotes de 20 para pegar catalog_product_id e título
    interface MyProduct {
      id: string;
      title: string;
      catalogId: string | null;
      price: number;
    }
    
    let myProducts: MyProduct[] = [];
    for (let i = 0; i < myItemIds.length; i += 20) {
      const chunk = myItemIds.slice(i, i + 20).join(',');
      const itemsRes = await fetch(`https://api.mercadolibre.com/items?ids=${chunk}`, { headers });
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        itemsData.forEach((itemObj: any) => {
          const body = itemObj.body;
          if (body?.title) {
            myProducts.push({
              id: body.id,
              title: body.title,
              catalogId: body.catalog_product_id || null,
              price: body.price || 0
            });
          }
        });
      }
    }

    console.log(`${myProducts.filter(p => p.catalogId).length} de ${myProducts.length} produtos têm catálogo ML.`);

    // Pega todos os tracked_products atuais para evitar duplicar
    const { data: trackedData } = await supabase.from('tracked_products').select('*');
    let trackedProducts = trackedData || [];

    let resultsSummary = [];

    for (const product of myProducts) {
      if (!product.catalogId) {
        console.log(`⏭️ Pulando ${product.title.slice(0, 40)} (sem catálogo)`);
        continue;
      }

      console.log(`\n🔍 Buscando concorrentes do catálogo ${product.catalogId} para: ${product.title.slice(0, 50)}`);

      // Cria o tracked_product se não existir
      let trackedProduct = trackedProducts.find(t => t.name.toLowerCase() === product.title.toLowerCase());
      if (!trackedProduct) {
        const { data: newTracked, error } = await supabase.from('tracked_products').insert({ name: product.title }).select('*').single();
        if (error || !newTracked) {
          console.error("Erro ao criar tracked_product para", product.title);
          continue;
        }
        trackedProduct = newTracked;
        trackedProducts.push(newTracked);
      }

      // Busca concorrentes via catálogo — /products/{catalogId}/items
      try {
        let concorrentes: any[] = [];
        let catalogOffset = 0;
        
        while (concorrentes.length < 25 && catalogOffset < 100) {
          const res = await fetch(
            `https://api.mercadolibre.com/products/${product.catalogId}/items?limit=50&offset=${catalogOffset}`,
            { headers }
          );

          if (!res.ok) {
            console.error(`Falha ao buscar catálogo ${product.catalogId}:`, res.status);
            break;
          }

          const catData = await res.json();
          const items = catData.results || [];
          
          if (items.length === 0) break;

          // Filtra vendedores que NÃO são o André
          const validItems = items.filter((item: any) => item.seller_id !== ANDRE_SELLER_ID);
          for (const vItem of validItems) {
            if (concorrentes.length < 25) {
              concorrentes.push(vItem);
            }
          }
          
          catalogOffset += 50;
          
          // Se pegou menos que 50, não tem mais
          if (items.length < 50) break;
        }

        if (concorrentes.length === 0) {
          console.log(`  Nenhum concorrente encontrado no catálogo ${product.catalogId}`);
          continue;
        }

        console.log(`  Encontrados ${concorrentes.length} concorrentes!`);

        // Busca detalhes completos dos concorrentes via multi-get
        const concorrenteIds = concorrentes.map((c: any) => c.item_id).filter(Boolean);
        let detailedItems: Map<string, any> = new Map();
        
        for (let i = 0; i < concorrenteIds.length; i += 20) {
          const chunk = concorrenteIds.slice(i, i + 20).join(',');
          const detailRes = await fetch(`https://api.mercadolibre.com/items?ids=${chunk}`, { headers });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            detailData.forEach((d: any) => {
              if (d.body) detailedItems.set(d.body.id, d.body);
            });
          }
        }

        // Busca os anúncios já salvos para este produto para não duplicar
        const { data: existingAds } = await supabase.from('competitor_ads').select('id, ml_id').eq('product_id', trackedProduct.id);
        const existingMap = new Map((existingAds || []).map(ad => [ad.ml_id, ad.id]));

        let addedCount = 0;

        for (const item of concorrentes) {
          const itemId = item.item_id;
          const detail = detailedItems.get(itemId);
          
          let adId = existingMap.get(itemId);

          if (!adId) {
            const { data: newAd, error: errAd } = await supabase.from('competitor_ads').insert({
              product_id: trackedProduct.id,
              title: detail?.title || item.title || product.title,
              url: detail?.permalink || `https://produto.mercadolivre.com.br/${itemId?.replace('MLB', 'MLB-')}`,
              ml_id: itemId,
              seller_name: detail?.seller?.nickname || `Seller_${item.seller_id}`
            }).select('id').single();

            if (errAd || !newAd) {
              console.error("Erro ao salvar concorrente", itemId);
              continue;
            }
            adId = newAd.id;
            existingMap.set(itemId, adId);
            addedCount++;
          }

          // Insere histórico de preço de hoje
          const price = detail?.price || item.price;
          if (price) {
            await supabase.from('price_history').insert({
              ad_id: adId,
              price,
              captured_at: new Date().toISOString()
            });
          }
        }

        resultsSummary.push({ 
          product: product.title, 
          catalogId: product.catalogId,
          adsFound: concorrentes.length, 
          newAdsAdded: addedCount 
        });

      } catch (e) {
        console.error("Exceção ao buscar catálogo", product.catalogId, e);
      }
    }

    return NextResponse.json({ success: true, summary: resultsSummary });

  } catch (err: any) {
    console.error("Erro na auto-descoberta:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
