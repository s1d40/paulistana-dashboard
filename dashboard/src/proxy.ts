import { NextResponse } from 'next/server'
// import { updateSession } from '@/utils/supabase/proxy'

export async function proxy() {
  // ATENÇÃO: Autenticação desativada temporariamente para testes na VPS Hetzner via IP.
  // Descomente a linha abaixo e o import quando o domínio e o Google OAuth estiverem configurados.
  // return await updateSession(request)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
