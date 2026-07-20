import { NextRequest, NextResponse } from 'next/server';
import { createOrder, getStoreConfig, supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_name, customer_email, customer_phone, payment_method, items } = body;

    // Validation
    if (!customer_name || !customer_email || !items?.length) {
      return NextResponse.json(
        { error: 'Nome, email e itens são obrigatórios.' },
        { status: 400 }
      );
    }

    // Get store slug from cookie
    const storeSlug = request.cookies.get('store-slug')?.value || '';
    const store = await getStoreConfig(storeSlug);

    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });
    }

    // Calculate total
    const totalAmount = items.reduce(
      (sum: number, item: { unit_price: number; quantity: number }) =>
        sum + item.unit_price * item.quantity,
      0
    );

    // Create order in Supabase
    const order = await createOrder({
      client_id: store.client_id,
      store_slug: storeSlug,
      customer_name,
      customer_email,
      customer_phone,
      total_amount: totalAmount,
      items,
    });

    // TODO: Integrate with payment gateway (Stripe / Mercado Pago)
    // For now, return order confirmation with pending payment
    
    if (payment_method === 'pix') {
      // TODO: Generate PIX via Mercado Pago
      return NextResponse.json({
        order_id: order.id,
        status: 'pending',
        payment_method: 'pix',
        message: 'Pedido criado. PIX será implementado em breve.',
        // pix_code: "...",
        // qr_code_url: "...",
      });
    }

    if (payment_method === 'credit_card') {
      // TODO: Create Stripe checkout session
      return NextResponse.json({
        order_id: order.id,
        status: 'pending',
        payment_method: 'credit_card',
        message: 'Pedido criado. Checkout com cartão será implementado em breve.',
        // checkout_url: "https://checkout.stripe.com/...",
      });
    }

    return NextResponse.json({
      order_id: order.id,
      status: 'pending',
      message: 'Pedido criado com sucesso.',
    });

  } catch (err: unknown) {
    console.error('Checkout error:', err);
    const message = err instanceof Error ? err.message : 'Erro ao processar pedido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
