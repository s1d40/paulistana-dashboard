import { NextResponse } from 'next/server';
import { fetchAllImages } from '@/services/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const images = await fetchAllImages();
    // Inverte para mostrar as mais recentes primeiro
    return NextResponse.json(images.reverse());
  } catch (error) {
    console.error('API Images Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch image bank' }, { status: 500 });
  }
}
