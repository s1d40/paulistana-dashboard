import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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

// Facebook Data Deletion Request
// Chamado quando um usuário solicita exclusão de dados pelo Facebook
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

    console.log('[FB Data Deletion] Request for user:', fbUserId);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Deletar contas vinculadas a este Facebook user
    await supabaseAdmin
      .from('contas')
      .delete()
      .eq('conta_id_facebook', fbUserId);

    console.log('[FB Data Deletion] Data deleted for FB user:', fbUserId);

    // Gerar código de confirmação
    const confirmationCode = crypto.randomBytes(16).toString('hex');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painel.paulistanaemporio.com';

    // A Meta exige uma resposta com url e confirmation_code
    return NextResponse.json({
      url: `${appUrl}/api/webhooks/facebook/deletion-status?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (err: any) {
    console.error('[FB Data Deletion] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
