# Guia de Configuração: Studio Copilot & Agendamento (n8n)

Este guia descreve as ferramentas e o fluxo de trabalho necessários para configurar o **Agente Inteligente do Estúdio** no n8n, permitindo o refinamento de scripts via IA e a automação de agendamentos.

---

## 🏗️ Arquitetura do Copilot

O Copilot no Next.js envia o estado atual do post (`id_post`, `current_script`, `messages`) para um webhook no n8n. O n8n utiliza um **AI Agent** com as ferramentas abaixo para manipular os dados e retorna o script atualizado.

### Fluxo n8n Sugerido:
1. **Webhook Node**: Recebe o POST do Next.js.
2. **AI Agent Node**: Utiliza as ferramentas listadas abaixo.
3. **Reindex Node (Code)**: Garante que as cenas estejam numeradas `1, 2, 3...` sequencialmente.
4. **Respond to Webhook**: Retorna o JSON com `updated_script` e `message`.

---

## 🛠️ FERRAMENTA 1: `Refinar_Cenas`
**Descrição:** Adiciona, atualiza ou remove cenas da array de roteiro.

### 1. Exemplo JSON (Action: update)
```json
{
  "id_post": "UUID-DO-POST",
  "action": "update",
  "numero_cena": 2,
  "texto_narrado": "Nova narração para a cena 2...",
  "prompt_visual": "Um robô futurista em neon..."
}
```

### 2. Código SQL (Postgres)
```sql
UPDATE posts
SET 
  roteiro_gerado = (
    SELECT jsonb_build_object(
      'cenas', jsonb_agg(
        CASE 
          WHEN (elem->>'numero')::int = {{ $json.numero_cena }}
          THEN elem || jsonb_build_object(
            'texto_narrado', COALESCE(NULLIF('{{ $json.texto_narrado }}', ''), elem->>'texto_narrado'),
            'prompt_visual', COALESCE(NULLIF('{{ $json.prompt_visual }}', ''), elem->>'prompt_visual')
          )
          ELSE elem 
        END
      ),
      'voice_settings', (roteiro_gerado::jsonb)->'voice_settings'
    )
    FROM jsonb_array_elements((roteiro_gerado::jsonb)->'cenas') AS elem
  ),
  updated_at = NOW()
WHERE id_post = '{{ $json.id_post }}';
```

---

## 🛠️ FERRAMENTA 2: `Agendar_Publicacao`
**Descrição:** Define a data e hora para o post ser publicado automaticamente.

### 1. Exemplo JSON
```json
{
  "id_post": "UUID-DO-POST",
  "data_agendamento": "2026-05-20T14:30:00Z"
}
```

### 2. Código SQL (Postgres)
```sql
UPDATE posts
SET 
  data_agendamento = '{{ $json.data_agendamento }}',
  status_agendamento = 'agendado',
  updated_at = NOW()
WHERE id_post = '{{ $json.id_post }}';
```

---

## 🛠️ FERRAMENTA 3: `Atualizar_Metadados`
**Descrição:** Altera título, tema, legendas ou hashtags do post.

### 1. Exemplo JSON
```json
{
  "id_post": "UUID-DO-POST",
  "titulo_post": "Novo Título SEO",
  "captions": "Legenda gerada pela IA...",
  "hashtags": "#ia #marketing #automation"
}
```

### 2. Código SQL (Postgres)
```sql
UPDATE posts
SET 
  titulo_post = COALESCE(NULLIF('{{ $json.titulo_post }}', ''), titulo_post),
  captions = COALESCE(NULLIF('{{ $json.captions }}', ''), captions),
  hashtags = COALESCE(NULLIF('{{ $json.hashtags }}', ''), hashtags),
  updated_at = NOW()
WHERE id_post = '{{ $json.id_post }}';
```

---

## 🤖 Sistema de Agendamento (Worker n8n)

Para que os posts sejam publicados sozinhos, crie um **Workflow Separado** no n8n:

### 1. Gatilho (Cron)
Configure para rodar a cada **30 minutos**.

### 2. Busca de Fila (Postgres Node)
Busca posts que atingiram o horário:
```sql
SELECT id_post, id_conta 
FROM posts 
WHERE status_agendamento = 'agendado' 
AND data_agendamento <= NOW() 
LIMIT 5;
```

### 3. Loop de Publicação
Para cada post encontrado:
1. **HTTP Request**: Dispara o seu fluxo de publicação atual (`publish_post`).
2. **Postgres Node**: Atualiza o status para evitar duplicidade:
```sql
UPDATE posts 
SET status_agendamento = 'publicado' 
WHERE id_post = '{{ $json.id_post }}';
```

---

## 📝 Comandos SQL para Setup Inicial

Se as colunas de agendamento ainda não existirem, execute este SQL no editor do Supabase:

```sql
-- Adicionar colunas de agendamento caso não existam
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS data_agendamento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_agendamento TEXT DEFAULT 'nao_agendado',
ADD COLUMN IF NOT EXISTS hashtags TEXT;

-- Indexar para busca rápida do Worker
CREATE INDEX IF NOT EXISTS idx_posts_agendamento 
ON posts (status_agendamento, data_agendamento) 
WHERE status_agendamento = 'agendado';
```

---

## 💡 Dicas para o Agente (System Prompt)
Ao configurar o Agente no n8n, adicione isto às instruções:
> "Sempre que o usuário pedir para 'mudar a data' ou 'postar amanhã', use a ferramenta `Agendar_Publicacao`. Lembre-se que o fuso horário padrão é UTC."
