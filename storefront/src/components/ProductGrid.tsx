'use client';

import ProductCard from './ProductCard';
import { Product } from '@/lib/supabase';
import { Package } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  storeSlug: string;
  accentColor: string;
}

export default function ProductGrid({ products, storeSlug, accentColor }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Package className="w-10 h-10" style={{ color: accentColor }} />
        </div>
        <h3 className="text-xl font-bold text-[var(--store-text)] mb-2">
          Novidades em breve
        </h3>
        <p className="text-sm text-[var(--store-muted)] max-w-md">
          Estamos preparando produtos incríveis para você. Fique ligado nas nossas redes sociais!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          storeSlug={storeSlug}
          accentColor={accentColor}
        />
      ))}
    </div>
  );
}
