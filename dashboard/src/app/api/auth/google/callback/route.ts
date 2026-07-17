import { NextResponse } from 'next/server';

/**
 * API Route: Google OAuth 2.0 — Callback
 * GET /api/auth/google/callback?code=XXX&state=conta_id
 * 
 * Troca o authorization code por access_token + refresh_token,
 * busca informações do canal YouTube e salva tudo na tabela contas.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const contaId = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    console.error('Google OAuth Error:', error);
    return NextResponse.redirect(`${appUrl}/configuracoes/contas?auth_error=google_${error}`);
  }

  if (!code || !contaId) {
    return NextResponse.json({ error: 'code or state (conta_id) missing' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_YOUTUBE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Google OAuth credentials not configured' }, { status: 500 });
  }

  try {
    // 1. Trocar o authorization code por tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error(`Failed to get Google access token: ${JSON.stringify(tokenData)}`);
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString();

    console.log(`[Google OAuth] Token obtained. Expires in ${expires_in}s. Has refresh_token: ${!!refresh_token}`);

    // 2. Buscar informações do canal YouTube do usuário
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const channelData = await channelRes.json();

    let channelId = '';
    let channelName = '';
    let channelThumbnail = '';

    if (channelData.items && channelData.items.length > 0) {
      const channel = channelData.items[0];
      channelId = channel.id;
      channelName = channel.snippet?.title || '';
      channelThumbnail = channel.snippet?.thumbnails?.default?.url || '';
      console.log(`[Google OAuth] Channel found: ${channelName} (${channelId})`);
    } else {
      console.warn('[Google OAuth] No YouTube channel found for this account');
    }

    // 3. Montar objeto de credenciais para salvar
    const ytCredential = JSON.stringify({
      access_token,
      refresh_token: refresh_token || null,
      expires_at: expiresAt,
      channel_id: channelId,
      channel_name: channelName,
      channel_thumbnail: channelThumbnail,
      connected_at: new Date().toISOString(),
    });

    // 4. Salvar no Supabase (tabela contas, campo yt_credencial)
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (contaId === 'onboarding') {
      // Salvar credencial em cookie para o fluxo de onboarding
      const response = NextResponse.redirect(`${appUrl}/onboarding?youtube=connected`);
      response.cookies.set('google_yt_credential', ytCredential, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
      });
      return response;
    }

    // Atualizar conta existente com as credenciais do YouTube
    const { error: dbError } = await supabaseAdmin
      .from('contas')
      .update({ yt_credencial: ytCredential })
      .eq('id_conta', contaId);

    if (dbError) {
      throw new Error(`Database update failed: ${dbError.message}`);
    }

    console.log(`[Google OAuth] ✅ YouTube credentials saved for conta ${contaId}`);

    // Sucesso! Redirecionar para a página de contas
    return NextResponse.redirect(
      `${appUrl}/configuracoes/contas?auth_success=youtube&channel=${encodeURIComponent(channelName)}`
    );

  } catch (err: any) {
    console.error('[Google OAuth] Flow Error:', err.message);
    return NextResponse.redirect(`${appUrl}/configuracoes/contas?auth_error=google_server_error`);
  }
}
