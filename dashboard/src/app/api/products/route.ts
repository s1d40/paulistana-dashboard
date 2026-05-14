import { NextResponse } from 'next/server';
import { fetchProducts } from '@/services/supabase-service';

export async function GET() {
  try {
    const products = await fetchProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error('API Products Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch product list' }, { status: 500 });
  }
}
