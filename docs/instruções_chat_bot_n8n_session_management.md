1. Geração do Session ID no Next.js
No Telegram, cada usuário/conversa tem um ID único. No seu dashboard, você precisa replicar isso. Como o painel utiliza o estado do cliente (idealmente com Zustand, como estruturado na sua arquitetura), você deve gerar e armazenar um identificador único para a aba de chat ativa.  

Se o dashboard for de uso exclusivo seu ou de uma equipe interna restrita, você pode amarrar esse ID ao ID do usuário autenticado ou gerar um UUID temporário para cada "nova conversa".

Exemplo de Payload no Frontend:
Quando o usuário digita a mensagem no "Orquestrador de Conteúdo", o payload enviado para a sua camada BFF (Backend-for-Frontend) no Next.js deve conter esse ID:

JSON
{
  "message": "Crie um post sobre vinhos...",
  "sessionId": "paulistana-user-123-session-abc" 
}
2. Roteamento via API Route (BFF)
Para manter as chaves e a URL do seu Webhook do n8n seguras e não expostas no navegador, a requisição do frontend deve bater em uma rota de API do Next.js (app/api/chat/route.ts). Esta rota repassa o payload para o n8n:  

TypeScript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { message, sessionId } = await req.json();

  // Chamada blindada para o Webhook do n8n
  const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Aqui você pode adicionar headers de autenticação que configurou no n8n
    },
    body: JSON.stringify({ message, sessionId }),
  });

  // ... tratamento do stream ou resposta JSON
}

client info :
\\wsl.localhost\Ubuntu\home\sid\cocreator-n8n\Cocreator_Content - Clientes.csv
\\wsl.localhost\Ubuntu\home\sid\cocreator-n8n\Cocreator_Content - Contas.csv