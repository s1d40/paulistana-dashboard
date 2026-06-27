# Configuração da Ferramenta do Agente de Ideação no n8n
**Data:** 2026-05-20
**Objetivo:** Instruções e recursos prontos para a ferramenta `save_ideation_list` no n8n.

> [!NOTE]
> **Arquitetura do Projeto:** As instruções do agente (System Message) **não** devem ser fixadas diretamente dentro do n8n. Elas são enviadas dinamicamente via payload a cada request feito pelo frontend Next.js. O código que gerencia isso no frontend está localizado em `dashboard/src/app/ideacao/page.tsx`.

---

## 1. Instruções do Agente (System Message no Frontend)
Para referência, o prompt que o frontend envia dinamicamente sob a constante `DEFAULT_IDEATION_PROMPT` em `dashboard/src/app/ideacao/page.tsx` é:

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

Quando o usuário pedir para gerar ou salvar a lista, você DEVE OBRIGATORIAMENTE utilizar a ferramenta `save_ideation_list` passando todos esses dados em cada item.
Após usar a ferramenta com sucesso, responda: "✅ Lista de produção gerada e salva com sucesso. Você já pode acessá-la no painel de Produção em Massa."
```

---

## 2. Schema JSON da Ferramenta (`save_ideation_list`)
Copie e cole este JSON na definição de parâmetros da ferramenta no n8n:

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

---

## 3. Query do Nó PostgreSQL (Sub-Workflow do n8n)
Copie e cole esta query SQL no nó do PostgreSQL dentro do workflow da ferramenta no n8n:

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
    '{{ $("Trigger").item.json.preset_id }}', -- Recebido dinamicamente do frontend
    '{{ JSON.stringify($json.items) }}'::jsonb,
    'Aguardando',
    NOW()
);
```
