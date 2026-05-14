const fetch = require('node-fetch');

async function testDirector() {
  const url = 'http://localhost:3000/api/chat/director';
  
  const payload = {
    messages: [{ role: 'user', content: 'oi, eu quero um video sobre galinhas' }],
    track: 'video',
    active_preset_id: '8bd6bc22-20f0-4220-993c-b3393eef46ce', // ID fictício ou real do log anterior
    session_id: 'test-session-galinhas',
    current_sessions: [
      { id: 'persona', title: 'Persona e Missão', content: 'Você é um fazendeiro especialista.' },
      { id: 'estetica', title: 'Estética Visual', content: 'Cinematic rural style, 4k.' }
    ],
    prompt: 'Atue como um Diretor Criativo.',
    model: 'gpt-5.4',
    temperature: 0.7
  };

  console.log('--- ENVIANDO TESTE PARA O DIRETOR ---');
  console.log('Mensagem:', payload.messages[0].content);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('--- RESPOSTA DO SERVIDOR ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erro no teste:', error.message);
  }
}

testDirector();
