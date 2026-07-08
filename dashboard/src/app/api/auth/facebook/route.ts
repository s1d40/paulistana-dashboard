import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contaId = searchParams.get('conta_id');

  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;
  
  // O parâmetro state é usado para repassar o id_conta para o callback ou 'onboarding' para novos clientes
  const state = contaId || 'onboarding';

  // Escopos requeridos para aprovação do App
  const scopes = [
    'email',
    'public_profile',
    'pages_show_list',
    'instagram_basic',
    'instagram_content_publish',
    'pages_read_engagement',
    'instagram_manage_insights',
    'instagram_manage_comments',
    'pages_manage_engagement',
    'pages_manage_posts',
    'pages_messaging',
    'instagram_manage_messages',
    'business_management'
  ].join(',');

  const fbLoginUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scopes}&response_type=code`;

  return NextResponse.redirect(fbLoginUrl);
}
