-- =========================================
-- SCRIPT DE SANITIZAÇÃO DE PRESETS (DRAFTS)
-- =========================================
-- Este script limpa a tabela de presets removendo
-- aqueles que foram criados automaticamente pelo 
-- chat do arquiteto como drafts temporários.

DELETE FROM public.content_presets
WHERE 
    -- Regra 1: O nome contém a marcação explícita de Draft
    name LIKE 'Draft: %'
    
    -- Regra 2: A flag booleana is_draft dentro do JSONB config é true
    OR (config->>'is_draft')::boolean = true;
    
-- Verifica quantos sobraram:
-- SELECT id, name FROM public.content_presets;
