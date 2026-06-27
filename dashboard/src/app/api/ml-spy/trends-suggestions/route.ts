import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '5');

    let mlToken = '';
    try {
      const scriptPath = path.join(process.cwd(), '../scripts/mercado_livre');
      mlToken = execSync('source venv/bin/activate && python print_token.py', { 
        cwd: scriptPath, 
        encoding: 'utf-8',
        stdio: 'pipe',
        shell: '/bin/bash'
      }).trim();
    } catch (e) {
      console.warn("Sem token ML");
    }

    if (!mlToken) return NextResponse.json({ error: 'Token ML não configurado' }, { status: 500 });
    const headers = { 'Authorization': `Bearer ${mlToken}` };
    const ANDRE_SELLER_ID = 428354884;

    // 1. Pega as Tendências de Alimentos (MLB1403)
    let topTrends = [];
    try {
      const trendsRes = await fetch(`https://api.mercadolibre.com/trends/MLB/MLB1403`, { headers });
      if (trendsRes.ok) {
        const tData = await trendsRes.json();
        topTrends = tData.map((t: any) => t.keyword).slice(0, 50);
      }
    } catch(e) {}

    if (topTrends.length === 0) {
      // Fallback
      topTrends = ["festa junina", "triturador alho", "ninho", "manteiga de cacau", "morango liofilizado", "leite de coco"];
    }

    // 2. Busca anúncios do André ordenados por vendas (sold_quantity_desc)
    const searchRes = await fetch(`https://api.mercadolibre.com/users/${ANDRE_SELLER_ID}/items/search?status=active&orders=sold_quantity_desc&limit=${limit}&offset=${offset}`, { headers });
    const searchData = await searchRes.json();
    const itemIds = searchData.results || [];

    if (itemIds.length === 0) return NextResponse.json({ results: [] });

    // 3. Pega detalhes dos itens
    const itemsRes = await fetch(`https://api.mercadolibre.com/items?ids=${itemIds.join(',')}`, { headers });
    const itemsData = await itemsRes.json();
    
    const productsList = itemsData.map((res: any) => {
        return { id: res.body.id, title: res.body.title, price: res.body.price, sold: res.body.sold_quantity };
    });

    // 4. Manda pra IA (n8n Webhook)
    const systemMessage = `
Você é um Especialista em SEO do Mercado Livre.
Sua missão é pegar o título atual de alguns anúncios e otimizá-los usando os TERMOS MAIS BUSCADOS (Trends) da categoria no Mercado Livre.
Retorne APENAS um array JSON, sem markdown em volta, exatamente neste formato:
[
  { "id": "MLB...", "currentTitle": "...", "suggestedTitle": "...", "reason": "..." }
]
`.trim();

    const userPrompt = `
TERMOS MAIS BUSCADOS HOJE (TRENDS DA CATEGORIA):
${topTrends.join(', ')}

ANÚNCIOS PARA OTIMIZAR:
${JSON.stringify(productsList, null, 2)}

Para cada anúncio, sugira um título com no máximo 60 caracteres que inclua palavras-chave do Trends SE FOR RELEVANTE para o produto (ex: adicionar 'Festa Junina' se for um doce ou amendoim).
Retorne o JSON estrito.
`.trim();

    const N8N_ANALYZE_WEBHOOK = 'https://n8n.sfaisolutions.com/webhook/482b0dfc-682c-4f1f-bf8a-cb2063f021b4';
    let iaResult = [];
    
    try {
      const response = await fetch(N8N_ANALYZE_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.N8N_API_TOKEN || ''}` },
        body: JSON.stringify({
          user_prompt: userPrompt,
          system_message: systemMessage,
          config: { model: "claude-sonnet-4-6", temperature: 0.2, prompt: "JSON format only" }
        }),
      });

      if (response.ok) {
        const rawText = await response.text();
        const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        try {
          const parsed = JSON.parse(cleanedText);
          const theArray = parsed.script || parsed.output || parsed.message || parsed;
          if (Array.isArray(theArray)) {
            iaResult = theArray;
          } else if (typeof theArray === 'string') {
             // as vezes o n8n manda a string jsonificada de novo
             iaResult = JSON.parse(theArray);
          }
        } catch (e) {
          console.error("Erro no parse JSON da IA:", e, cleanedText);
        }
      }
    } catch (aiError) {
      console.error("Erro webhook n8n:", aiError);
    }

    // Combina dados do item com a sugestão da IA
    const results = productsList.map((prod: any) => {
        const suggestion = iaResult.find((s: any) => s.id === prod.id) || {};
        return {
            ...prod,
            suggestedTitle: suggestion.suggestedTitle || "IA não retornou sugestão clara",
            reason: suggestion.reason || "Erro na geração",
            topTrends: topTrends.slice(0, 10)
        }
    });

    return NextResponse.json({ results, nextOffset: offset + limit });

  } catch (error: any) {
    console.error("Trends Sug Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
