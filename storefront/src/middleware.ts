import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware: Extrai o subdomínio de *.paulistanaemporio.com
 * e injeta como header X-Store-Slug para uso nos server components.
 * 
 * Em dev, usa o query param ?store=slug como fallback.
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;

  // Extrair subdomínio
  let storeSlug = '';

  // Produção: codigodossignos.paulistanaemporio.com
  const match = hostname.match(/^([^.]+)\.paulistanaemporio\.com$/);
  if (match) {
    storeSlug = match[1];
  }

  // Dev fallback: localhost:3001?store=codigodossignos
  if (!storeSlug && (hostname.includes('localhost') || hostname.includes('127.0.0.1'))) {
    storeSlug = url.searchParams.get('store') || 'codigodossignos';
  }

  // Nginx header fallback
  if (!storeSlug) {
    storeSlug = request.headers.get('x-store-subdomain') || '';
  }

  // Skip para assets estáticos
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Injetar slug como header para server components lerem
  const response = NextResponse.next();
  response.headers.set('x-store-slug', storeSlug);
  
  // Também setar como cookie para client components
  response.cookies.set('store-slug', storeSlug, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
