import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Webhook structure from Meta
    const entry = body.entry?.[0];
    if (!entry) return NextResponse.json({ success: true }); // Ignore unknown webhooks

    const messaging = entry.messaging?.[0];
    if (!messaging || !messaging.message || !messaging.message.text) {
      return NextResponse.json({ success: true });
    }

    const senderId = messaging.sender.id;
    const recipientId = messaging.recipient.id; // The Instagram Account ID
    const text = messaging.message.text.toLowerCase();

    // 1. Get access token for this recipient from contas table
    const { data: conta } = await supabase
      .from('contas')
      .select('ig_access_token')
      .eq('conta_id_instagram', recipientId)
      .single();

    if (!conta || !conta.ig_access_token) {
      console.log('Token not found for account', recipientId);
      return NextResponse.json({ error: 'Token not found' }, { status: 400 });
    }

    const accessToken = conta.ig_access_token;

    // 2. Simple product search logic
    // Extract keywords (e.g. if text is "tem tamara jumbo?")
    // Removing punctuation and common words
    const cleanText = text.replace(/[?.,!]/g, '').replace(/\b(tem|queria|quero|o|a|um|uma)\b/g, '').trim();
    
    let replyText = "Desculpe, não entendi qual produto você procura. Pode me dizer o nome?";
    
    if (cleanText.length > 2) {
      // Find product using ilike
      const { data: products } = await supabase
        .from('produtos_plataformas')
        .select('*')
        .ilike('title', `%${cleanText}%`)
        .limit(1);

      if (products && products.length > 0) {
        const prod = products[0];
        replyText = `Opa! Encontrei aqui o que você pediu: ${prod.title}. \nO preço está R$ ${prod.price}.\nVocê pode comprar neste link: ${prod.permalink || 'Link indisponível no momento'}`;
      } else {
        replyText = "Poxa, não consegui encontrar esse produto no nosso estoque online. Mande outra mensagem com o nome mais específico!";
      }
    }

    // 3. Send reply back to Meta Graph API
    const fbRes = await fetch(`https://graph.facebook.com/v19.0/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        recipient: { id: senderId },
        message: { text: replyText }
      })
    });

    const fbData = await fbRes.json();
    console.log("Meta API Response:", fbData);

    return NextResponse.json({ success: true, replied: true });
  } catch (error) {
    console.error("Error processing bot reply:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
