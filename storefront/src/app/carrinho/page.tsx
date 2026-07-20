'use client';

import { useCart } from '@/lib/cart';
import { ShoppingBag, Trash2, ArrowLeft, Lock, CreditCard, QrCode } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const handleCheckout = async () => {
    if (!customerName || !customerEmail) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          payment_method: paymentMethod,
          items: items.map((i) => ({
            product_id: i.id,
            quantity: i.quantity,
            unit_price: i.price,
          })),
        }),
      });

      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.pix_code) {
        // Handle PIX display
        alert(`Código PIX copiado! Cole no app do seu banco.\n\n${data.pix_code}`);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-up">
        <div className="w-20 h-20 rounded-full bg-[var(--store-card)] border border-[var(--store-border)] flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-[var(--store-muted)]" />
        </div>
        <h1 className="text-2xl font-black text-[var(--store-text)] mb-3">
          Seu carrinho está vazio
        </h1>
        <p className="text-[var(--store-muted)] mb-8">
          Explore nossos produtos e encontre algo especial!
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--store-accent)] text-white font-bold text-sm hover:opacity-90 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à Loja
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 animate-fade-up">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--store-muted)] hover:text-[var(--store-accent)] transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Continuar comprando
      </Link>

      <h1 className="text-3xl font-black text-[var(--store-text)] mb-8">
        Finalizar Compra
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Cart Items + Customer Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Items */}
          <div className="bg-[var(--store-card)] border border-[var(--store-border)] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-[var(--store-text)]">
              Itens ({items.length})
            </h2>

            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 py-4 border-b border-[var(--store-border)] last:border-0"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-[var(--store-bg)] flex-shrink-0">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-[var(--store-muted)] opacity-30" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[var(--store-text)]">
                    {item.name}
                  </h3>
                  <p className="text-sm font-bold text-[var(--store-accent)] mt-1">
                    {formatPrice(item.price)}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded bg-[var(--store-bg)] border border-[var(--store-border)] flex items-center justify-center text-[var(--store-muted)] hover:text-[var(--store-text)] text-xs"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-[var(--store-text)]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded bg-[var(--store-bg)] border border-[var(--store-border)] flex items-center justify-center text-[var(--store-muted)] hover:text-[var(--store-text)] text-xs"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[var(--store-muted)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Customer Info */}
          <div className="bg-[var(--store-card)] border border-[var(--store-border)] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-[var(--store-text)]">
              Seus Dados
            </h2>

            <div>
              <label className="text-xs font-medium text-[var(--store-muted)] uppercase tracking-wider">
                Nome completo *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--store-bg)] border border-[var(--store-border)] text-[var(--store-text)] text-sm focus:outline-none focus:border-[var(--store-accent)] transition-colors"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--store-muted)] uppercase tracking-wider">
                E-mail *
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--store-bg)] border border-[var(--store-border)] text-[var(--store-text)] text-sm focus:outline-none focus:border-[var(--store-accent)] transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--store-muted)] uppercase tracking-wider">
                WhatsApp (opcional)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--store-bg)] border border-[var(--store-border)] text-[var(--store-text)] text-sm focus:outline-none focus:border-[var(--store-accent)] transition-colors"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--store-card)] border border-[var(--store-border)] rounded-2xl p-6 sticky top-24 space-y-6">
            <h2 className="text-lg font-bold text-[var(--store-text)]">
              Resumo do Pedido
            </h2>

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-[var(--store-muted)] truncate max-w-[60%]">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-[var(--store-text)] font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--store-border)] pt-4">
              <div className="flex justify-between">
                <span className="text-[var(--store-muted)]">Total</span>
                <span className="text-2xl font-black text-[var(--store-accent)]">
                  {formatPrice(totalPrice())}
                </span>
              </div>
            </div>

            {/* Payment method */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-[var(--store-muted)] uppercase tracking-wider">
                Forma de pagamento
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    paymentMethod === 'pix'
                      ? 'border-[var(--store-accent)] text-[var(--store-accent)] bg-[var(--store-accent)]/10'
                      : 'border-[var(--store-border)] text-[var(--store-muted)]'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  Pix
                </button>
                <button
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    paymentMethod === 'credit_card'
                      ? 'border-[var(--store-accent)] text-[var(--store-accent)] bg-[var(--store-accent)]/10'
                      : 'border-[var(--store-border)] text-[var(--store-muted)]'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Cartão
                </button>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={!customerName || !customerEmail || isProcessing}
              className="w-full py-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--store-accent)' }}
            >
              <Lock className="w-4 h-4" />
              {isProcessing ? 'Processando...' : 'Pagar com segurança'}
            </button>

            <p className="text-[10px] text-center text-[var(--store-muted)]">
              Pagamento processado com segurança via criptografia SSL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
