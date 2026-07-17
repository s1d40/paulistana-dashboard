import { NextResponse } from 'next/server';

/**
 * API Route: Google OAuth 2.0 — Refresh Token
 * POST /api/auth/google/refresh
 * Body: { conta_id: string }
 * 
 * Renova o access_token usando o refresh_token armazenado.
 * Google access_tokens expiram em 1 hora (diferente do FB que dura 60 dias).
 * Deve ser chamado automaticamente antes de operações com a YouTube API.
 */
export async function POST(request: Request) {
  try {
    const { conta_id } = await request.json();

    if (!conta_id) {
      return NextResponse.json({ error: 'conta_id é obrigatório' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_YOUTUBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Google OAuth credentials not configured' }, { status: 500 });
    }

    // 1. Buscar credenciais atuais do banco
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: account, error: dbError } = await supabaseAdmin
      .from('contas')
      .select('yt_credencial')
      .eq('id_conta', conta_id)
      .single();

    if (dbError || !account?.yt_credencial) {
      return NextResponse.json({ error: 'Conta não encontrada ou sem credenciais YouTube' }, { status: 404 });
    }

    let ytCred;
    try {
      ytCred = typeof account.yt_credencial === 'string'
        ? JSON.parse(account.yt_credencial)
        : account.yt_credencial;
    } catch {
      return NextResponse.json({ error: 'Credenciais YouTube inválidas' }, { status: 400 });
    }

    if (!ytCred.refresh_token) {
      return NextResponse.json({ error: 'Sem refresh_token. O usuário precisa reconectar o YouTube.' }, { status: 400 });
    }

    // 2. Verificar se o token ainda é válido
    if (ytCred.expires_at && new Date(ytCred.expires_at) > new Date(Date.now() + 5 * 60 * 1000)) {
      // Token ainda válido (com margem de 5 minutos)
      return NextResponse.json({
        access_token: ytCred.access_token,
        expires_at: ytCred.expires_at,
        refreshed: false,
      });
    }

    // 3. Renovar o access_token
    console.log(`[Google Refresh] Renovando token para conta ${conta_id}...`);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: ytCred.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('[Google Refresh] Failed:', tokenData);
      // Se o refresh falhar, o usuário precisa reconectar
      if (tokenData.error === 'invalid_grant') {
        return NextResponse.json({
          error: 'Refresh token expirado ou revogado. O usuário precisa reconectar o YouTube.',
          needs_reauth: true,
        }, { status: 401 });
      }
      throw new Error(`Failed to refresh Google token: ${JSON.stringify(tokenData)}`);
    }

    // 4. Atualizar credenciais no banco
    const newExpiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

    const updatedCred = {
      ...ytCred,
      access_token: tokenData.access_token,
      expires_at: newExpiresAt,
    };

    await supabaseAdmin
      .from('contas')
      .update({ yt_credencial: JSON.stringify(updatedCred) })
      .eq('id_conta', conta_id);

    console.log(`[Google Refresh] ✅ Token renovado para conta ${conta_id}, expira em ${tokenData.expires_in}s`);

    return NextResponse.json({
      access_token: tokenData.access_token,
      expires_at: newExpiresAt,
      refreshed: true,
    });

  } catch (error: any) {
    console.error('[Google Refresh] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
