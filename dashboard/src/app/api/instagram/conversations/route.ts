import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * API Route: Instagram Conversations
 * GET /api/instagram/conversations?accountId=xxx
 * 
 * Busca conversas (DMs) do Instagram via Graph API
 * Usa o ig_access_token e conta_id_instagram da tabela contas
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const platform = searchParams.get('platform') || 'instagram';

    if (!accountId) {
      return NextResponse.json({ error: 'accountId obrigatório' }, { status: 400 });
    }

    // 1. Buscar credenciais da conta
    const { data: account, error: accError } = await supabase
      .from('contas')
      .select('conta_id_instagram, ig_access_token, conta_id_facebook, facebook_access_token, nome_conta')
      .eq('id_conta', accountId)
      .single();

    if (accError || !account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const { ig_access_token, conta_id_instagram, conta_id_facebook, facebook_access_token } = account;

    if (!ig_access_token || !conta_id_instagram) {
      return NextResponse.json({ error: 'Credenciais do Instagram ausentes nesta conta' }, { status: 400 });
    }

    // 2. Determinar API com base no token disponível
    let conversationsUrl = '';

    if (facebook_access_token && conta_id_facebook) {
      // Fluxo Legado: Conectado via Facebook Login (Usa Page ID)
      const platformParam = platform === 'instagram' ? '&platform=instagram' : '';
      conversationsUrl = `https://graph.facebook.com/v21.0/${conta_id_facebook}/conversations?fields=participants,updated_time,messages.limit(1){message,from,created_time}${platformParam}&access_token=${facebook_access_token}&limit=25`;
    } else {
      // Fluxo Novo: Conectado via Instagram Business Login (Usa IG ID)
      conversationsUrl = `https://graph.instagram.com/v21.0/me/conversations?fields=participants,updated_time,messages.limit(1){message,from,created_time}&access_token=${ig_access_token}&limit=25`;
    }
    
    console.log(`[IG Conversations] Fetching for account ${accountId}, URL: ${conversationsUrl.split('access_token')[0]}`);

    const res = await fetch(conversationsUrl);
    const data = await res.json();

    if (data.error) {
      console.error('[IG Conversations] API Error:', data.error);
      return NextResponse.json({ 
        error: data.error.message || 'Erro na API',
        code: data.error.code,
        type: data.error.type
      }, { status: 400 });
    }

    // 3. Formatar conversas
    const conversations = (data.data || []).map((conv: any) => {
      const participants = conv.participants?.data || [];
      // O "outro" participante (não somos nós)
      const otherParticipant = participants.find((p: any) => p.id !== conta_id_facebook && p.id !== conta_id_instagram) || participants[0];
      const lastMessage = conv.messages?.data?.[0];
      
      return {
        id: conv.id,
        participantId: otherParticipant?.id || '',
        participantName: otherParticipant?.name || otherParticipant?.username || 'Usuário',
        participantUsername: otherParticipant?.username || '',
        lastMessage: lastMessage?.message || '',
        lastMessageTime: lastMessage?.created_time || conv.updated_time,
        lastMessageFrom: lastMessage?.from?.id || '',
        updatedTime: conv.updated_time,
        platform: platform
      };
    });

    return NextResponse.json({ 
      conversations,
      paging: data.paging,
      accountName: account.nome_conta
    });

  } catch (error: any) {
    console.error('[IG Conversations] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
