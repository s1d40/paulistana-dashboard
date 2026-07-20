import { cookies } from 'next/headers';
import { getStoreConfig, getProductBySlug } from '@/lib/supabase';
import ProductPageClient from './ProductPageClient';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: 'Produto não encontrado' };

  return {
    title: `${product.name} | Loja`,
    description: product.short_description || product.description || '',
    openGraph: {
      title: product.name,
      description: product.short_description || '',
      images: product.image_url ? [product.image_url] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const storeSlug = cookieStore.get('store-slug')?.value || 'codigodossignos';
  const store = await getStoreConfig(storeSlug);
  const product = await getProductBySlug(slug);

  if (!product || !store) {
    notFound();
  }

  return <ProductPageClient product={product} store={store} />;
}
