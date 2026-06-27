import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { execSync } from 'child_process';
import path from 'path';

function extractMlbId(urlOrId: string) {
  if (!urlOrId) return null;
  if (urlOrId.startsWith('MLB')) return urlOrId.replace('-', '');
  const match = urlOrId.match(/MLB-?(\d+)/);
  if (match) return `MLB${match[1]}`;
  return null;
}

export async function POST(req: Request) {
  try {
    console.log("==========================================");
    console.log("🕒 Iniciando sincronização diária de preços");
    console.log("==========================================");

    const { data: ads, error } = await supabase.from('competitor_ads').select('*');
    if (error) throw new Error("Erro ao buscar anúncios: " + error.message);

    if (!ads || ads.length === 0) {
      return NextResponse.json({ success: true, message: "Nenhum anúncio rastreado." });
    }

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

    let results = [];
    for (const ad of ads) {
      const mlbId = extractMlbId(ad.ml_id || ad.url);
      if (!mlbId) continue;

      try {
        const res = await fetch(`https://api.mercadolibre.com/items/${mlbId}`, {
          headers: { 'Authorization': `Bearer ${mlToken}` }
        });
        
        if (res.ok) {
          const mlData = await res.json();
          if (mlData.price) {
            await supabase.from('price_history').insert({
              ad_id: ad.id,
              price: mlData.price,
              captured_at: new Date().toISOString()
            });
            results.push({ ad: ad.title, price: mlData.price });
          }
        }
      } catch (e) {
        console.error("Falha ao sync:", mlbId, e);
      }
    }

    return NextResponse.json({ success: true, synced: results.length, results });

  } catch (err: any) {
    console.error("Erro na sincronização:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
