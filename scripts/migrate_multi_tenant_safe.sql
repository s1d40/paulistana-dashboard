-- ==========================================
-- MIGRAÇÃO MULTI-TENANT + BILLING (SEGURA)
-- Adaptado do Jules - SEM ativar RLS
-- Rodar no Supabase Dashboard → SQL Editor
-- ==========================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- PARTE 1: TABELAS NOVAS (CORE)
-- ==========================================

-- 1. Tabela de Clientes/Tenants (NOVA - separada da tabela "clientes" legada)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Usuários (perfil público, ligada ao auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Relação Usuário ↔ Tenant (N:M)
CREATE TABLE IF NOT EXISTS public.user_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, client_id)
);

-- 4. Saldo de Créditos por Tenant
CREATE TABLE IF NOT EXISTS public.client_balances (
    client_id UUID PRIMARY KEY REFERENCES public.clients(id) ON DELETE CASCADE,
    balance NUMERIC(15,4) DEFAULT 0.0000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Histórico de Transações (Ledger)
CREATE TABLE IF NOT EXISTS public.credit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    amount NUMERIC(15,4) NOT NULL,
    transaction_type VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de erros de produção (Jules referencia mas não existia)
CREATE TABLE IF NOT EXISTS public.production_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID,
    error_type VARCHAR(100),
    error_message TEXT,
    stack_trace TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PARTE 2: TABELAS DE ASSINATURA E CRÉDITOS
-- ==========================================

-- 7. Planos de Assinatura
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    billing_interval VARCHAR(20) DEFAULT 'month',
    credits_included NUMERIC(15,4) DEFAULT 0.0000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Features por Plano
CREATE TABLE IF NOT EXISTS public.plan_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    feature_value VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_id, feature_key)
);

-- 9. Assinaturas dos Clientes
CREATE TABLE IF NOT EXISTS public.client_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    cancel_at_period_end BOOLEAN DEFAULT false,
    payment_provider VARCHAR(50),
    provider_customer_id VARCHAR(255),
    provider_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Lotes de Crédito (validade 90 dias, consumo FIFO)
CREATE TABLE IF NOT EXISTS public.credit_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    amount NUMERIC(15,4) NOT NULL,
    balance NUMERIC(15,4) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- PARTE 3: ADICIONAR client_id NAS TABELAS EXISTENTES
-- (sem quebrar nada - colunas nullable)
-- ==========================================

DO $$
BEGIN
    BEGIN ALTER TABLE public.mural_ideias ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN ALTER TABLE public.videos_cenas ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN ALTER TABLE public.content_presets ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN ALTER TABLE public.chat_memory ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN ALTER TABLE public.production_errors ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- Índices para queries por tenant
CREATE INDEX IF NOT EXISTS idx_mural_ideias_client ON public.mural_ideias(client_id);
CREATE INDEX IF NOT EXISTS idx_videos_cenas_client ON public.videos_cenas(client_id);
CREATE INDEX IF NOT EXISTS idx_content_presets_client ON public.content_presets(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_memory_client ON public.chat_memory(client_id);
CREATE INDEX IF NOT EXISTS idx_production_errors_client ON public.production_errors(client_id);

-- ==========================================
-- PARTE 4: FUNÇÕES SQL
-- ==========================================

-- Função para validar se user pertence ao tenant
CREATE OR REPLACE FUNCTION public.user_belongs_to_client(check_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_clients
    WHERE user_id = auth.uid() AND client_id = check_client_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View de saldo ativo (soma lotes não expirados)
CREATE OR REPLACE VIEW public.vw_active_client_balances AS
SELECT
    client_id,
    SUM(balance) AS total_active_balance
FROM public.credit_batches
WHERE balance > 0
  AND expires_at > NOW()
GROUP BY client_id;

-- Função de consumo de créditos FIFO
CREATE OR REPLACE FUNCTION public.consume_credits(p_client_id UUID, p_amount NUMERIC(15,4))
RETURNS BOOLEAN AS $$
DECLARE
    v_total_available NUMERIC(15,4);
    v_remaining_to_deduct NUMERIC(15,4) := p_amount;
    batch_record RECORD;
BEGIN
    SELECT COALESCE(SUM(balance), 0) INTO v_total_available
    FROM public.credit_batches
    WHERE client_id = p_client_id AND balance > 0 AND expires_at > NOW();

    IF v_total_available < p_amount THEN
        RETURN FALSE;
    END IF;

    FOR batch_record IN
        SELECT id, balance
        FROM public.credit_batches
        WHERE client_id = p_client_id AND balance > 0 AND expires_at > NOW()
        ORDER BY expires_at ASC
        FOR UPDATE
    LOOP
        IF v_remaining_to_deduct <= 0 THEN EXIT; END IF;

        IF batch_record.balance >= v_remaining_to_deduct THEN
            UPDATE public.credit_batches
            SET balance = balance - v_remaining_to_deduct
            WHERE id = batch_record.id;
            v_remaining_to_deduct := 0;
        ELSE
            UPDATE public.credit_batches
            SET balance = 0
            WHERE id = batch_record.id;
            v_remaining_to_deduct := v_remaining_to_deduct - batch_record.balance;
        END IF;
    END LOOP;

    INSERT INTO public.credit_ledger (client_id, amount, transaction_type, description)
    VALUES (p_client_id, -p_amount, 'consumption', 'Consumo de créditos (FIFO)');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- PARTE 5: MIGRAÇÃO DE DADOS LEGADOS
-- ==========================================

DO $$
DECLARE
    default_client_id UUID;
BEGIN
    -- Criar tenant padrão
    INSERT INTO public.clients (name, status)
    VALUES ('Paulistana Empório (Default)', 'active')
    RETURNING id INTO default_client_id;

    -- Associar dados órfãos ao tenant padrão
    UPDATE public.mural_ideias SET client_id = default_client_id WHERE client_id IS NULL;
    UPDATE public.videos_cenas SET client_id = default_client_id WHERE client_id IS NULL;
    UPDATE public.content_presets SET client_id = default_client_id WHERE client_id IS NULL;
    UPDATE public.chat_memory SET client_id = default_client_id WHERE client_id IS NULL;

    -- Saldo inicial zerado
    INSERT INTO public.client_balances (client_id, balance) VALUES (default_client_id, 0.0000);

    RAISE NOTICE 'Migração concluída. Default Tenant: %', default_client_id;
END $$;

-- ==========================================
-- NOTA: RLS NÃO ATIVADO PROPOSITALMENTE
-- Ativar RLS só quando o frontend estiver 
-- adaptado para enviar client_id nas queries.
-- ==========================================
