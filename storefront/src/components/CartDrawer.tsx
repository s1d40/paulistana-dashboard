'use client';

import { useCart, CartItem } from '@/lib/cart';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CartDrawerProps {
  accentColor: string;
}

export default function CartDrawer({ accentColor }: CartDrawerProps) {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--store-bg)] border-l border-[var(--store-border)] z-50 flex flex-col shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--store-border)]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: accentColor }} />
            <h2 className="text-lg font-bold text-[var(--store-text)]">
              Carrinho
            </h2>
            <span className="text-xs text-[var(--store-muted)]">
              ({items.length} {items.length === 1 ? 'item' : 'itens'})
            </span>
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-lg text-[var(--store-muted)] hover:text-[var(--store-text)] hover:bg-[var(--store-card)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <ShoppingBag className="w-8 h-8" style={{ color: accentColor }} />
              </div>
              <p className="text-sm text-[var(--store-muted)]">
                Seu carrinho está vazio
              </p>
              <button
                onClick={closeCart}
                className="mt-4 text-sm font-medium hover:underline"
                style={{ color: accentColor }}
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                accentColor={accentColor}
                onRemove={() => removeItem(item.id)}
                onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                formatPrice={formatPrice}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[var(--store-border)] px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--store-muted)]">Subtotal</span>
              <span className="text-xl font-black" style={{ color: accentColor }}>
                {formatPrice(totalPrice())}
              </span>
            </div>

            <Link
              href="/carrinho"
              onClick={closeCart}
              className="block w-full py-3.5 rounded-xl text-center text-white font-bold text-sm transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
              style={{ backgroundColor: accentColor }}
            >
              Finalizar Compra
            </Link>

            <button
              onClick={clearCart}
              className="w-full text-center text-xs text-[var(--store-muted)] hover:text-red-400 transition-colors"
            >
              Limpar carrinho
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function CartItemRow({
  item,
  accentColor,
  onRemove,
  onUpdateQuantity,
  formatPrice,
}: {
  item: CartItem;
  accentColor: string;
  onRemove: () => void;
  onUpdateQuantity: (qty: number) => void;
  formatPrice: (p: number) => string;
}) {
  return (
    <div className="flex gap-4 bg-[var(--store-card)] rounded-xl p-3 border border-[var(--store-border)]">
      {/* Image */}
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-[var(--store-bg)] flex-shrink-0">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            width={80}
            height={80}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--store-muted)]">
            <ShoppingBag className="w-6 h-6 opacity-30" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-[var(--store-text)] truncate">
          {item.name}
        </h4>
        <p className="text-sm font-bold mt-1" style={{ color: accentColor }}>
          {formatPrice(item.price)}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              className="w-7 h-7 rounded-lg bg-[var(--store-bg)] border border-[var(--store-border)] flex items-center justify-center text-[var(--store-muted)] hover:text-[var(--store-text)] transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm font-bold text-[var(--store-text)]">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              className="w-7 h-7 rounded-lg bg-[var(--store-bg)] border border-[var(--store-border)] flex items-center justify-center text-[var(--store-muted)] hover:text-[var(--store-text)] transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg text-[var(--store-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
