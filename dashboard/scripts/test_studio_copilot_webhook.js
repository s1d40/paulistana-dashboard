/**
 * Script de teste para o Webhook do Studio Copilot no n8n.
 * Use este script para enviar dados reais e configurar o fluxo de trabalho.
 */

async function testStudioCopilotWebhook() {
  const WEBHOOK_URL = 'https://n8n.sfaisolutions.com/webhook-test/620f72c7-bace-4839-a31c-abbf7aaf94eb';
  
  const payload = {
    id_post: 'test-post-uuid-456',
    session_id: 'test-post-uuid-456', // Mapped to id_post for Postgres Memory
    action: 'studio_copilot_chat',
    system_message: "Você é o Agente Inteligente do Estúdio... [Script Atual Injetado Aqui]",
    prompt: "Adicione uma cena no meio falando sobre a facilidade de uso.",
    current_script: {
      cenas: [{ numero: 1, texto_narrado: "Teste" }]
    }
  };

  console.log('🚀 Enviando request MASTIGADO com SESSION_ID para o n8n...');
  console.log('🔗 URL:', WEBHOOK_URL);
  console.log('📝 Prompt:', payload.prompt);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer RqsEZoRFwm6zW8Rs' // Token de segurança padrão
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('✅ Request enviado com sucesso!');
      console.log('⚠️  Aguardando resposta (se o workflow estiver ativo)...');
      try {
        const data = await response.json();
        console.log('📥 Resposta do n8n:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('ℹ️  Request concluído, mas o n8n não retornou um JSON (comum em webhooks de teste).');
      }
    } else {
      console.error('❌ Erro no request:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Detalhes:', errorText);
    }
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
  }
}

testStudioCopilotWebhook();
