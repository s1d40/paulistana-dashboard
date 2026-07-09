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

// Instagram Deauthorization Callback
// Chamado quando um usuário remove o app das configurações do Instagram
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

    console.log('[IG Deauth] User deauthorized app:', igUserId);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Limpar tokens de todas as contas com este Instagram user ID
    await supabaseAdmin
      .from('contas')
      .update({
        ig_access_token: null,
        ig_username: null,
        ig_profile_picture_url: null,
      })
      .eq('conta_id_instagram', igUserId?.toString());

    console.log('[IG Deauth] Tokens cleared for IG user:', igUserId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[IG Deauth] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
