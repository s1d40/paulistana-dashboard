-- ==========================================
-- SCRIPT DE ARQUITETURA: PRODUTOS E ASSINATURAS
-- ==========================================

-- 1. Tabela de Planos de Assinatura (Pacotes)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    billing_interval VARCHAR(20) DEFAULT 'month', -- 'month', 'year', 'one_time'
    credits_included NUMERIC(15,4) DEFAULT 0.0000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Features dos Planos (Modularização)
-- Exemplo de feature_key: 'video_generation', 'max_social_accounts', 'priority_support'
CREATE TABLE IF NOT EXISTS public.plan_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    feature_value VARCHAR(255), -- Pode ser boolean (true/false) ou limite numérico (ex: '5')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_id, feature_key)
);

-- 3. Tabela de Assinaturas dos Clientes
CREATE TABLE IF NOT EXISTS public.client_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'unpaid', 'trialing'
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    -- Campos genéricos para integração com múltiplos Gateways de Pagamento
    payment_provider VARCHAR(50), -- 'stripe', 'mercadopago', 'pagarme', etc.
    provider_customer_id VARCHAR(255),
    provider_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ESTRATÉGIA DE SEGURANÇA (RLS)
-- ==========================================

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies para Subscription Plans (Somente Leitura para Usuários, Modificação via Admin)
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT USING ( is_active = true );

-- Policies para Plan Features
DROP POLICY IF EXISTS "Anyone can view features of active plans" ON public.plan_features;
CREATE POLICY "Anyone can view features of active plans" ON public.plan_features FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.subscription_plans p WHERE p.id = plan_id AND p.is_active = true)
);

-- Policies para Client Subscriptions (Usuários podem ver a assinatura dos clientes aos quais pertencem)
DROP POLICY IF EXISTS "Users can view their client subscriptions" ON public.client_subscriptions;
CREATE POLICY "Users can view their client subscriptions" ON public.client_subscriptions FOR SELECT USING ( public.user_belongs_to_client(client_id) );

-- ==========================================
-- ATUALIZAÇÃO DO SISTEMA DE CRÉDITOS (VALIDADE 90 DIAS)
-- ==========================================
-- A arquitetura de saldo simples ("balance" único) não suporta expiração.
-- Precisamos usar uma abordagem de "Lotes de Créditos" (Credit Batches).

CREATE TABLE IF NOT EXISTS public.credit_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    amount NUMERIC(15,4) NOT NULL, -- Quantidade de créditos comprada/adquirida
    balance NUMERIC(15,4) NOT NULL, -- Quantidade de créditos RESTANTE neste lote
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Data de vencimento (ex: 90 dias após a compra)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.credit_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their client credit batches" ON public.credit_batches;
CREATE POLICY "Users can view their client credit batches" ON public.credit_batches FOR SELECT USING ( public.user_belongs_to_client(client_id) );


-- View para consolidar o Saldo Total ATIVO do Cliente (somando apenas os lotes não expirados e com saldo)
CREATE OR REPLACE VIEW public.vw_active_client_balances AS
SELECT
    client_id,
    SUM(balance) AS total_active_balance
FROM public.credit_batches
WHERE balance > 0
  AND expires_at > NOW()
GROUP BY client_id;


-- Função para consumo de créditos (FIFO: Primeiro a expirar é o primeiro a ser gasto)
CREATE OR REPLACE FUNCTION public.consume_credits(p_client_id UUID, p_amount NUMERIC(15,4))
RETURNS BOOLEAN AS $$
DECLARE
    v_total_available NUMERIC(15,4);
    v_remaining_to_deduct NUMERIC(15,4) := p_amount;
    batch_record RECORD;
BEGIN
    -- Verificar se o cliente tem saldo total suficiente
    SELECT COALESCE(SUM(balance), 0) INTO v_total_available
    FROM public.credit_batches
    WHERE client_id = p_client_id AND balance > 0 AND expires_at > NOW();

    IF v_total_available < p_amount THEN
        RETURN FALSE; -- Saldo insuficiente
    END IF;

    -- Consumir dos lotes na ordem de expiração (os que vencem primeiro, gastam primeiro)
    FOR batch_record IN
        SELECT id, balance
        FROM public.credit_batches
        WHERE client_id = p_client_id AND balance > 0 AND expires_at > NOW()
        ORDER BY expires_at ASC
        FOR UPDATE -- Bloqueia a linha para evitar concorrência (Race conditions)
    LOOP
        IF v_remaining_to_deduct <= 0 THEN
            EXIT; -- Já deduziu tudo que precisava
        END IF;

        IF batch_record.balance >= v_remaining_to_deduct THEN
            -- Se o lote atual cobre o que falta, deduz tudo dele e termina
            UPDATE public.credit_batches
            SET balance = balance - v_remaining_to_deduct
            WHERE id = batch_record.id;

            v_remaining_to_deduct := 0;
        ELSE
            -- Se o lote atual NÃO cobre tudo, zera esse lote e subtrai do total a deduzir
            UPDATE public.credit_batches
            SET balance = 0
            WHERE id = batch_record.id;

            v_remaining_to_deduct := v_remaining_to_deduct - batch_record.balance;
        END IF;
    END LOOP;

    -- Inserir transação no Ledger para histórico
    INSERT INTO public.credit_ledger (client_id, user_id, amount, transaction_type, description)
    VALUES (p_client_id, auth.uid(), -p_amount, 'consumption', 'Consumo de créditos (FIFO)');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
