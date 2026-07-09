import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;
  const redirectUri = `${appUrl}/api/auth/instagram/callback`;

  if (error) {
    console.error('Instagram OAuth Error:', error, searchParams.get('error_description'));
    return NextResponse.redirect(`${appUrl}/configuracoes/contas?auth_error=${error}`);
  }

  if (!code) {
    return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
  }

  try {
    // 1. Trocar o código por um token de curta duração
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error(`Failed to get IG access token: ${JSON.stringify(tokenData)}`);
    }

    const shortLivedToken = tokenData.access_token;
    const igUserId = tokenData.user_id;

    // 2. Trocar por token de longa duração (60 dias)
    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortLivedToken}`
    );
    const longTokenData = await longTokenRes.json();

    if (!longTokenData.access_token) {
      throw new Error(`Failed to get long-lived IG token: ${JSON.stringify(longTokenData)}`);
    }

    const longLivedToken = longTokenData.access_token;

    // 3. Buscar informações do perfil do Instagram
    const profileRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=user_id,username,name,account_type,profile_picture_url&access_token=${longLivedToken}`
    );
    const profile = await profileRes.json();

    // 4. Salvar no Supabase
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar o id_cliente do usuário logado
    const session = await auth();
    let idCliente: string | null = null;

    if (session?.user?.email) {
      const { data: cliente } = await supabaseAdmin
        .from('clientes')
        .select('id_cliente')
        .eq('email', session.user.email)
        .single();
      if (cliente) idCliente = cliente.id_cliente;
    }

    if (!idCliente && session?.user?.id) {
      const { data: cliente } = await supabaseAdmin
        .from('clientes')
        .select('id_cliente')
        .eq('auth_user_id', session.user.id)
        .single();
      if (cliente) idCliente = cliente.id_cliente;
    }

    if (state && state !== 'onboarding') {
      // Atualizar conta existente
      await supabaseAdmin
        .from('contas')
        .update({
          ig_access_token: longLivedToken,
          conta_id_instagram: igUserId?.toString() || profile.user_id?.toString(),
        })
        .eq('id_conta', state);
    } else {
      // Verificar se já existe uma conta com este Instagram ID
      const { data: existing } = await supabaseAdmin
        .from('contas')
        .select('id_conta')
        .eq('conta_id_instagram', igUserId?.toString() || profile.user_id?.toString())
        .single();

      if (existing) {
        // Atualizar tokens
        await supabaseAdmin
          .from('contas')
          .update({
            ig_access_token: longLivedToken,
            nome_conta: profile.name || profile.username,
            id_cliente: idCliente,
          })
          .eq('id_conta', existing.id_conta);
      } else {
        // Criar nova conta
        await supabaseAdmin
          .from('contas')
          .insert({
            nome_conta: profile.name || profile.username || 'Instagram Account',
            nicho: 'Geral',
            conta_id_instagram: igUserId?.toString() || profile.user_id?.toString(),
            ig_access_token: longLivedToken,
            id_cliente: idCliente,
          });
      }
    }

    return NextResponse.redirect(`${appUrl}/configuracoes/contas?auth_success=instagram`);
  } catch (err: any) {
    console.error('Instagram OAuth Flow Error:', err.message);
    return NextResponse.redirect(`${appUrl}/configuracoes/contas?auth_error=ig_server_error`);
  }
}
