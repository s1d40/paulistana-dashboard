import { NextRequest, NextResponse } from 'next/server';
import { fetchPostDetails, updatePostInSupabase } from '@/services/supabase-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const details = await fetchPostDetails(id);
    
    if (!details.post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(details);
  } catch (error) {
    console.error(`API Content Details Fetch Error for ID:`, error);
    return NextResponse.json({ error: 'Failed to fetch content details' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    await updatePostInSupabase(id, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`API Content Update Error for ID:`, error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
