import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const appId = process.env.INSTAGRAM_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!;
  const appSecret = process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET!;
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
    // POST para https://api.instagram.com/oauth/access_token
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
    console.log('IG Token Response:', JSON.stringify(tokenData));

    if (!tokenData.access_token) {
      throw new Error(`Failed to get IG access token: ${JSON.stringify(tokenData)}`);
    }

    const shortLivedToken = tokenData.access_token;
    const igUserId = tokenData.user_id;

    // 2. Trocar por token de longa duração (60 dias)
    // A Instagram API com Instagram Login usa este endpoint
    const longTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(shortLivedToken)}`;
    
    const longTokenRes = await fetch(longTokenUrl, { method: 'GET' });
    const longTokenData = await longTokenRes.json();
    console.log('IG Long Token Response:', JSON.stringify(longTokenData));

    // Se falhar a troca por long-lived, usa o short-lived mesmo
    const finalToken = longTokenData.access_token || shortLivedToken;

    // 3. Buscar informações do perfil do Instagram
    // Tentar múltiplas abordagens porque em modo dev a API pode rejeitar
    let profile: any = {};
    
    // Tentativa 1: Instagram Graph API (funciona quando app está Live/aprovado)
    try {
      const profileFields = 'user_id,username,name,account_type,profile_picture_url';
      const profileUrl = `https://graph.instagram.com/v21.0/me?fields=${profileFields}&access_token=${encodeURIComponent(finalToken)}`;
      const profileRes = await fetch(profileUrl, { method: 'GET' });
      const profileData = await profileRes.json();
      console.log('IG Profile Response (attempt 1):', JSON.stringify(profileData));
      if (!profileData.error) {
        profile = profileData;
      }
    } catch (e) {
      console.log('IG Profile attempt 1 failed:', e);
    }

    // Tentativa 2: Usar user_id diretamente
    if (!profile.username && igUserId) {
      try {
        const profileUrl2 = `https://graph.instagram.com/${igUserId}?fields=username,name,account_type,profile_picture_url&access_token=${encodeURIComponent(finalToken)}`;
        const profileRes2 = await fetch(profileUrl2, { method: 'GET' });
        const profileData2 = await profileRes2.json();
        console.log('IG Profile Response (attempt 2):', JSON.stringify(profileData2));
        if (!profileData2.error) {
          profile = profileData2;
        }
      } catch (e) {
        console.log('IG Profile attempt 2 failed:', e);
      }
    }

    // Tentativa 3: Buscar via Facebook Graph API (usando token existente do Facebook)
    // Se o usuário já tem uma conta conectada via Facebook, podemos buscar o IG profile por lá
    if (!profile.username) {
      try {
        const supabaseTmp = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        // Buscar token do Facebook se existir
        const { data: fbContas } = await supabaseTmp
          .from('contas')
          .select('facebook_access_token, conta_id_instagram')
          .not('facebook_access_token', 'is', null)
          .limit(5);
        
        if (fbContas && fbContas.length > 0) {
          for (const fbConta of fbContas) {
            try {
              const fbToken = fbConta.facebook_access_token;
              const igId = fbConta.conta_id_instagram || igUserId;
              const fbProfileUrl = `https://graph.facebook.com/v21.0/${igId}?fields=username,name,profile_picture_url&access_token=${encodeURIComponent(fbToken)}`;
              const fbProfileRes = await fetch(fbProfileUrl);
              const fbProfileData = await fbProfileRes.json();
              console.log('IG Profile via FB (attempt 3):', JSON.stringify(fbProfileData));
              if (fbProfileData.username) {
                profile = fbProfileData;
                break;
              }
            } catch (e) {
              // continue to next
            }
          }
        }
      } catch (e) {
        console.log('IG Profile attempt 3 (via FB) failed:', e);
      }
    }

    console.log('Final IG Profile:', JSON.stringify(profile));

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

    console.log('IG OAuth - Session email:', session?.user?.email, 'id_cliente:', idCliente);

    const igAccountId = igUserId?.toString() || profile.user_id?.toString();
    const accountName = profile.name || profile.username || 'Instagram Account';
    const igUsername = profile.username || null;
    const igProfilePic = profile.profile_picture_url || null;

    if (state && state !== 'onboarding') {
      // Atualizar conta existente
      await supabaseAdmin
        .from('contas')
        .update({
          ig_access_token: finalToken,
          conta_id_instagram: igAccountId,
          nome_conta: accountName,
          ig_username: igUsername,
          ig_profile_picture_url: igProfilePic,
        })
        .eq('id_conta', state);
    } else {
      // Verificar se já existe uma conta com este Instagram ID
      const { data: existing } = await supabaseAdmin
        .from('contas')
        .select('id_conta')
        .eq('conta_id_instagram', igAccountId)
        .single();

      if (existing) {
        // Atualizar tokens e dados de perfil
        await supabaseAdmin
          .from('contas')
          .update({
            ig_access_token: finalToken,
            nome_conta: accountName,
            ig_username: igUsername,
            ig_profile_picture_url: igProfilePic,
            id_cliente: idCliente,
          })
          .eq('id_conta', existing.id_conta);
      } else {
        // Criar nova conta
        const { error: insertError } = await supabaseAdmin
          .from('contas')
          .insert({
            nome_conta: accountName,
            nicho: 'Geral',
            conta_id_instagram: igAccountId,
            ig_access_token: finalToken,
            ig_username: igUsername,
            ig_profile_picture_url: igProfilePic,
            id_cliente: idCliente,
          });
        
        if (insertError) {
          console.error('Error inserting new account:', insertError);
        } else {
          console.log('✅ New Instagram account created:', accountName, '(@' + igUsername + ') for client:', idCliente);
        }
      }
    }

    // 5. IMPORTANTE: Assinar webhooks para esta conta Instagram
    // Sem esta chamada, a Meta NÃO envia eventos (DMs, comentários) para contas
    // conectadas via Instagram Business Login
    try {
      const subscribeUrl = `https://graph.instagram.com/v21.0/me/subscribed_apps`;
      const subscribeRes = await fetch(subscribeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${finalToken}`
        },
        body: new URLSearchParams({
          subscribed_fields: 'messages,comments'
        })
      });
      const subscribeData = await subscribeRes.json();
      console.log('IG Webhook Subscription:', JSON.stringify(subscribeData));
      
      if (subscribeData.success) {
        console.log('✅ Webhook ativado para conta Instagram:', accountName);
      } else {
        console.warn('⚠️ Falha ao assinar webhook:', subscribeData.error?.message || 'Unknown error');
      }
    } catch (subErr: any) {
      console.error('Erro ao assinar webhook:', subErr.message);
      // Não bloqueia o fluxo - a conta foi salva com sucesso
    }

    return NextResponse.redirect(`${appUrl}/configuracoes/contas?auth_success=instagram`);
  } catch (err: any) {
    console.error('Instagram OAuth Flow Error:', err.message);
    return NextResponse.redirect(`${appUrl}/configuracoes/contas?auth_error=ig_server_error`);
  }
}
