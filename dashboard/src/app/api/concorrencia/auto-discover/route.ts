import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { execSync } from 'child_process';
import path from 'path';

const ANDRE_SELLER_ID = 428354884;

export async function POST(req: Request) {
  try {
    console.log("==========================================");
    console.log("🕵️ Iniciando Descoberta Automática de Concorrentes (Top 25)");
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

    // 2. Busca todos os anúncios ativos do André (paginação simplificada limit 100)
    console.log("🔍 Buscando lista de produtos do André no ML...");
    const searchRes = await fetch(`https://api.mercadolibre.com/users/${ANDRE_SELLER_ID}/items/search?status=active&limit=100`, {
      headers: { 'Authorization': `Bearer ${mlToken}` }
    });
    if (!searchRes.ok) throw new Error("Falha ao buscar itens do vendedor.");
    const searchData = await searchRes.json();
    const myItemIds = searchData.results || [];
    console.log(`Encontrados ${myItemIds.length} produtos do André.`);

    // 3. Busca os detalhes para pegar os títulos (em lotes de 20)
    let myProducts: string[] = [];
    for (let i = 0; i < myItemIds.length; i += 20) {
      const chunk = myItemIds.slice(i, i + 20).join(',');
      const itemsRes = await fetch(`https://api.mercadolibre.com/items?ids=${chunk}`, {
        headers: { 'Authorization': `Bearer ${mlToken}` }
      });
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        itemsData.forEach((itemObj: any) => {
          if (itemObj.body && itemObj.body.title) {
            myProducts.push(itemObj.body.title);
          }
        });
      }
    }

    // Pega todos os tracked_products atuais para evitar duplicar
    const { data: trackedData } = await supabase.from('tracked_products').select('*');
    let trackedProducts = trackedData || [];

    let resultsSummary = [];

    for (const productName of myProducts) {
      console.log(`\n🔍 Buscando top 25 para: ${productName}`);

      // Cria o tracked_product se não existir
      let trackedProduct = trackedProducts.find(t => t.name.toLowerCase() === productName.toLowerCase());
      if (!trackedProduct) {
        const { data: newTracked, error } = await supabase.from('tracked_products').insert({ name: productName }).select('*').single();
        if (error || !newTracked) {
          console.error("Erro ao criar tracked_product para", productName);
          continue;
        }
        trackedProduct = newTracked;
        trackedProducts.push(newTracked);
      }

      // Busca no Mercado Livre com paginação até achar 25 concorrentes
      try {
        const query = encodeURIComponent(productName);
        let concorrentes: any[] = [];
        let currentOffset = 0;
        let hasMore = true;
        
        while (concorrentes.length < 25 && hasMore && currentOffset < 150) { // max 3 pages (150)
          const res = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${query}&limit=50&offset=${currentOffset}`, {
            headers: { 'Authorization': `Bearer ${mlToken}` }
          });

          if (!res.ok) {
            console.error(`Falha ao buscar ${productName} no ML:`, res.statusText);
            break;
          }

          const mlData = await res.json();
          const items = mlData.results || [];
          
          if (items.length === 0) {
            hasMore = false;
            break;
          }
          
          const validItems = items.filter((item: any) => item.seller?.id !== ANDRE_SELLER_ID);
          for (const vItem of validItems) {
            if (concorrentes.length < 25) {
              concorrentes.push(vItem);
            }
          }
          
          currentOffset += 50;
        }

        if (concorrentes.length === 0) continue;

        // Busca os anúncios já salvos para este produto para não duplicar na tabela competitor_ads
        const { data: existingAds } = await supabase.from('competitor_ads').select('id, ml_id').eq('product_id', trackedProduct.id);
        const existingMap = new Map((existingAds || []).map(ad => [ad.ml_id, ad.id]));

        let addedCount = 0;

        for (const item of concorrentes) {
          let adId = existingMap.get(item.id);

          if (!adId) {
            // Insere novo anúncio concorrente
            const { data: newAd, error: errAd } = await supabase.from('competitor_ads').insert({
              product_id: trackedProduct.id,
              title: item.title,
              url: item.permalink,
              ml_id: item.id,
              seller_name: item.seller?.nickname || `Seller_${item.seller?.id}`
            }).select('id').single();

            if (errAd || !newAd) {
              console.error("Erro ao salvar concorrente", item.id);
              continue;
            }
            adId = newAd.id;
            existingMap.set(item.id, adId);
            addedCount++;
          }

          // Insere histórico de preço de hoje
          await supabase.from('price_history').insert({
            ad_id: adId,
            price: item.price,
            captured_at: new Date().toISOString()
          });
        }

        resultsSummary.push({ product: productName, adsFound: concorrentes.length, newAdsAdded: addedCount });

      } catch (e) {
        console.error("Exceção ao buscar", productName, e);
      }
    }

    return NextResponse.json({ success: true, summary: resultsSummary });

  } catch (err: any) {
    console.error("Erro na auto-descoberta:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
