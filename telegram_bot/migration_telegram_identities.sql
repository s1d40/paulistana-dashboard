-- ==========================================
-- SCRIPT DE MIGRAÇÃO: IDENTIDADES DO TELEGRAM
-- ==========================================

-- Tabela para associar IDs do Telegram (chat_id / user_id do telegram) com os usuários da plataforma
CREATE TABLE IF NOT EXISTS public.telegram_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_chat_id BIGINT UNIQUE NOT NULL,
    telegram_username VARCHAR(255),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS (Row Level Security)
ALTER TABLE public.telegram_identities ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Apenas o próprio usuário pode ver sua identidade
CREATE POLICY "Users can view their own telegram identity"
ON public.telegram_identities FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem gerenciar sua própria conexão
CREATE POLICY "Users can manage their telegram identity"
ON public.telegram_identities FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Opcional: Acesso de serviço para o n8n via service_role key
-- O n8n precisa poder ler e escrever usando a chave service_role,
-- que naturalmente bypassa o RLS se autenticado corretamente.

-- Index para busca rápida por chat_id no n8n
CREATE INDEX IF NOT EXISTS idx_telegram_chat_id ON public.telegram_identities(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_user_id ON public.telegram_identities(user_id);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_telegram_identities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_telegram_identities_updated_at ON public.telegram_identities;

CREATE TRIGGER trigger_update_telegram_identities_updated_at
BEFORE UPDATE ON public.telegram_identities
FOR EACH ROW
EXECUTE FUNCTION update_telegram_identities_updated_at();
