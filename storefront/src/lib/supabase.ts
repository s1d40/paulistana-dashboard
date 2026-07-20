import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// Store Config
// ==========================================

export interface StoreConfig {
  id: string;
  slug: string;
  client_id: string;
  display_name: string;
  description: string | null;
  theme: StoreTheme;
  logo_url: string | null;
  banner_url: string | null;
  social_links: Record<string, string>;
  payment_methods: string[];
  is_active: boolean;
}

export interface StoreTheme {
  accent: string;
  bg: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  gradient_from?: string;
  gradient_to?: string;
}

const DEFAULT_THEME: StoreTheme = {
  accent: '#D4AF37',
  bg: '#0B0E14',
  card: '#151A23',
  text: '#F8FAFC',
  muted: '#94A3B8',
  border: '#232B3A',
  gradient_from: '#D4AF37',
  gradient_to: '#B8860B',
};

// Fallback configs (while Supabase isn't populated)
const FALLBACK_STORES: Record<string, Partial<StoreConfig>> = {
  codigodossignos: {
    display_name: 'Código dos Signos',
    description: 'Descubra o poder dos astros. Mapas astrais, guias e produtos místicos.',
    theme: {
      accent: '#D4AF37',
      bg: '#0B0E14',
      card: '#151A23',
      text: '#F8FAFC',
      muted: '#94A3B8',
      border: '#232B3A',
      gradient_from: '#D4AF37',
      gradient_to: '#9B59B6',
    },
  },
  naturalfeedingbr: {
    display_name: 'Natural Feeding BR',
    description: 'Alimentos naturais, castanhas, frutas secas e superfoods premium.',
    theme: {
      accent: '#22C55E',
      bg: '#0A1208',
      card: '#141F18',
      text: '#F8FAFC',
      muted: '#86EFAC',
      border: '#1E3A2B',
      gradient_from: '#22C55E',
      gradient_to: '#16A34A',
    },
  },
  historiasdesucesso: {
    display_name: 'Histórias de Sucesso',
    description: 'Inspiração e mentorias para transformar sua vida.',
    theme: {
      accent: '#3B82F6',
      bg: '#0C1220',
      card: '#151E30',
      text: '#F8FAFC',
      muted: '#93C5FD',
      border: '#1E3A5F',
      gradient_from: '#3B82F6',
      gradient_to: '#8B5CF6',
    },
  },
};

/**
 * Busca a configuração da loja pelo slug (subdomínio).
 * Tenta Supabase primeiro, depois fallback hardcoded.
 */
export async function getStoreConfig(slug: string): Promise<StoreConfig | null> {
  if (!slug) return null;

  try {
    const { data, error } = await supabase
      .from('store_configs')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (data && !error) {
      return {
        ...data,
        theme: { ...DEFAULT_THEME, ...(data.theme || {}) },
        payment_methods: data.payment_methods || ['pix', 'credit_card'],
        social_links: data.social_links || {},
      } as StoreConfig;
    }
  } catch (e) {
    console.warn('Supabase store_configs not available, using fallback');
  }

  // Fallback
  const fallback = FALLBACK_STORES[slug];
  if (fallback) {
    return {
      id: slug,
      slug,
      client_id: '',
      display_name: fallback.display_name || slug,
      description: fallback.description || null,
      theme: { ...DEFAULT_THEME, ...(fallback.theme || {}) },
      logo_url: null,
      banner_url: null,
      social_links: {},
      payment_methods: ['pix', 'credit_card'],
      is_active: true,
    };
  }

  return null;
}

// ==========================================
// Products
// ==========================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  category: string | null;
  product_type: string;
  image_url: string | null;
  gallery_urls: string[];
  is_featured: boolean;
  metadata: Record<string, unknown>;
}

export async function getProducts(storeSlug: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('ecommerce_products')
    .select('*')
    .eq('store_slug', storeSlug)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return (data || []).map((p) => ({
    ...p,
    gallery_urls: p.gallery_urls || [],
    metadata: p.metadata || {},
  }));
}

export async function getProductBySlug(productSlug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('ecommerce_products')
    .select('*')
    .eq('slug', productSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return null;

  return {
    ...data,
    gallery_urls: data.gallery_urls || [],
    metadata: data.metadata || {},
  };
}

export async function getFeaturedProducts(storeSlug: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('ecommerce_products')
    .select('*')
    .eq('store_slug', storeSlug)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) return [];
  return (data || []).map((p) => ({
    ...p,
    gallery_urls: p.gallery_urls || [],
    metadata: p.metadata || {},
  }));
}

// ==========================================
// Orders
// ==========================================

export interface OrderInput {
  client_id: string;
  store_slug: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
}

export async function createOrder(order: OrderInput) {
  // 1. Create order
  const { data: orderData, error: orderError } = await supabase
    .from('ecommerce_orders')
    .insert({
      client_id: order.client_id,
      store_slug: order.store_slug,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      total_amount: order.total_amount,
      status: 'pending',
      payment_status: 'pending',
    })
    .select()
    .single();

  if (orderError || !orderData) {
    throw new Error(`Failed to create order: ${orderError?.message}`);
  }

  // 2. Create order items
  const items = order.items.map((item) => ({
    order_id: orderData.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from('ecommerce_order_items')
    .insert(items);

  if (itemsError) {
    console.error('Error creating order items:', itemsError);
  }

  return orderData;
}
