'use client';

import { StoreConfig } from '@/lib/supabase';
import { useCart } from '@/lib/cart';
import { ShoppingBag, Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

interface StoreHeaderProps {
  store: StoreConfig;
}

export default function StoreHeader({ store }: StoreHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalItems = useCart((s) => s.totalItems);
  const openCart = useCart((s) => s.openCart);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--store-bg)]/80 border-b border-[var(--store-border)]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Store Name */}
          <Link href="/" className="flex items-center gap-3 group">
            {store.logo_url ? (
              <Image
                src={store.logo_url}
                alt={store.display_name}
                width={36}
                height={36}
                className="rounded-lg"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-sm"
                style={{ backgroundColor: store.theme.accent }}
              >
                {store.display_name.charAt(0)}
              </div>
            )}
            <span className="text-lg font-bold text-[var(--store-text)] group-hover:text-[var(--store-accent)] transition-colors hidden sm:block">
              {store.display_name}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--store-muted)] hover:text-[var(--store-accent)] transition-colors"
            >
              Loja
            </Link>
            <Link
              href="/#categorias"
              className="text-sm font-medium text-[var(--store-muted)] hover:text-[var(--store-accent)] transition-colors"
            >
              Categorias
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={openCart}
              className="relative p-2.5 rounded-xl text-[var(--store-muted)] hover:text-[var(--store-accent)] hover:bg-[var(--store-card)] transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems() > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-bounce"
                  style={{ backgroundColor: store.theme.accent }}
                >
                  {totalItems()}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[var(--store-muted)] hover:text-[var(--store-text)] transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 pt-2 border-t border-[var(--store-border)] space-y-2">
            <Link
              href="/"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[var(--store-muted)] hover:bg-[var(--store-card)] hover:text-[var(--store-accent)] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Loja
            </Link>
            <Link
              href="/#categorias"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[var(--store-muted)] hover:bg-[var(--store-card)] hover:text-[var(--store-accent)] transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Categorias
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
