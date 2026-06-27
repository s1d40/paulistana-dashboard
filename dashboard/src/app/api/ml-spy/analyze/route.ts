import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { item_id, item_title } = await request.json();

    if (!item_id) {
      return NextResponse.json({ error: 'O ID do item é obrigatório' }, { status: 400 });
    }

    // Busca o token do Mercado Livre
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
    }

    const headers: Record<string, string> = {};
    if (mlToken) {
      headers['Authorization'] = `Bearer ${mlToken}`;
    }

    // 1. Buscar a Descrição do Anúncio (Copywriting)
    let descriptionText = '';
    let catalogProductId = '';
    let productTitle = '';
    
    try {
      // Pega dados do item para pegar o ID de catálogo (essencial para reviews)
      const itemRes = await fetch(`https://api.mercadolibre.com/items/${item_id}`, { headers });
      const itemData = await itemRes.json();
      productTitle = itemData.title || item_title || '';
      if (itemData.catalog_product_id) {
        catalogProductId = itemData.catalog_product_id;
      }
      
      const descRes = await fetch(`https://api.mercadolibre.com/items/${item_id}/description`, { headers });
      const descData = await descRes.json();
      if (descData.plain_text) {
        descriptionText = descData.plain_text;
      }
    } catch (e) {
      console.error("Erro ao buscar descrição:", e);
    }

    // 2. Buscar as Avaliações (Mineração de Review)
    let reviewsList: any[] = [];
    let ratingAverage = 0;
    try {
      // Usa catalog_product_id se existir (Mercado Livre exige isso para reviews agora)
      const reviewTargetId = catalogProductId || item_id;
      const reviewRes = await fetch(`https://api.mercadolibre.com/reviews/item/${reviewTargetId}`, { headers });
      const reviewData = await reviewRes.json();
      if (reviewData.reviews) {
        reviewsList = reviewData.reviews;
        ratingAverage = reviewData.rating_average || 0;
      }
    } catch (e) {
      console.error("Erro ao buscar reviews:", e);
    }

    // 3. Montar o payload para o n8n
    const reviewTexts = reviewsList.map((r: any) => `[NOTA ${r.rate}]: ${r.content}`).join('\n');
    
    const systemMessage = `
Você é um especialista em Copywriting de Resposta Direta e Analista de Mercado. 
Analise as informações do anúncio concorrente no Mercado Livre e faça uma engenharia reversa para o nosso time de criação.

Por favor, forneça a sua análise formatada em Markdown, dividida OBRIGATORIAMENTE nas seguintes seções:
1. **Gatilhos Mentais Utilizados:** Quais gatilhos de persuasão a copy usa?
2. **Promessa Principal:** Qual é o grande benefício prometido na copy?
3. **Mina de Ouro (O que os clientes amam):** Com base nas avaliações reais ou em seu vasto conhecimento do nicho.
4. **Calcanhar de Aquiles (O que os clientes odeiam):** O principal defeito do concorrente que o nosso produto deve focar em resolver.
    `.trim();

    const userPrompt = `
--- DADOS DO PRODUTO ---
ID do Anúncio: ${item_id}
Título: ${productTitle}

--- DESCRIÇÃO DO ANÚNCIO (COPY DO CONCORRENTE) ---
${descriptionText || 'A API ocultou a descrição. Analise os gatilhos e promessa principal deduzindo APENAS pelo título do produto fornecido e usando seu conhecimento de mercado.'}

--- AVALIAÇÕES DOS CLIENTES (DORES E DESEJOS) ---
${reviewTexts || 'A API ocultou as avaliações. Como não temos reviews do anúncio, atue como um profundo conhecedor do nicho e LEVANTE HIPÓTESES fortíssimas sobre a Mina de Ouro (o que clientes desse produto mais amam) e o Calcanhar de Aquiles (pior defeito do concorrente).'}
    `.trim();

    // 4. Enviar para a IA (usando Webhook do n8n do usuário)
    const N8N_ANALYZE_WEBHOOK = 'https://n8n.sfaisolutions.com/webhook/482b0dfc-682c-4f1f-bf8a-cb2063f021b4';
    let iaSummary = '';
    
    try {
      const response = await fetch(N8N_ANALYZE_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.N8N_API_TOKEN || ''}`,
        },
        body: JSON.stringify({
          user_prompt: userPrompt,
          system_message: systemMessage,
          config: {
            model: "claude-sonnet-4-6", // Modelo sugerido
            temperature: 0.7,
            prompt: "Retorne o texto formatado em markdown com as 4 seções solicitadas."
          }
        }),
      });

      if (response.ok) {
        const rawText = await response.text();
        const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        try {
          const parsed = JSON.parse(cleanedText);
          // O webhook roteirista geralmente retorna dentro de 'script' ou manda direto o objeto
          iaSummary = parsed.script || parsed.output || parsed.message || cleanedText;
          if (typeof iaSummary === 'object') {
            iaSummary = JSON.stringify(iaSummary, null, 2);
          }
        } catch (e) {
          // Se a IA retornou Markdown direto e não JSON
          iaSummary = cleanedText;
        }
      } else {
        const errText = await response.text();
        console.error("N8N Webhook falhou:", response.status, errText);
        iaSummary = "O Webhook do n8n retornou um erro ou está indisponível no momento.";
      }
    } catch (aiError) {
      console.error("Erro ao chamar o Webhook do n8n:", aiError);
      iaSummary = "Falha de comunicação com o webhook do n8n.";
    }

    return NextResponse.json({
      description: descriptionText,
      rating_average: ratingAverage,
      reviews_count: reviewsList.length,
      ai_analysis: iaSummary,
      raw_reviews: reviewsList.slice(0, 10) // Manda as top 10 cruas pro front
    });

  } catch (error: any) {
    console.error("ML Analyze API Error:", error);
    return NextResponse.json({ error: error.message || 'Falha ao analisar o anúncio' }, { status: 500 });
  }
}
