# Guia de Configuração: 4 Ferramentas Desacopladas (n8n)

Este documento contém os dados exatos para você configurar as ferramentas no seu Agente Arquiteto no n8n. 
**Importante:** No n8n, selecione "Generate from JSON Example" ao criar o schema de cada ferramenta.

---

## 🛠️ FERRAMENTA 1: `Atualizar_Card`
**Descrição:** Use para atualizar e salvar o conteúdo dos campos de texto do Cockpit (persona, estetica, narracao ou qualquer card customizado).

### 1. Exemplo JSON
```json
{
  "active_preset_id": "f999d27b-5677-4618-a809-269ccff06a9d",
  "session_id": "persona",
  "new_content": "Você é um mestre cervejeiro especialista..."
}
```

### 2. Código SQL (Postgres)
```sql
UPDATE content_presets
SET 
  sessions = (
    SELECT jsonb_agg(
      CASE 
        WHEN (elem->>'id') = '{{ $json.session_id }}' 
        THEN elem || jsonb_build_object('content', '{{ ($json.new_content || "").split("'").join("''") }}')
        ELSE elem 
      END
    )
    FROM jsonb_array_elements(sessions) AS elem
  ),
  updated_at = NOW()
WHERE id = '{{ $json.active_preset_id }}';
```

---

## 🛠️ FERRAMENTA 2: `Ajustar_Parametros_Globais`
**Descrição:** Use para mudar o modelo de IA ou a temperatura da produção.

### 1. Exemplo JSON
```json
{
  "active_preset_id": "f999d27b-5677-4618-a809-269ccff06a9d",
  "model": "gpt-5.4",
  "temperature": 0.7
}
```

### 2. Código SQL (Postgres)
```sql
UPDATE content_presets
SET 
  config = config || jsonb_build_object(
    'model', COALESCE(NULLIF('{{ $json.model }}', ''), config->>'model'),
    'temperature', COALESCE(NULLIF('{{ $json.temperature }}', '')::FLOAT, (config->>'temperature')::FLOAT)
  ),
  updated_at = NOW()
WHERE id = '{{ $json.active_preset_id }}';
```

---

## 🛠️ FERRAMENTA 3: `Salvar_Novo_Preset`
**Descrição:** Use para clonar a configuração atual como um novo template reutilizável.

### 1. Exemplo JSON
```json
{
  "active_preset_id": "f999d27b-5677-4618-a809-269ccff06a9d",
  "name": "Estratégia Cyberpunk",
  "description": "Vídeos neon para Gen Z."
}
```

### 2. Código SQL (Postgres)
```sql
INSERT INTO content_presets (name, track, description, sessions, config, created_at, updated_at)
SELECT '{{ ($json.name || "").split("'").join("''") }}', track, '{{ ($json.description || "").split("'").join("''") }}', sessions, config, NOW(), NOW()
FROM content_presets 
WHERE id = '{{ $json.active_preset_id }}'
RETURNING id;
```

---

## 🛠️ FERRAMENTA 4: `Gerenciar_Sessoes_Customizadas` (A MÁGICA)
**Descrição:** Use para ADICIONAR novos cards ou REMOVER cards do Cockpit. Se o usuário quiser uma instrução nova que não existe (ex: Público-Alvo), use esta ferramenta primeiro com action "add".

### 1. Exemplo JSON (Adicionar)
```json
{
  "active_preset_id": "f999d27b-5677-4618-a809-269ccff06a9d",
  "action": "add",
  "session_id": "publico_alvo",
  "title": "Público-Alvo"
}
```

### 2. Código SQL (Postgres)

**Importante:** No n8n, você pode usar um nó "IF" ou "Switch" para separar as rotas de ADD e REMOVE baseadas no campo `action`.

**SQL para ADICIONAR (action == "add"):**
```sql
UPDATE content_presets
SET 
  sessions = sessions || jsonb_build_object(
    'id', '{{ $json.session_id }}',
    'title', '{{ $json.title }}',
    'content', '',
    'isEditable', true,
    'isEssential', false
  ),
  updated_at = NOW()
WHERE id = '{{ $json.active_preset_id }}'
AND NOT (sessions @> jsonb_build_array(jsonb_build_object('id', '{{ $json.session_id }}')));
```

**SQL para REMOVER (action == "remove"):**
```sql
UPDATE content_presets
SET 
  sessions = (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(sessions) AS elem
    WHERE elem->>'id' != '{{ $json.session_id }}'
  ),
  updated_at = NOW()
WHERE id = '{{ $json.active_preset_id }}';
```
