# Cocreator Studio: Telegram Bot Setup Guide

Este guia detalha como configurar e implantar o Bot do Telegram para o Cocreator Content Studio utilizando o n8n. O bot utiliza um agente de IA (AI Agent) para interagir com o usuário, autenticando-o e acionando fluxos de produção do sistema.

## 1. Banco de Dados (Supabase)
Antes de importar o fluxo no n8n, é necessário preparar o banco de dados.
Execute o script de migração `migration_telegram_identities.sql` no painel SQL do seu Supabase.
Ele criará a tabela `telegram_identities`, responsável por fazer o vínculo entre o `chat_id` do Telegram e o `client_id` (Tenant) na sua arquitetura atual.

## 2. Importando o Fluxo no n8n
1. No seu n8n, clique em **Add Workflow**.
2. Clique no ícone de opções (`...`) no canto superior direito e selecione **Import from File**.
3. Selecione o arquivo `telegram_bot/telegram_agent_workflow.json` que foi criado neste repositório.
4. Você verá a estrutura básica com:
   - **Telegram Trigger**: Ponto de entrada das mensagens.
   - **AI Agent**: O cérebro do bot, alimentado pela OpenAI.
   - **Window Buffer Memory**: Mantém o contexto da conversa.
   - **Tool: Login**: A ferramenta de exemplo que busca o email do usuário no Supabase.

## 3. Configurando Credenciais
Após a importação, os nós terão avisos de credenciais ausentes.
- **Telegram Trigger**: Crie uma nova credencial usando o token do seu bot obtido com o [@BotFather](https://t.me/botfather) no Telegram.
- **OpenAI Model**: Insira sua API Key da OpenAI.
- **Postgres (Supabase)**: Configure a conexão com seu banco Supabase.

## 4. Expansão das "Ferramentas" (Tools)
Para que o bot faça tudo o que o app faz (produção em massa, idealização, etc.), você deve adicionar mais nós "Tool (Custom)" conectados à entrada "Tools" do nó **AI Agent**.

### Ferramenta 1: Login e Vínculo (Já iniciada no JSON)
**Como funciona:** O bot pergunta o email do usuário. O n8n faz um SELECT na tabela `users` do Supabase para encontrar o `client_id`. Em seguida, você deve adicionar um nó SQL do tipo INSERT/UPDATE para salvar essa associação na tabela `telegram_identities`.

### Ferramenta 2: Idealize_System_Message
**Descrição:** Permite interagir com o arquiteto.
- **Schema JSON:**
```json
{
  "type": "object",
  "properties": {
    "ideia": {
      "type": "string",
      "description": "A ideia do usuário para criar a mensagem de sistema"
    }
  },
  "required": ["ideia"]
}
```
- Ação do n8n: Disparar um webhook POST (HTTP Request) para o seu endpoint de idealização ou executar um sub-workflow que se conecte à sua base vetorial/Prompt.

### Ferramenta 3: Produce_Single_Video
**Descrição:** Aciona a produção de um vídeo específico.
- **Schema JSON:**
```json
{
  "type": "object",
  "properties": {
    "topic": {
      "type": "string",
      "description": "O tema principal do vídeo"
    },
    "duration": {
      "type": "number",
      "description": "A duração desejada em segundos"
    }
  },
  "required": ["topic"]
}
```
- Ação do n8n: Inserir (INSERT) o registro na tabela que inicia os Webhooks de produção do app (ex: `api/production`), passando o `client_id` obtido no login.

### Ferramenta 4: Produce_Mass_Videos
**Descrição:** Aciona a esteira de produção para vários vídeos.
- **Schema JSON:**
```json
{
  "type": "object",
  "properties": {
    "quantidade": {
      "type": "number",
      "description": "Quantidade de vídeos a serem produzidos"
    },
    "tema_geral": {
      "type": "string",
      "description": "O tema geral para a massa de vídeos"
    }
  },
  "required": ["quantidade", "tema_geral"]
}
```
- Ação do n8n: Disparar seu loop/split in batches de produção no backend.

## 5. Dicas Arquiteturais
- **Identificação do Client_ID**: Para não pedir o login toda hora, a primeira coisa que o n8n deve fazer após receber o *Telegram Trigger* é um `SELECT client_id FROM telegram_identities WHERE telegram_chat_id = {{ $json.message.chat.id }}`. Se retornar vazio, o Agent é instruído a rodar a ferramenta de Login.
- **Background Jobs**: A produção de vídeos demora. A ferramenta (Tool) deve apenas enfileirar o pedido (no Supabase) e responder ao usuário: "Pedido recebido! Avisarei quando estiver pronto". Outro fluxo n8n (ouvindo webhooks de conclusão do Supabase) deve usar o nó de *Telegram (Send Message)* proativamente para entregar os vídeos ao chat_id vinculado.
