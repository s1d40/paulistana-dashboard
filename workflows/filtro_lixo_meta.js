let is_valid = false;
let text = "";
let sender_id = "";
let recipient_id = "";

const body = $input.first().json.body;

// Navega pela estrutura confusa do webhook da Meta de forma segura
if (body && body.entry && body.entry.length > 0) {
  const entry = body.entry[0];
  
  if (entry.messaging && entry.messaging.length > 0) {
    const messaging = entry.messaging[0];
    
    // Verifica se a chave 'message' existe (exclui read receipts, deliveries, etc)
    if (messaging.message) {
      const msg = messaging.message;
      
      // Verifica se a mensagem contém TEXTO e se NÃO é um echo (mensagem do próprio robô)
      if (msg.text && msg.is_echo !== true) {
        is_valid = true;
        text = msg.text;
        sender_id = messaging.sender.id;
        recipient_id = messaging.recipient.id;
      }
    }
  }
}

// Retorna um JSON limpo e mastigado para os próximos nós
return {
  json: {
    is_valid: is_valid,
    text: text,
    sender_id: sender_id,
    recipient_id: recipient_id
  }
};
