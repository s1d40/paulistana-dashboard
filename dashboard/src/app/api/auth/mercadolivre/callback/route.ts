import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';
import path from 'path';
import fs from 'fs';

/**
 * GET /api/auth/mercadolivre/callback?code=XXX
 * 
 * Callback do OAuth do Mercado Livre.
 * Troca o authorization code por access_token + refresh_token
 * e salva no ml_tokens.json para os scripts Python consumirem.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    console.error('Mercado Livre OAuth Error:', error);
    return NextResponse.redirect(`${appUrl}/mercado-livre?auth_error=${error}`);
  }

  if (!code) {
    return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
  }

  const clientId = process.env.ML_CLIENT_ID;
  const clientSecret = process.env.ML_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/mercadolivre/callback`;

  if (!clientId || !clientSecret) {
    console.error('ML_CLIENT_ID or ML_CLIENT_SECRET not set');
    return NextResponse.redirect(`${appUrl}/mercado-livre?auth_error=missing_credentials`);
  }

  try {
    // 1. Trocar code por tokens
    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    console.log('[ML OAuth] Token response status:', tokenRes.status);

    if (!tokenData.access_token) {
      throw new Error(`Failed to get ML access token: ${JSON.stringify(tokenData)}`);
    }

    // 2. Salvar tokens no ml_tokens.json (para scripts Python)
    const tokensPayload = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      expires_at: Date.now() / 1000 + tokenData.expires_in,
      user_id: tokenData.user_id,
      scope: tokenData.scope,
    };

    const tokenFilePath = path.join(process.cwd(), '../scripts/mercado_livre/ml_tokens.json');
    fs.writeFileSync(tokenFilePath, JSON.stringify(tokensPayload, null, 2), 'utf-8');
    console.log('✅ ML tokens salvos em:', tokenFilePath);

    // 3. Opcionalmente salvar no Supabase também
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

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

      if (idCliente) {
        await supabaseAdmin
          .from('ml_credentials')
          .upsert({
            client_id: idCliente,
            ml_user_id: tokenData.user_id?.toString(),
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: new Date(tokensPayload.expires_at * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'client_id' });
        
        console.log('✅ ML tokens também salvos no Supabase para cliente:', idCliente);
      }
    } catch (dbErr: any) {
      // Não crítico - os tokens já estão salvos no arquivo
      console.warn('⚠️ Erro ao salvar ML tokens no Supabase (não crítico):', dbErr.message);
    }

    return NextResponse.redirect(`${appUrl}/mercado-livre?auth_success=mercadolivre`);
  } catch (err: any) {
    console.error('ML OAuth Error:', err.message);
    return NextResponse.redirect(`${appUrl}/mercado-livre?auth_error=server_error`);
  }
}
