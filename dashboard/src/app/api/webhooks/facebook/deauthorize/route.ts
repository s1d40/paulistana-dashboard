import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Função para decodificar o signed_request da Meta
function parseSignedRequest(signedRequest: string, secret: string) {
  const [encodedSig, payload] = signedRequest.split('.', 2);
  
  const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const data = JSON.parse(
    Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
  );

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest();

  if (!crypto.timingSafeEqual(sig, expectedSig)) {
    throw new Error('Invalid signature');
  }

  return data;
}

// Facebook Deauthorization Callback
// Chamado quando um usuário remove o app das configurações do Facebook
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const signedRequest = formData.get('signed_request') as string;

    if (!signedRequest) {
      return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 });
    }

    const appSecret = process.env.FACEBOOK_APP_SECRET!;
    const data = parseSignedRequest(signedRequest, appSecret);
    const fbUserId = data.user_id;

    console.log('[FB Deauth] User deauthorized app:', fbUserId);

    // Limpar tokens do banco de dados para este usuário do Facebook
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Remover tokens de todas as contas que usam este Facebook user ID
    await supabaseAdmin
      .from('contas')
      .update({
        ig_access_token: null,
        facebook_access_token: null,
      })
      .eq('conta_id_facebook', fbUserId);

    console.log('[FB Deauth] Tokens cleared for FB user:', fbUserId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[FB Deauth] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
