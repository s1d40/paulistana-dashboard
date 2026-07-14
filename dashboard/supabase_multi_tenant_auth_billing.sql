-- ==========================================
-- SCRIPT DE ARQUITETURA MULTI-TENANT E BILLING
-- ==========================================

-- Extensão para geração de UUIDs, caso não exista
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Clientes (Tenants)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Usuários Estendida
-- Associada à tabela auth.users do Supabase
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Associação Usuário <-> Cliente (Relação N:M)
CREATE TABLE IF NOT EXISTS public.user_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- ex: 'owner', 'admin', 'member'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, client_id)
);

-- 4. Tabela de Saldo de Créditos por Cliente
CREATE TABLE IF NOT EXISTS public.client_balances (
    client_id UUID PRIMARY KEY REFERENCES public.clients(id) ON DELETE CASCADE,
    balance NUMERIC(15,4) DEFAULT 0.0000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Histórico de Transações de Crédito (Ledger)
CREATE TABLE IF NOT EXISTS public.credit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    amount NUMERIC(15,4) NOT NULL,
    transaction_type VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ALTERAÇÕES NAS TABELAS EXISTENTES
-- ==========================================

-- Adicionando client_id às tabelas principais (Se não existir)
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.mural_ideias ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.videos_cenas ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.content_presets ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.chat_memory ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.production_errors ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- Criando os índices se não existirem
CREATE INDEX IF NOT EXISTS idx_mural_ideias_client ON public.mural_ideias(client_id);
CREATE INDEX IF NOT EXISTS idx_videos_cenas_client ON public.videos_cenas(client_id);
CREATE INDEX IF NOT EXISTS idx_content_presets_client ON public.content_presets(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_memory_client ON public.chat_memory(client_id);
CREATE INDEX IF NOT EXISTS idx_production_errors_client ON public.production_errors(client_id);


-- ==========================================
-- ESTRATÉGIA DE SEGURANÇA (RLS)
-- ==========================================

-- Habilitar RLS nas tabelas Core
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_clients ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS nas tabelas de negócios
ALTER TABLE public.mural_ideias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos_cenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_memory ENABLE ROW LEVEL SECURITY;

-- Função utilitária para checar permissão (Security Definer ignora RLS interno)
CREATE OR REPLACE FUNCTION public.user_belongs_to_client(check_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_clients
    WHERE user_id = auth.uid() AND client_id = check_client_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Policies para Mural de Ideias
DROP POLICY IF EXISTS "Users can view their client mural ideas" ON public.mural_ideias;
CREATE POLICY "Users can view their client mural ideas" ON public.mural_ideias FOR SELECT USING ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can insert their client mural ideas" ON public.mural_ideias;
CREATE POLICY "Users can insert their client mural ideas" ON public.mural_ideias FOR INSERT WITH CHECK ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can update their client mural ideas" ON public.mural_ideias;
CREATE POLICY "Users can update their client mural ideas" ON public.mural_ideias FOR UPDATE USING ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can delete their client mural ideas" ON public.mural_ideias;
CREATE POLICY "Users can delete their client mural ideas" ON public.mural_ideias FOR DELETE USING ( public.user_belongs_to_client(client_id) );


-- ==========================================
-- SCRIPT DE MIGRAÇÃO (PRESERVAÇÃO DOS DADOS)
-- ==========================================

DO $$
DECLARE
    default_client_id UUID;
BEGIN
    -- Verifica se já existe um Default Tenant, caso não, cria um.
    SELECT id INTO default_client_id FROM public.clients WHERE name = 'Default Tenant (Legacy)' LIMIT 1;

    IF default_client_id IS NULL THEN
        INSERT INTO public.clients (name, status)
        VALUES ('Default Tenant (Legacy)', 'active')
        RETURNING id INTO default_client_id;

        -- Garante que ele possua saldo
        INSERT INTO public.client_balances (client_id, balance) VALUES (default_client_id, 0.0000);
    END IF;

    -- Atualiza as linhas órfãs nas tabelas do banco de dados
    BEGIN UPDATE public.mural_ideias SET client_id = default_client_id WHERE client_id IS NULL; EXCEPTION WHEN others THEN END;
    BEGIN UPDATE public.videos_cenas SET client_id = default_client_id WHERE client_id IS NULL; EXCEPTION WHEN others THEN END;
    BEGIN UPDATE public.content_presets SET client_id = default_client_id WHERE client_id IS NULL; EXCEPTION WHEN others THEN END;
    BEGIN UPDATE public.chat_memory SET client_id = default_client_id WHERE client_id IS NULL; EXCEPTION WHEN others THEN END;
    BEGIN UPDATE public.production_errors SET client_id = default_client_id WHERE client_id IS NULL; EXCEPTION WHEN others THEN END;

END $$;

-- ==========================================
-- ESTRATÉGIA DE SEGURANÇA ADICIONAL (RLS POLICIES)
-- ==========================================

-- Policies para Videos Cenas
DROP POLICY IF EXISTS "Users can view their client videos" ON public.videos_cenas;
CREATE POLICY "Users can view their client videos" ON public.videos_cenas FOR SELECT USING ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can insert their client videos" ON public.videos_cenas;
CREATE POLICY "Users can insert their client videos" ON public.videos_cenas FOR INSERT WITH CHECK ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can update their client videos" ON public.videos_cenas;
CREATE POLICY "Users can update their client videos" ON public.videos_cenas FOR UPDATE USING ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can delete their client videos" ON public.videos_cenas;
CREATE POLICY "Users can delete their client videos" ON public.videos_cenas FOR DELETE USING ( public.user_belongs_to_client(client_id) );


-- Policies para Content Presets
DROP POLICY IF EXISTS "Users can view their client presets" ON public.content_presets;
CREATE POLICY "Users can view their client presets" ON public.content_presets FOR SELECT USING ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can insert their client presets" ON public.content_presets;
CREATE POLICY "Users can insert their client presets" ON public.content_presets FOR INSERT WITH CHECK ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can update their client presets" ON public.content_presets;
CREATE POLICY "Users can update their client presets" ON public.content_presets FOR UPDATE USING ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can delete their client presets" ON public.content_presets;
CREATE POLICY "Users can delete their client presets" ON public.content_presets FOR DELETE USING ( public.user_belongs_to_client(client_id) );


-- Policies para Chat Memory
DROP POLICY IF EXISTS "Users can view their client chat memory" ON public.chat_memory;
CREATE POLICY "Users can view their client chat memory" ON public.chat_memory FOR SELECT USING ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can insert their client chat memory" ON public.chat_memory;
CREATE POLICY "Users can insert their client chat memory" ON public.chat_memory FOR INSERT WITH CHECK ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can update their client chat memory" ON public.chat_memory;
CREATE POLICY "Users can update their client chat memory" ON public.chat_memory FOR UPDATE USING ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can delete their client chat memory" ON public.chat_memory;
CREATE POLICY "Users can delete their client chat memory" ON public.chat_memory FOR DELETE USING ( public.user_belongs_to_client(client_id) );


-- Policies para Production Errors
DROP POLICY IF EXISTS "Users can view their client errors" ON public.production_errors;
CREATE POLICY "Users can view their client errors" ON public.production_errors FOR SELECT USING ( public.user_belongs_to_client(client_id) );

DROP POLICY IF EXISTS "Users can insert their client errors" ON public.production_errors;
CREATE POLICY "Users can insert their client errors" ON public.production_errors FOR INSERT WITH CHECK ( public.user_belongs_to_client(client_id) );


-- Policies para Clients
DROP POLICY IF EXISTS "Users can view their clients" ON public.clients;
CREATE POLICY "Users can view their clients" ON public.clients FOR SELECT USING ( public.user_belongs_to_client(id) );


-- Policies para User_Clients
DROP POLICY IF EXISTS "Users can view their user client relations" ON public.user_clients;
CREATE POLICY "Users can view their user client relations" ON public.user_clients FOR SELECT USING ( user_id = auth.uid() );


-- ==========================================
-- ESTRATÉGIA DE SEGURANÇA PARA TABELAS CRÍTICAS (BILLING & USERS)
-- ==========================================

-- Habilitar RLS nas tabelas Críticas que estavam faltando
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_errors ENABLE ROW LEVEL SECURITY;

-- Policies para Users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING ( id = auth.uid() );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING ( id = auth.uid() );


-- Policies para Client Balances
-- Regra de negócio: Usuários podem apenas LER o saldo de seus clientes. Modificações só via backend (service_role)
DROP POLICY IF EXISTS "Users can view their client balances" ON public.client_balances;
CREATE POLICY "Users can view their client balances" ON public.client_balances FOR SELECT USING ( public.user_belongs_to_client(client_id) );


-- Policies para Credit Ledger
-- Regra de negócio: Usuários podem apenas LER o histórico de seus clientes. Inserções só via backend (service_role)
DROP POLICY IF EXISTS "Users can view their client ledger" ON public.credit_ledger;
CREATE POLICY "Users can view their client ledger" ON public.credit_ledger FOR SELECT USING ( public.user_belongs_to_client(client_id) );


-- ==========================================
-- TRIGGERS PARA AUTH.USERS -> PUBLIC.USERS E MIGRAÇÃO DOS USUÁRIOS
-- ==========================================

-- Função de Trigger para inserir novos usuários na tabela public.users quando criarem conta no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar o Trigger no Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- MIGRAÇÃO DE USUÁRIOS EXISTENTES E ACESSO AO DEFAULT TENANT
-- ==========================================

DO $$
DECLARE
    default_client_id UUID;
BEGIN
    -- Obter o ID do Default Tenant criado na migração anterior
    SELECT id INTO default_client_id FROM public.clients WHERE name = 'Default Tenant (Legacy)' LIMIT 1;

    IF default_client_id IS NOT NULL THEN
        -- 1. Inserir todos os usuários existentes de auth.users para public.users caso ainda não existam
        INSERT INTO public.users (id)
        SELECT id FROM auth.users
        ON CONFLICT (id) DO NOTHING;

        -- 2. Associar TODOS os usuários existentes ao Default Tenant para não perderem acesso aos dados
        INSERT INTO public.user_clients (user_id, client_id, role)
        SELECT id, default_client_id, 'member' FROM public.users
        ON CONFLICT (user_id, client_id) DO NOTHING;

    END IF;
END $$;
