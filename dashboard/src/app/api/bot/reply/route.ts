import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * API Route: Bot Reply
 * POST /api/bot/reply
 * 
 * Recebe o payload bruto do webhook da Meta (via n8n ou direto),
 * gera uma resposta com IA (OpenAI GPT-4o-mini) e envia de volta
 * via Instagram Graph API ou Facebook Graph API (detecção automática).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Webhook structure from Meta (pode vir direto ou pré-processado pelo Telefonista)
    const entry = body.entry?.[0];
    if (!entry) return NextResponse.json({ success: true });

    const messaging = entry.messaging?.[0];
    if (!messaging || !messaging.message || !messaging.message.text) {
      return NextResponse.json({ success: true });
    }

    // Ignora echos (mensagens enviadas por nós mesmos)
    if (messaging.message.is_echo) {
      return NextResponse.json({ success: true, skipped: 'echo' });
    }

    const senderId = messaging.sender.id;
    const recipientId = messaging.recipient.id;
    const userMessage = messaging.message.text;

    console.log(`[Bot Reply] DM recebida de ${senderId} para conta ${recipientId}: "${userMessage.substring(0, 50)}..."`);

    // 1. Buscar credenciais da conta
    const { data: conta } = await supabase
      .from('contas')
      .select('ig_access_token, facebook_access_token, conta_id_facebook, nome_conta')
      .eq('conta_id_instagram', recipientId)
      .single();

    if (!conta) {
      console.error('[Bot Reply] Conta não encontrada para', recipientId);
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    // 2. Determinar qual API e token usar
    const hasFbToken = conta.facebook_access_token && conta.conta_id_facebook;
    const apiBase = hasFbToken
      ? 'https://graph.facebook.com/v21.0'
      : 'https://graph.instagram.com/v21.0';
    const accessToken = hasFbToken
      ? conta.facebook_access_token
      : conta.ig_access_token;

    if (!accessToken) {
      console.error('[Bot Reply] Nenhum token válido para conta', recipientId);
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 400 });
    }

    console.log(`[Bot Reply] Usando API: ${apiBase.includes('facebook') ? 'Facebook' : 'Instagram'}`);

    // 3. Gerar resposta com IA
    let replyText: string;

    if (OPENAI_API_KEY) {
      try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 256,
            temperature: 0.7,
            messages: [
              {
                role: 'system',
                content: `Você é o assistente virtual inteligente da conta "${conta.nome_conta || 'a loja'}". Seu papel:

1. Responda SEMPRE em português brasileiro, de forma simpática, profissional e direta.
2. Se o cliente perguntar sobre um produto, tente ajudar com base no contexto da mensagem.
3. Se for uma saudação (oi, olá, bom dia), responda de forma calorosa e pergunte como pode ajudar.
4. Não invente informações sobre preços ou disponibilidade.
5. Mantenha as respostas curtas (máximo 2-3 frases) para ficarem bem em DMs do Instagram.
6. Nunca mencione que você é uma IA ou robô. Aja como atendente humano.`
              },
              {
                role: 'user',
                content: userMessage
              }
            ]
          })
        });

        const aiData = await openaiRes.json();
        replyText = aiData.choices?.[0]?.message?.content || 'Olá! Como posso te ajudar hoje? 😊';
        console.log(`[Bot Reply] IA gerou: "${replyText.substring(0, 60)}..."`);
      } catch (aiError: any) {
        console.error('[Bot Reply] Erro na OpenAI:', aiError.message);
        replyText = 'Olá! Obrigado pela mensagem. Em breve um atendente irá responder. 😊';
      }
    } else {
      // Fallback sem OpenAI
      replyText = 'Olá! Obrigado pela mensagem. Em breve um atendente irá responder. 😊';
      console.log('[Bot Reply] OpenAI key não configurada, usando fallback');
    }

    // 4. Enviar resposta via Graph API
    const sendUrl = `${apiBase}/me/messages`;
    const fbRes = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        recipient: { id: senderId },
        message: { text: replyText }
      })
    });

    const fbData = await fbRes.json();
    
    if (fbData.error) {
      console.error('[Bot Reply] Meta API Error:', JSON.stringify(fbData.error));
      return NextResponse.json({ 
        error: fbData.error.message,
        code: fbData.error.code 
      }, { status: 400 });
    }

    console.log(`[Bot Reply] Resposta enviada com sucesso para ${senderId}`);

    return NextResponse.json({ 
      success: true, 
      replied: true,
      api: apiBase.includes('facebook') ? 'facebook' : 'instagram',
      messageId: fbData.message_id
    });
  } catch (error: any) {
    console.error('[Bot Reply] Erro interno:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
