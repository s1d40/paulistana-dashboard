import { NextResponse } from 'next/server';
import { fetchAllAudios } from '@/services/google-sheets';

export async function GET() {
  try {
    const audios = await fetchAllAudios();
    // Inverte para mostrar as mais recentes primeiro
    return NextResponse.json(audios.reverse());
  } catch (error) {
    console.error('API Audios Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch audio bank' }, { status: 500 });
  }
}
