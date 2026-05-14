-- ==========================================
-- SCRIPT FINAL CONSOLIDADO: MURAL DE IDEIAS
-- (Copie e cole tudo no SQL Editor do Supabase)
-- ==========================================

-- 1. Habilitar extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar ou Atualizar a Tabela com todas as colunas (Nome e Cor)
CREATE TABLE IF NOT EXISTS public.mural_ideias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'ideia', -- 'ideia', 'fazendo', 'concluido'
  autor_email TEXT,
  autor_nome TEXT,
  cor TEXT DEFAULT 'zinc',
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Garantir que as colunas novas existam (caso a tabela já tenha sido criada antes)
ALTER TABLE public.mural_ideias ADD COLUMN IF NOT EXISTS autor_nome TEXT;
ALTER TABLE public.mural_ideias ADD COLUMN IF NOT EXISTS cor TEXT DEFAULT 'zinc';

-- 4. Habilitar Realtime (Sync Instantâneo)
BEGIN;
  DO $$ 
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.mural_ideias;
    ELSE
      CREATE PUBLICATION supabase_realtime FOR TABLE public.mural_ideias;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Aviso: Tabela mural_ideias já está no Realtime.';
  END $$;
COMMIT;

-- 5. Configurar Segurança (RLS) - Liberado para Localhost/Ambiente de Teste
ALTER TABLE public.mural_ideias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir tudo para todos" ON public.mural_ideias;

CREATE POLICY "Permitir tudo para todos" ON public.mural_ideias
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Garantir permissões de acesso
GRANT ALL ON public.mural_ideias TO anon;
GRANT ALL ON public.mural_ideias TO authenticated;
GRANT ALL ON public.mural_ideias TO service_role;

-- MENSAGEM FINAL: Configuração concluída com sucesso!
