# Especificação do Agente: Sandbox Chat (Single Production)

Este documento contém os artefatos necessários para você configurar o Agente do n8n responsável pelo Chat Sandbox na página de Produção.

## 1. Instruções do Agente (System Prompt Injection)
O Frontend injeta dinamicamente estas diretrizes junto ao Preset do usuário. Se você for configurar o Prompt do agente no n8n diretamente, adicione isto:

```text
[INSTRUÇÕES DO DIRETOR DE SANDBOX]
Você é um agente interativo de refinamento de roteiros. O usuário irá discutir ideias baseadas no Preset atual.
1. Discuta e ajuste as ideias conforme solicitado.
2. Quando o usuário pedir para gerar, finalizar ou salvar o roteiro definitivo, você DEVE utilizar a ferramenta `save_single_script`.
3. O roteiro deve seguir estritamente o formato JSON de cenas definido no seu DNA.
4. Após o sucesso da ferramenta, responda: "✅ Roteiro gerado e salvo com sucesso! O sistema iniciará a produção dos assets agora."
```

## 2. Schema da Ferramenta (`save_single_script`)
Configure este JSON na definição da Tool do seu agente no n8n:

```json
{
  "name": "save_single_script",
  "description": "Salva o roteiro formatado no banco de dados e aciona a esteira de produção. Use APENAS quando o usuário confirmar a versão final do roteiro.",
  "parameters": {
    "type": "object",
    "properties": {
      "tema": { 
        "type": "string", 
        "description": "O tema geral do vídeo." 
      },
      "titulo": { 
        "type": "string", 
        "description": "O título otimizado do vídeo." 
      },
      "roteiro": {
        "type": "object",
        "description": "O objeto JSON completo do roteiro estruturado."
      }
    },
    "required": ["tema", "titulo", "roteiro"]
  }
}
```

## 3. Sub-Workflow da Ferramenta (No n8n)

### Passo 3.1: Code Node (Injeção de `id_cena`)
Insira este Code Node após o gatilho da ferramenta para garantir a arquitetura Source of Truth:

```javascript
// Injeta id_cena estável em cada cena
const roteiro = $input.item.json.roteiro;

if (roteiro && roteiro.cenas && Array.isArray(roteiro.cenas)) {
  roteiro.cenas.forEach(cena => {
    if (!cena.id_cena) {
      cena.id_cena = require('crypto').randomUUID(); 
    }
  });
}

return $input.item;
```

### Passo 3.2: PostgreSQL Node (UPSERT)
Configure a query SQL utilizando a técnica UPSERT:

```sql
INSERT INTO posts (
    id_post, 
    id_conta, 
    tema_post, 
    titulo_post, 
    roteiro_gerado, 
    status, 
    data_criacao
)
VALUES (
    '{{ $("Trigger").item.json.id_post }}', 
    '{{ $("Trigger").item.json.id_conta }}', 
    '{{ $json.tema }}', 
    '{{ $json.titulo }}', 
    '{{ JSON.stringify($json.roteiro) }}'::jsonb, 
    'Aguardando Revisão', 
    NOW()
)
ON CONFLICT (id_post) DO UPDATE SET
    tema_post = EXCLUDED.tema_post,
    titulo_post = EXCLUDED.titulo_post,
    roteiro_gerado = EXCLUDED.roteiro_gerado,
    status = 'Aguardando Revisão',
    data_atualizacao = NOW();
```