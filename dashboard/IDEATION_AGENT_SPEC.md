# Especificação do Agente: Ideação de Listas (Ideation Agent)

Este documento contém os artefatos necessários para configurar o Agente do n8n responsável por gerar listas abstratas de temas e prompts para a Produção em Massa.

## 1. Instruções do Agente (System Prompt Injection)
Estas instruções devem estar no System Message principal do seu Agente de Ideação no n8n:

```text
[INSTRUÇÕES DO DIRETOR DE IDEACAO]
Você é um estrategista de conteúdo especializado em criar pautas para produção em massa.
Seu objetivo é receber um tema central do usuário e gerar uma lista de ideias para vídeos.
Para cada ideia da lista, você deve definir obrigatoriamente:
1. O "tema" específico do vídeo.
2. O "prompt" contendo as diretrizes e instruções de como o roteirista deve desenvolver este roteiro.
3. O "titulo_otimizado" (um título cativante e otimizado para retenção e busca com até 100 caracteres).
4. As "captions" (uma legenda persuasiva, limpa e engajadora para o post).
5. As "hashtags" (uma string contendo de 5 a 10 hashtags estratégicas separadas por espaços, ex: "#marketing #seo #vendas").

Quando o usuário pedir para gerar ou salvar a lista, você DEVE OBRIGATORIAMENTE utilizar a ferramenta `save_ideation_list` passando todos esses dados.
Após usar a ferramenta com sucesso, responda: "✅ Lista de produção gerada e salva com sucesso. Você já pode acessá-la no painel de Produção em Massa."
```

## 2. Schema da Ferramenta (`save_ideation_list`)
Configure este JSON na definição da Tool do seu agente no n8n:

```json
{
  "name": "save_ideation_list",
  "description": "Salva a lista de pautas, prompts, títulos otimizados, captions e hashtags no banco de dados. Use esta ferramenta quando gerar uma lista de ideias para o usuário.",
  "parameters": {
    "type": "object",
    "properties": {
      "nome_lista": {
        "type": "string",
        "description": "Um nome curto e descritivo para a lista inteira (ex: 'Especial Dia das Mães - Signos')."
      },
      "items": {
        "type": "array",
        "description": "A lista de ideias de vídeos geradas.",
        "items": {
          "type": "object",
          "properties": {
            "tema": {
              "type": "string",
              "description": "O assunto principal do vídeo."
            },
            "prompt": {
              "type": "string",
              "description": "A instrução detalhada (prompt) para o agente roteirista criar este vídeo específico."
            },
            "titulo_otimizado": {
              "type": "string",
              "description": "Título chamativo e otimizado para o vídeo (max 100 caracteres)."
            },
            "captions": {
              "type": "string",
              "description": "Legenda completa e persuasiva para ser postada junto com o vídeo."
            },
            "hashtags": {
              "type": "string",
              "description": "Hashtags do post separadas por espaço (ex: '#foco #estudos #produtividade')."
            }
          },
          "required": ["tema", "prompt", "titulo_otimizado", "captions", "hashtags"]
        }
      }
    },
    "required": ["nome_lista", "items"]
  }
}
```

## 3. Sub-Workflow da Ferramenta (No n8n)

Quando o agente chamar a ferramenta, o fluxo passará para o nó do PostgreSQL.

*(Nota: O Frontend deve enviar o `preset_id` ativo no payload inicial do Webhook que aciona este agente, para que o n8n saiba a qual Preset essa lista pertence).*

### Passo 3.1: PostgreSQL Node (INSERT)
Configure a query SQL para inserir na nossa tabela `production_lists`.

> [!NOTE]
> Como a coluna `items` é do tipo `JSONB`, ela armazena de forma flexível o array completo de objetos gerado pelo agente. A query SQL abaixo não muda, mas ela passará a gravar os campos `titulo_otimizado`, `captions` e `hashtags` em cada objeto do JSON de forma nativa e automática graças à conversão com `JSON.stringify`.

```sql
INSERT INTO production_lists (
    name,
    preset_id,
    items,
    status,
    created_at
)
VALUES (
    '{{ $json.nome_lista }}',
    '{{ $("Trigger").item.json.preset_id }}', -- O ID do preset enviado pelo front no inicio da chamada
    '{{ JSON.stringify($json.items) }}'::jsonb,
    'Aguardando',
    NOW()
);
```