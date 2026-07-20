'use client';

import { Product } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import { ShoppingBag, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
  storeSlug: string;
  accentColor: string;
}

export default function ProductCard({ product, storeSlug, accentColor }: ProductCardProps) {
  const addItem = useCart((s) => s.addItem);

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  return (
    <div className="group relative bg-[var(--store-card)] border border-[var(--store-border)] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-[var(--store-accent)]/10 hover:-translate-y-1">
      {/* Badge */}
      {product.is_featured && (
        <div
          className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: accentColor }}
        >
          <Star className="w-3 h-3" />
          Destaque
        </div>
      )}

      {hasDiscount && (
        <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
          -{discountPercent}%
        </div>
      )}

      {/* Image */}
      <Link href={`/produto/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-[var(--store-bg)]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--store-muted)]">
              <ShoppingBag className="w-12 h-12 opacity-30" />
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 space-y-3">
        {product.category && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--store-muted)]">
            {product.category}
          </span>
        )}

        <Link href={`/produto/${product.slug}`}>
          <h3 className="text-sm font-bold text-[var(--store-text)] line-clamp-2 group-hover:text-[var(--store-accent)] transition-colors">
            {product.name}
          </h3>
        </Link>

        {product.short_description && (
          <p className="text-xs text-[var(--store-muted)] line-clamp-2">
            {product.short_description}
          </p>
        )}

        <div className="flex items-end justify-between pt-1">
          <div>
            {hasDiscount && (
              <span className="text-xs text-[var(--store-muted)] line-through block">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}
            <span className="text-lg font-black text-[var(--store-accent)]">
              {formatPrice(product.price)}
            </span>
          </div>

          <button
            onClick={() =>
              addItem({
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                image_url: product.image_url,
              })
            }
            className="p-2.5 rounded-xl text-white transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ backgroundColor: accentColor }}
            title="Adicionar ao carrinho"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
