import { NextResponse } from 'next/server';

/**
 * API Route: Google OAuth 2.0 — Initiate
 * GET /api/auth/google?conta_id=XXX
 * 
 * Redireciona o usuário para a tela de consentimento do Google.
 * Solicita escopos do YouTube para upload e leitura de analytics.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contaId = searchParams.get('conta_id');

  const clientId = process.env.GOOGLE_YOUTUBE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_YOUTUBE_CLIENT_ID não configurado no .env.local' }, { status: 500 });
  }

  // O state carrega o id_conta para vincular os tokens após o callback
  const state = contaId || 'onboarding';

  // Escopos necessários para YouTube (upload + leitura de canal/analytics)
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
  ].join(' ');

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', scopes);
  googleAuthUrl.searchParams.set('access_type', 'offline'); // Para obter refresh_token
  googleAuthUrl.searchParams.set('prompt', 'consent'); // Forçar tela de consentimento (garante refresh_token)
  googleAuthUrl.searchParams.set('state', state);

  return NextResponse.redirect(googleAuthUrl.toString());
}
