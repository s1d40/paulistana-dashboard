import { NextResponse } from 'next/server';
import { initializePostInSupabase } from '@/services/supabase-service';

const N8N_PRODUCTION_WEBHOOK = process.env.N8N_WEBHOOK_CONTEUDO_URL || 'https://n8n.sfaisolutions.com/webhook/2647428e-f69b-4f16-a665-13f4cc97b380';
const N8N_SINGLE_PRODUCTION_WEBHOOK = process.env.N8N_WEBHOOK_CONTEUDO_URL || 'https://n8n.sfaisolutions.com/webhook/2647428e-f69b-4f16-a665-13f4cc97b380';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, presetId, presetName, systemMessage, prompt, items, id_conta, chat_id } = body;

    // --- ACTION: INITIALIZE (Supabase) ---
    if (action === 'initialize') {
      if (!items || !Array.isArray(items)) {
        return NextResponse.json({ error: 'Lista de itens inválida.' }, { status: 400 });
      }

      try {
        // Inicializar cada item no Supabase
        await Promise.all(items.map(item => 
          initializePostInSupabase(item, presetName || 'Geral', id_conta || '')
        ));
        return NextResponse.json({ success: true });
      } catch (error: unknown) {
        console.error('Erro ao inicializar no Supabase:', error);
        const message = error instanceof Error ? error.message : 'Erro interno';
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    // --- ACTION: INIT_POST (Single Post Initialization) ---
    if (action === 'init_post') {
      const { id_post, tema_post, titulo_post, roteiro_gerado, status, id_conta, production_list_id, captions, hashtags } = body;
      
      if (!id_post) {
        return NextResponse.json({ error: 'id_post ausente.' }, { status: 400 });
      }

       try {
        const postToUpsert: Record<string, unknown> = {
          id_post,
          tema_post,
          titulo_post,
          roteiro_gerado,
          captions,
          hashtags,
          status: status || 'Aguardando Revisão',
          images_status: 'Pendente',
          audio_status: 'Pendente',
          video_status: 'Pendente'
        };

        // Só vincular id_conta se existir (evita FK violation)
        if (id_conta) {
          postToUpsert.id_conta = id_conta;
        }

        if (production_list_id) {
          postToUpsert.production_list_id = production_list_id;
        }

        // Só definir data_criacao se for um post novo (difícil saber no upsert sem ler antes, 
        // mas podemos omitir se o banco tiver um default, ou ler antes)
        // Para simplificar e ser seguro no upsert:
        const { data: existing } = await (await import('@/lib/supabase')).supabase
          .from('posts')
          .select('data_criacao')
          .eq('id_post', id_post)
          .maybeSingle();

        if (!existing) {
          postToUpsert.data_criacao = new Date().toISOString();
        }

        const { data, error } = await (await import('@/lib/supabase')).supabase
          .from('posts')
          .upsert(postToUpsert, { onConflict: 'id_post' })
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
      } catch (error: unknown) {
        console.error('Erro ao criar/atualizar post no Supabase:', error);
        const message = error instanceof Error ? error.message : 'Erro interno';
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    // --- ACTION: MASS PRODUCTION OR SINGLE PRODUCTION (n8n Webhook) ---
    if (action === 'mass_production' || action === 'single_production') {
      if (!systemMessage) {
        return NextResponse.json({ error: 'System Message ausente no preset ativo.' }, { status: 400 });
      }

      const webhookUrl = action === 'mass_production' ? N8N_PRODUCTION_WEBHOOK : N8N_SINGLE_PRODUCTION_WEBHOOK;

      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
        },
        body: JSON.stringify({
          source: 'dashboard',
          action: action,
          id_conta: id_conta || '',
          chat_id: chat_id || '',
          production_list_id: body.production_list_id || null,
          preset: {
            id: presetId,
            name: presetName,
            systemMessage: systemMessage,
            prompt: prompt || '',
          },
          items: items || [],
          timestamp: new Date().toISOString(),
        }),
      }).catch(err => console.error('[Mass Production API] Background fetch error:', err));

      return NextResponse.json({ success: true, data: { message: 'Produção iniciada em segundo plano com sucesso!' } });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });

  } catch (error: unknown) {
    console.error('Erro na rota de produção:', error);
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
