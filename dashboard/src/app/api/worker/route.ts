import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, ...payload } = body;

    const token = process.env.N8N_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'N8N_API_TOKEN not configured' }, { status: 500 });
    }

    let webhookUrl = '';

    switch (type) {
      case 'audio':
        webhookUrl = 'https://n8n.sfaisolutions.com/webhook/fa8faa6a-cd80-42c8-a591-de5ab1312bc9';
        break;
      case 'image':
        webhookUrl = 'https://n8n.sfaisolutions.com/webhook/b0ad003d-54ce-44c9-a143-574f04b24d4a';
        break;
      case 'render':
        webhookUrl = 'https://n8n.sfaisolutions.com/webhook/a182e7fd-832f-42a8-9e8d-b404acdac2c9';
        break;
      case 'final':
        webhookUrl = 'https://n8n.sfaisolutions.com/webhook/8e2f20ab-fa24-4400-91a1-461cdbdbbfcf';
        break;
      default:
        return NextResponse.json({ error: 'Invalid worker type' }, { status: 400 });
    }

    // Fire and forget: We do not await the long-running webhook to prevent Vercel timeouts.
    // Webhooks should update Supabase which will trigger realtime events on the client.
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).catch(err => console.error(`[Worker Proxy API] Background fetch error for ${type}:`, err));

    return NextResponse.json({ success: true, message: `Dispatched ${type} webhook` });
  } catch (error: any) {
    console.error('[Worker Proxy API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
