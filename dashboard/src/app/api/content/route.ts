import { NextResponse } from 'next/server';
import { fetchContentPosts } from '@/services/supabase-service';

export async function GET() {
  try {
    const posts = await fetchContentPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('API Content Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch content library' }, { status: 500 });
  }
}
