import { NextResponse } from 'next/server';

/**
 * POST /api/webhooks/mercadolivre
 * 
 * Recebe notificações do Mercado Livre (IPN - Instant Payment Notification).
 * 
 * O ML envia notificações para:
 * - orders_v2: pedidos novos/atualizados
 * - items: alterações em anúncios
 * - questions: perguntas de compradores
 * - messages: mensagens do chat
 * - payments: pagamentos
 * - shipments: envios
 * 
 * Docs: https://developers.mercadolivre.com.br/pt_br/notificacoes
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('[ML Webhook] Notification received:', JSON.stringify(body, null, 2));

    const { topic, resource, user_id, application_id, sent, received, attempts } = body;

    // Log estruturado por tópico
    switch (topic) {
      case 'orders_v2':
        console.log(`📦 [ML] Novo pedido/atualização: ${resource} | User: ${user_id}`);
        // TODO: Processar pedido - fetch resource com token para obter detalhes
        break;
      
      case 'items':
        console.log(`🏷️ [ML] Anúncio alterado: ${resource} | User: ${user_id}`);
        break;
      
      case 'questions':
        console.log(`❓ [ML] Nova pergunta: ${resource} | User: ${user_id}`);
        // TODO: Auto-responder perguntas via IA
        break;

      case 'messages':
        console.log(`💬 [ML] Nova mensagem: ${resource} | User: ${user_id}`);
        break;
      
      case 'payments':
        console.log(`💰 [ML] Pagamento: ${resource} | User: ${user_id}`);
        break;

      case 'shipments':
        console.log(`🚚 [ML] Envio: ${resource} | User: ${user_id}`);
        break;

      default:
        console.log(`🔔 [ML] Notificação (${topic}): ${resource}`);
    }

    // Mercado Livre espera HTTP 200 para confirmar recebimento
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[ML Webhook] Error processing notification:', err.message);
    // Retornar 200 mesmo em erro para evitar que o ML re-envie indefinidamente
    return NextResponse.json({ received: true, error: err.message });
  }
}

/**
 * GET /api/webhooks/mercadolivre
 * Endpoint de verificação - o ML pode fazer GET para verificar se a URL existe
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'Paulistana Empório - ML Webhook',
    timestamp: new Date().toISOString()
  });
}
