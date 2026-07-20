import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const contaId = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    console.error('Facebook OAuth Error:', error);
    return NextResponse.redirect(`${appUrl}/configuracoes/contas?auth_error=${error}`);
  }

  if (!code || !contaId) {
    return NextResponse.json({ error: 'code or state (conta_id) missing' }, { status: 400 });
  }

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = `${appUrl}/api/auth/facebook/callback`;

  try {
    // 1. Trocar o código por um token de curta duração
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
    }

    const shortLivedToken = tokenData.access_token;

    // 2. Trocar o token de curta duração por um de longa duração (60 dias)
    const longTokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const longTokenRes = await fetch(longTokenUrl);
    const longTokenData = await longTokenRes.json();

    if (!longTokenData.access_token) {
      throw new Error(`Failed to exchange for long-lived token: ${JSON.stringify(longTokenData)}`);
    }

    const longLivedToken = longTokenData.access_token;

    if (contaId === 'onboarding') {
      // É um novo cliente. Redirecionar para tela de onboarding com cookie seguro
      const response = NextResponse.redirect(`${appUrl}/onboarding`);
      response.cookies.set('fb_onboarding_token', longLivedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 // 1 hour
      });
      return response;
    }

    // 3. Salvar no Supabase (Atualizar conta existente)
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Atualizamos tanto o ig_access_token quanto o facebook_access_token (já que ambos usam a Graph API no mesmo token)
    const { error: dbError } = await supabaseAdmin
      .from('contas')
      .update({
        ig_access_token: longLivedToken,
        facebook_access_token: longLivedToken,
        auth_type: 'facebook',
      })
      .eq('id_conta', contaId);

    if (dbError) {
      throw new Error(`Database update failed: ${dbError.message}`);
    }

    // Sucesso! Redirecionar o usuário de volta para o painel
    return NextResponse.redirect(`${appUrl}/configuracoes/contas?auth_success=facebook`);

  } catch (err: any) {
    console.error('OAuth Flow Error:', err.message);
    return NextResponse.redirect(`${appUrl}/configuracoes/contas?auth_error=server_error`);
  }
}
