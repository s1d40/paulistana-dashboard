import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contaId = searchParams.get('conta_id');

  const appId = process.env.INSTAGRAM_APP_ID || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;
  
  const state = contaId || 'onboarding';

  // Escopos do Instagram Business Login
  const scopes = [
    'instagram_business_basic',
    'instagram_business_manage_messages',
    'instagram_business_manage_comments',
    'instagram_business_content_publish',
    'instagram_business_manage_insights',
  ].join(',');

  // URL idêntica ao formato gerado pelo Meta Developer Portal
  const igLoginUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;

  return NextResponse.redirect(igLoginUrl);
}
