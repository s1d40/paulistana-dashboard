import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { getStoreConfig } from '@/lib/supabase';
import StoreHeader from '@/components/StoreHeader';
import StoreFooter from '@/components/StoreFooter';
import CartDrawer from '@/components/CartDrawer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const slug = cookieStore.get('store-slug')?.value || 'codigodossignos';
  const store = await getStoreConfig(slug);

  return {
    title: store?.display_name || 'Paulistana Empório',
    description: store?.description || 'Loja oficial',
    openGraph: {
      title: store?.display_name || 'Paulistana Empório',
      description: store?.description || 'Loja oficial',
      type: 'website',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const slug = cookieStore.get('store-slug')?.value || 'codigodossignos';
  const store = await getStoreConfig(slug);

  const theme = store?.theme || {
    accent: '#D4AF37',
    bg: '#0B0E14',
    card: '#151A23',
    text: '#F8FAFC',
    muted: '#94A3B8',
    border: '#232B3A',
  };

  return (
    <html lang="pt-BR" className={inter.variable}>
      <body
        className="antialiased min-h-screen"
        style={{
          ['--store-accent' as string]: theme.accent,
          ['--store-bg' as string]: theme.bg,
          ['--store-card' as string]: theme.card,
          ['--store-text' as string]: theme.text,
          ['--store-muted' as string]: theme.muted,
          ['--store-border' as string]: theme.border,
          backgroundColor: theme.bg,
          color: theme.text,
        }}
      >
        {store && <StoreHeader store={store} />}
        <main className="min-h-[80vh]">
          {children}
        </main>
        {store && <StoreFooter store={store} />}
        <CartDrawer accentColor={theme.accent} />
      </body>
    </html>
  );
}
