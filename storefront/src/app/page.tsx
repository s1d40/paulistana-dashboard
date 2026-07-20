import { cookies } from 'next/headers';
import { getStoreConfig, getProducts, getFeaturedProducts } from '@/lib/supabase';
import ProductGrid from '@/components/ProductGrid';
import { Sparkles, ArrowRight, Shield, Truck, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default async function StorePage() {
  const cookieStore = await cookies();
  const slug = cookieStore.get('store-slug')?.value || 'codigodossignos';
  const store = await getStoreConfig(slug);

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-4xl font-black mb-4">Loja não encontrada</h1>
        <p className="text-[var(--store-muted)]">
          Verifique o endereço e tente novamente.
        </p>
      </div>
    );
  }

  const products = await getProducts(slug);
  const featured = await getFeaturedProducts(slug);

  // Extract categories
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div className="animate-fade-up">
      {/* Hero Section */}
      <section className="relative hero-gradient py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 border"
            style={{
              color: store.theme.accent,
              borderColor: `${store.theme.accent}30`,
              backgroundColor: `${store.theme.accent}10`,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Loja Oficial
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${store.theme.gradient_from || store.theme.accent}, ${store.theme.gradient_to || store.theme.text})`,
              }}
            >
              {store.display_name}
            </span>
          </h1>

          {store.description && (
            <p className="text-lg md:text-xl text-[var(--store-muted)] max-w-2xl mx-auto mb-8 leading-relaxed">
              {store.description}
            </p>
          )}

          {products.length > 0 && (
            <a
              href="#produtos"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 hover:shadow-lg hover:shadow-[var(--store-accent)]/20 active:scale-[0.98]"
              style={{ backgroundColor: store.theme.accent }}
            >
              Ver Produtos
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-[var(--store-border)] py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-3 gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 text-center md:text-left">
            <Shield className="w-5 h-5" style={{ color: store.theme.accent }} />
            <div>
              <p className="text-xs font-bold text-[var(--store-text)]">Compra Segura</p>
              <p className="text-[10px] text-[var(--store-muted)] hidden md:block">SSL + criptografia</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 text-center md:text-left">
            <Truck className="w-5 h-5" style={{ color: store.theme.accent }} />
            <div>
              <p className="text-xs font-bold text-[var(--store-text)]">Entrega Rápida</p>
              <p className="text-[10px] text-[var(--store-muted)] hidden md:block">Digital: acesso imediato</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2 text-center md:text-left">
            <CreditCard className="w-5 h-5" style={{ color: store.theme.accent }} />
            <div>
              <p className="text-xs font-bold text-[var(--store-text)]">Pix &amp; Cartão</p>
              <p className="text-[10px] text-[var(--store-muted)] hidden md:block">Parcelamento sem juros</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-[var(--store-text)]">
              ⭐ Destaques
            </h2>
          </div>
          <ProductGrid
            products={featured}
            storeSlug={slug}
            accentColor={store.theme.accent}
          />
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section id="categorias" className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <h2 className="text-2xl font-black text-[var(--store-text)] mb-8">
            Categorias
          </h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border cursor-pointer transition-all hover:border-[var(--store-accent)] hover:text-[var(--store-accent)]"
                style={{
                  borderColor: store.theme.border,
                  color: store.theme.muted,
                  backgroundColor: store.theme.card,
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* All Products */}
      <section id="produtos" className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <h2 className="text-2xl font-black text-[var(--store-text)] mb-8">
          Todos os Produtos
        </h2>
        <ProductGrid
          products={products}
          storeSlug={slug}
          accentColor={store.theme.accent}
        />
      </section>
    </div>
  );
}
