-- ==========================================
-- SCRIPT DE CONFIGURAÇÃO: MURAL DE IDEIAS
-- ==========================================

-- 1. Habilitar extensão de UUID (caso não esteja)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar ou Atualizar a Tabela
CREATE TABLE IF NOT EXISTS public.mural_ideias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'ideia', -- 'ideia', 'fazendo', 'concluido'
  autor_email TEXT,
  autor_nome TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar Realtime (Sync Instantâneo)
-- Primeiro tentamos remover se já existir para evitar erro de duplicata
BEGIN;
  DO $$ 
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      -- Se a publicação existe, tentamos adicionar a tabela
      -- O comando ALTER PUBLICATION não suporta IF NOT EXISTS nativamente de forma simples em versões antigas
      -- então usamos um bloco dinâmico ou apenas garantimos a execução.
      ALTER PUBLICATION supabase_realtime ADD TABLE public.mural_ideias;
    ELSE
      -- Se não existe, criamos a publicação com a tabela
      CREATE PUBLICATION supabase_realtime FOR TABLE public.mural_ideias;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Silencia erro se a tabela já estiver na publicação
    RAISE NOTICE 'Tabela mural_ideias já está na publicação Realtime ou erro ignorado.';
  END $$;
COMMIT;

-- 4. Configurar Segurança (RLS)
ALTER TABLE public.mural_ideias ENABLE ROW LEVEL SECURITY;

-- 5. Criar Políticas de Acesso
-- Removemos políticas antigas para garantir que as novas funcionem
DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON public.mural_ideias;
DROP POLICY IF EXISTS "Permitir tudo para todos" ON public.mural_ideias;

-- Criamos uma política permissiva para a fase de desenvolvimento/teste via IP
CREATE POLICY "Permitir tudo para todos" ON public.mural_ideias
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Garantir permissões de uso para as roles anon e authenticated
GRANT ALL ON public.mural_ideias TO anon;
GRANT ALL ON public.mural_ideias TO authenticated;
GRANT ALL ON public.mural_ideias TO service_role;

-- MENSAGEM: Script executado com sucesso!
