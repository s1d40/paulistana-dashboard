import { NextRequest, NextResponse } from 'next/server';
import { searchSimilarImages } from '@/services/pinecone-service';

export async function POST(request: NextRequest) {
  try {
    const { prompt, minScore } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório' }, { status: 400 });
    }

    const results = await searchSimilarImages(prompt, minScore || 0.90);

    return NextResponse.json({ results });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('API Image Search Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
