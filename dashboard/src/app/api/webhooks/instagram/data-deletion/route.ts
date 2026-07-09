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

// Instagram Data Deletion Request
// Chamado quando um usuário solicita exclusão de dados pelo Instagram
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const signedRequest = formData.get('signed_request') as string;

    if (!signedRequest) {
      return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 });
    }

    const appSecret = process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET!;
    const data = parseSignedRequest(signedRequest, appSecret);
    const igUserId = data.user_id;

    console.log('[IG Data Deletion] Request for user:', igUserId);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Deletar contas vinculadas a este Instagram user
    await supabaseAdmin
      .from('contas')
      .delete()
      .eq('conta_id_instagram', igUserId?.toString());

    console.log('[IG Data Deletion] Data deleted for IG user:', igUserId);

    const confirmationCode = crypto.randomBytes(16).toString('hex');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://painel.paulistanaemporio.com';

    return NextResponse.json({
      url: `${appUrl}/api/webhooks/instagram/deletion-status?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (err: any) {
    console.error('[IG Data Deletion] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
