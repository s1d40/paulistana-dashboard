import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_INSIGHTS_URL || 'https://n8n.example.com/webhook/chat';

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.N8N_API_TOKEN}`,
          },
          body: JSON.stringify({ messages }),
        });

        if (!response.ok) {
          throw new Error('Falha ao comunicar com o webhook do n8n');
        }

        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('text/event-stream') && response.body) {
           const reader = response.body.getReader();
           const decoder = new TextDecoder('utf-8');
           
           while (true) {
             const { done, value } = await reader.read();
             if (done) break;
             
             const chunk = decoder.decode(value, { stream: true });
             // Vercel AI SDK format: 0:"Texto"
             controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
           }
        } else {
           const text = await response.text();
           let content = text;
           try {
             const json = JSON.parse(text);
             content = json.response || json.message || json.text || text;
           } catch { }
           
           controller.enqueue(encoder.encode(`0:${JSON.stringify(content)}\n`));
        }
      } catch (error) {
        console.error('Chat API Error:', error);
        controller.enqueue(encoder.encode(`0:"Desculpe, ocorreu um erro ao processar sua mensagem."\n`));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8', // O Vercel useChat lida bem com isso
    },
  });
}
