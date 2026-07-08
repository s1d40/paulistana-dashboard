import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * API Route: Instagram Messages
 * GET /api/instagram/messages?accountId=xxx&conversationId=yyy
 * 
 * Busca mensagens de uma conversa específica via Graph API
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const conversationId = searchParams.get('conversationId');

    if (!accountId || !conversationId) {
      return NextResponse.json({ error: 'accountId e conversationId obrigatórios' }, { status: 400 });
    }

    // 1. Buscar credenciais da conta
    const { data: account, error: accError } = await supabase
      .from('contas')
      .select('conta_id_instagram, ig_access_token, conta_id_facebook, facebook_access_token')
      .eq('id_conta', accountId)
      .single();

    if (accError || !account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const pageToken = account.facebook_access_token || account.ig_access_token;
    const pageId = account.conta_id_facebook;

    // 2. Buscar mensagens da conversa
    const messagesUrl = `https://graph.facebook.com/v21.0/${conversationId}?fields=messages{id,message,from,to,created_time,attachments}&access_token=${pageToken}&limit=50`;

    const res = await fetch(messagesUrl);
    const data = await res.json();

    if (data.error) {
      console.error('[IG Messages] API Error:', data.error);
      return NextResponse.json({ 
        error: data.error.message || 'Erro na API do Instagram',
        code: data.error.code
      }, { status: 400 });
    }

    // 3. Formatar mensagens
    const rawMessages = data.messages?.data || [];
    const messages = rawMessages.map((msg: any) => {
      const isFromMe = msg.from?.id === pageId || msg.from?.id === account.conta_id_instagram;
      
      return {
        id: msg.id,
        text: msg.message || '',
        timestamp: msg.created_time,
        isFromMe,
        fromId: msg.from?.id || '',
        fromName: msg.from?.name || msg.from?.username || '',
        attachments: msg.attachments?.data || [],
        type: msg.attachments?.data?.length ? 'media' : 'text'
      };
    });

    // Reverter ordem (API retorna mais recente primeiro)
    messages.reverse();

    return NextResponse.json({ 
      messages,
      conversationId,
      paging: data.messages?.paging
    });

  } catch (error: any) {
    console.error('[IG Messages] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/instagram/messages
 * Body: { accountId, recipientId, text }
 * 
 * Envia uma mensagem de resposta via Instagram Messaging API
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, recipientId, text } = body;

    if (!accountId || !recipientId || !text) {
      return NextResponse.json({ error: 'accountId, recipientId e text obrigatórios' }, { status: 400 });
    }

    // 1. Buscar credenciais da conta
    const { data: account, error: accError } = await supabase
      .from('contas')
      .select('conta_id_instagram, ig_access_token, conta_id_facebook, facebook_access_token')
      .eq('id_conta', accountId)
      .single();

    if (accError || !account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const pageToken = account.facebook_access_token || account.ig_access_token;
    const pageId = account.conta_id_facebook;

    // 2. Enviar mensagem via Page Messaging API
    const sendUrl = `https://graph.facebook.com/v21.0/${pageId}/messages?access_token=${pageToken}`;

    console.log(`[IG Send] Sending message to ${recipientId} via page ${pageId}`);

    const res = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
        messaging_type: 'RESPONSE',
        tag: 'HUMAN_AGENT'
      })
    });

    const data = await res.json();

    if (data.error) {
      console.error('[IG Send] API Error:', data.error);
      return NextResponse.json({ 
        error: data.error.message || 'Erro ao enviar mensagem',
        code: data.error.code
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      messageId: data.message_id,
      recipientId: data.recipient_id
    });

  } catch (error: any) {
    console.error('[IG Send] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
