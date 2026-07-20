'use client';

import { Product, StoreConfig } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import { ShoppingBag, ChevronLeft, Star, Shield, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface Props {
  product: Product;
  store: StoreConfig;
}

export default function ProductPageClient({ product, store }: Props) {
  const addItem = useCart((s) => s.addItem);
  const [selectedImage, setSelectedImage] = useState(product.image_url);
  const [quantity, setQuantity] = useState(1);

  const allImages = [
    product.image_url,
    ...(product.gallery_urls || []),
  ].filter(Boolean) as string[];

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image_url: product.image_url,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 animate-fade-up">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--store-muted)] hover:text-[var(--store-accent)] transition-colors mb-8"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar à Loja
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Images */}
        <div className="space-y-4">
          {/* Main image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--store-card)] border border-[var(--store-border)]">
            {selectedImage ? (
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--store-muted)]">
                <ShoppingBag className="w-20 h-20 opacity-20" />
              </div>
            )}

            {hasDiscount && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
                -{discountPercent}%
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === img
                      ? 'border-[var(--store-accent)] opacity-100'
                      : 'border-[var(--store-border)] opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} - ${i + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          {product.category && (
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: store.theme.accent }}
            >
              {product.category}
            </span>
          )}

          <h1 className="text-3xl md:text-4xl font-black text-[var(--store-text)] leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div className="space-y-1">
            {hasDiscount && (
              <span className="text-lg text-[var(--store-muted)] line-through">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}
            <div className="flex items-baseline gap-3">
              <span
                className="text-4xl font-black"
                style={{ color: store.theme.accent }}
              >
                {formatPrice(product.price)}
              </span>
              {product.price < 100 && (
                <span className="text-sm text-[var(--store-muted)]">
                  à vista no Pix
                </span>
              )}
            </div>
            {product.price >= 100 && (
              <p className="text-sm text-[var(--store-muted)]">
                ou 12x de {formatPrice(product.price / 12)} sem juros
              </p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t border-[var(--store-border)] pt-6">
              <h3 className="text-sm font-bold text-[var(--store-text)] uppercase tracking-wider mb-3">
                Descrição
              </h3>
              <div
                className="text-sm text-[var(--store-muted)] leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="border-t border-[var(--store-border)] pt-6 space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-[var(--store-muted)]">
                Quantidade:
              </label>
              <div className="flex items-center border border-[var(--store-border)] rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2.5 text-[var(--store-muted)] hover:text-[var(--store-text)] hover:bg-[var(--store-card)] transition-colors"
                >
                  −
                </button>
                <span className="px-4 py-2.5 text-sm font-bold text-[var(--store-text)] min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2.5 text-[var(--store-muted)] hover:text-[var(--store-text)] hover:bg-[var(--store-card)] transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
              style={{
                backgroundColor: store.theme.accent,
                boxShadow: `0 4px 20px ${store.theme.accent}40`,
              }}
            >
              <ShoppingBag className="w-5 h-5" />
              Adicionar ao Carrinho
            </button>
          </div>

          {/* Trust */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="flex items-center gap-2 text-xs text-[var(--store-muted)]">
              <Shield className="w-4 h-4" style={{ color: store.theme.accent }} />
              Compra 100% segura
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--store-muted)]">
              <Truck className="w-4 h-4" style={{ color: store.theme.accent }} />
              {product.product_type === 'digital' ? 'Acesso imediato' : 'Entrega rápida'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
