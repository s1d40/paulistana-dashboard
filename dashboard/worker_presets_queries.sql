-- =========================================================================
-- QUERIES PARA O WORKFLOW: [TOOL] Worker_Supabase_Presets
-- VERSÃO: 7.0 (Ajustada para Coluna 'config' JSONB)
-- =========================================================================

-- -------------------------------------------------------------------------
-- BRANCH 1: update_session (Continua igual, já estava certo)
-- -------------------------------------------------------------------------
UPDATE content_presets
SET 
  sessions = (
    SELECT jsonb_agg(
      CASE 
        WHEN (elem->>'id') = '{{ $json.ai_params.session_id }}' 
        THEN elem || jsonb_build_object('content', '{{ ($json.ai_params.new_content || "").split("'").join("''") }}')
        ELSE elem 
      END
    )
    FROM jsonb_array_elements(sessions) AS elem
  ),
  updated_at = NOW()
WHERE id = '{{ $json.system_context.active_preset_id }}';


-- -------------------------------------------------------------------------
-- BRANCH 2: update_settings
-- Objetivo: Atualizar campos DENTRO da coluna JSONB 'config'.
-- -------------------------------------------------------------------------
UPDATE content_presets
SET 
  config = config || jsonb_build_object(
    'model', COALESCE(NULLIF('{{ $json.ai_params.model }}', ''), config->>'model'),
    'temperature', COALESCE(NULLIF('{{ $json.ai_params.temperature }}', '')::FLOAT, (config->>'temperature')::FLOAT),
    'prompt', COALESCE(NULLIF('{{ ($json.ai_params.prompt || "").split("'").join("''") }}', ''), config->>'prompt')
  ),
  updated_at = NOW()
WHERE id = '{{ $json.system_context.active_preset_id }}';


-- -------------------------------------------------------------------------
-- BRANCH 3: save_as_new
-- Objetivo: Criar novo preset clonando a estrutura real (id, name, track, description, sessions, config).
-- -------------------------------------------------------------------------
INSERT INTO content_presets (
  name, 
  track,
  description, 
  sessions, 
  config,
  created_at, 
  updated_at
)
SELECT 
  '{{ ($json.ai_params.name || "").split("'").join("''") }}', 
  '{{ $json.system_context.track }}',
  '{{ ($json.ai_params.description || "").split("'").join("''") }}', 
  '{{ JSON.stringify($json.sessions_snapshot).split("'").join("''") }}'::jsonb, 
  config, -- Clona o objeto config (modelo, temp, etc) do original
  NOW(), 
  NOW()
FROM content_presets 
WHERE id = '{{ $json.system_context.active_preset_id }}'
RETURNING id;
