import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * API Route: Instagram Comment Engagement
 * POST /api/instagram/comments/engage
 * 
 * Ações: like, unlike, delete
 * Requer permissão: instagram_manage_engagement (para like/unlike)
 *                    pages_manage_engagement (para delete via FB Login)
 */
export async function POST(request: Request) {
  try {
    const { accountId, commentId, action } = await request.json();

    if (!accountId || !commentId || !action) {
      return NextResponse.json({ error: 'accountId, commentId e action são obrigatórios' }, { status: 400 });
    }

    if (!['like', 'unlike', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida. Use: like, unlike ou delete' }, { status: 400 });
    }

    // 1. Buscar credenciais
    const { data: account, error: accError } = await supabase
      .from('contas')
      .select('ig_access_token, facebook_access_token, conta_id_facebook, conta_id_instagram')
      .eq('id_conta', accountId)
      .single();

    if (accError || !account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    const { ig_access_token, facebook_access_token, conta_id_facebook } = account;

    // 2. Determinar API e token
    let apiBase: string;
    let accessToken: string;
    let fetchHeaders: Record<string, string> = {};

    if (facebook_access_token && conta_id_facebook) {
      // Fluxo Facebook Login
      apiBase = 'https://graph.facebook.com/v21.0';
      accessToken = facebook_access_token;
    } else if (ig_access_token) {
      // Fluxo Instagram Business Login
      apiBase = 'https://graph.instagram.com/v21.0';
      accessToken = ig_access_token;
      fetchHeaders = { 'Authorization': `Bearer ${accessToken}` };
    } else {
      return NextResponse.json({ error: 'Nenhum token disponível' }, { status: 400 });
    }

    let url: string;
    let method: string;

    switch (action) {
      case 'like':
        // POST /{comment-id}/likes
        url = `${apiBase}/${commentId}/likes`;
        method = 'POST';
        break;
      case 'unlike':
        // DELETE /{comment-id}/likes
        url = `${apiBase}/${commentId}/likes`;
        method = 'DELETE';
        break;
      case 'delete':
        // DELETE /{comment-id}
        url = `${apiBase}/${commentId}`;
        method = 'DELETE';
        break;
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    // Adicionar access_token na URL para FB Login (sem header)
    if (!fetchHeaders['Authorization']) {
      url += `?access_token=${encodeURIComponent(accessToken)}`;
    }

    console.log(`[IG Engage] ${action} on comment ${commentId}, URL: ${url.split('access_token')[0]}`);

    const res = await fetch(url, {
      method,
      headers: fetchHeaders,
    });

    const data = await res.json();

    if (data.error) {
      console.error(`[IG Engage] Error on ${action}:`, data.error);
      return NextResponse.json({
        error: data.error.message || `Erro ao executar ${action}`,
        code: data.error.code,
      }, { status: 400 });
    }

    console.log(`✅ [IG Engage] ${action} success on comment ${commentId}`);
    return NextResponse.json({ success: true, action });

  } catch (error: any) {
    console.error('[IG Engage] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
