/**
 * Determina o host da API e o token correto para cada conta.
 * 
 * Contas via Instagram Business Login → graph.instagram.com + ig_access_token
 * Contas via Facebook Page → graph.facebook.com + facebook_access_token
 * 
 * Suporta detecção por:
 * 1. auth_type (se a coluna existir)
 * 2. Fallback: presença de facebook_access_token
 */

export interface AccountTokenInfo {
  apiBase: string;
  accessToken: string;
  isDirectIG: boolean;
}

export function getAccountApi(account: {
  auth_type?: string | null;
  ig_access_token?: string | null;
  facebook_access_token?: string | null;
}): AccountTokenInfo {
  // Prioridade: auth_type > fallback por token
  const isDirectIG = account.auth_type === 'instagram_direct' 
    || (!account.auth_type && !account.facebook_access_token);
  
  return {
    apiBase: isDirectIG ? 'https://graph.instagram.com' : 'https://graph.facebook.com',
    accessToken: isDirectIG 
      ? (account.ig_access_token || '') 
      : (account.facebook_access_token || account.ig_access_token || ''),
    isDirectIG,
  };
}
