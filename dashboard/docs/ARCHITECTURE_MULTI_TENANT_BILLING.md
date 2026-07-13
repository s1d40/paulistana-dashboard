# Arquitetura Multi-Tenant e Sistema de Créditos

Este documento descreve a arquitetura de banco de dados, segurança, migração e implementação para suportar o modelo Multi-Tenant e o Sistema de Cobrança por Créditos/Tokens no Supabase.

## 1. Modelo de Banco de Dados Relacional (Multi-Tenant & Billing)

A arquitetura baseia-se em separar os dados por "Clientes" (Tenants/Workspaces). Um usuário pode pertencer a um ou mais clientes. O consumo de recursos (tokens, ações) é debitado do saldo da conta do Cliente.

### Novas Tabelas Core

```sql
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
-- Utilizaremos a integração com auth.users do Supabase, mas criamos uma tabela
-- pública para armazenar metadados do usuário pertinentes à aplicação.
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
    balance NUMERIC(15,4) DEFAULT 0.0000, -- Permite frações para precisão de tokens se necessário
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Histórico de Transações de Crédito (Ledger)
CREATE TABLE IF NOT EXISTS public.credit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Usuário que realizou a ação
    amount NUMERIC(15,4) NOT NULL, -- Positivo (recarga) ou Negativo (consumo)
    transaction_type VARCHAR(100) NOT NULL, -- ex: 'llm_generation', 'video_render', 'recharge'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```


### Alterações nas Tabelas Existentes

Todas as tabelas de dados do sistema precisam receber a chave estrangeira `client_id` para garantir o isolamento.

```sql
-- Exemplos de alteração para as tabelas principais
ALTER TABLE public.mural_ideias ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
ALTER TABLE public.videos_cenas ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
ALTER TABLE public.content_presets ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
ALTER TABLE public.chat_memory ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;
ALTER TABLE public.production_errors ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Criar índices para otimizar queries por tenant
CREATE INDEX idx_mural_ideias_client ON public.mural_ideias(client_id);
CREATE INDEX idx_videos_cenas_client ON public.videos_cenas(client_id);
CREATE INDEX idx_content_presets_client ON public.content_presets(client_id);
CREATE INDEX idx_chat_memory_client ON public.chat_memory(client_id);
```


## 2. Estratégia de Autenticação e Segurança (Supabase Auth & RLS)

### Autenticação (SSO com Google e Facebook)
A plataforma utilizará o **Supabase Auth** para gerenciar a identidade primária dos usuários.

- **Login Social (Google / Facebook):** Permitirá criação de conta e login unificados.
- **Tokens Sociais (Facebook/Instagram Business):** Estes tokens operacionais (para postagem e engajamento nas páginas/contas de clientes) continuarão no fluxo OAuth Business separado do login, garantindo que o token de identidade do usuário não seja misturado com as permissões organizacionais. Apenas o "Admin" ou "Owner" do workspace fará essa vinculação.

### Políticas de Segurança RLS (Row Level Security)

Para garantir que um usuário logado jamais visualize ou altere dados de outro cliente, ativaremos RLS em todas as tabelas e usaremos uma função que valida se o usuário possui acesso ao `client_id` via tabela `user_clients`.

```sql
-- Habilitar RLS nas tabelas Core
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_clients ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS nas tabelas do sistema
ALTER TABLE public.mural_ideias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos_cenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_memory ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para validar se o usuário pertence ao cliente
CREATE OR REPLACE FUNCTION public.user_belongs_to_client(check_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_clients
    WHERE user_id = auth.uid() AND client_id = check_client_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exemplo de Policy para o Mural de Ideias
CREATE POLICY "Users can view their client mural ideas"
ON public.mural_ideias FOR SELECT
USING ( public.user_belongs_to_client(client_id) );

CREATE POLICY "Users can insert their client mural ideas"
ON public.mural_ideias FOR INSERT
WITH CHECK ( public.user_belongs_to_client(client_id) );

CREATE POLICY "Users can update their client mural ideas"
ON public.mural_ideias FOR UPDATE
USING ( public.user_belongs_to_client(client_id) );

CREATE POLICY "Users can delete their client mural ideas"
ON public.mural_ideias FOR DELETE
USING ( public.user_belongs_to_client(client_id) );

-- Esta mesma estrutura de policies (SELECT, INSERT, UPDATE, DELETE) deve ser aplicada a TODAS as tabelas que contêm client_id.
```

## 3. Planejamento de Migração (Data Migration Script)

Para que o sistema não perca os dados que já existem (Mural, Histórico, Presets, etc), precisamos de um script de transição que:
1. Crie um Cliente "Padrão" (Default Tenant).
2. Associe todos os registros existentes e "órfãos" (onde o `client_id` for NULL) a este cliente padrão.
3. Isso garante que a plataforma continue funcionando perfeitamente sem perda do histórico, passando a exigir o Client ID para todos os novos dados.

```sql
-- Script de Migração para proteger os dados atuais
DO $$
DECLARE
    default_client_id UUID;
BEGIN
    -- 1. Inserir o Cliente Padrão e pegar o ID
    INSERT INTO public.clients (name, status)
    VALUES ('Default Tenant (Legacy)', 'active')
    RETURNING id INTO default_client_id;

    -- 2. Atualizar tabelas para apontar os dados sem dono para o Default Tenant
    UPDATE public.mural_ideias SET client_id = default_client_id WHERE client_id IS NULL;
    UPDATE public.videos_cenas SET client_id = default_client_id WHERE client_id IS NULL;
    UPDATE public.content_presets SET client_id = default_client_id WHERE client_id IS NULL;
    UPDATE public.chat_memory SET client_id = default_client_id WHERE client_id IS NULL;
    UPDATE public.production_errors SET client_id = default_client_id WHERE client_id IS NULL;

    -- 3. Inserir saldo zerado de créditos para o Default Tenant
    INSERT INTO public.client_balances (client_id, balance) VALUES (default_client_id, 0.0000);

    RAISE NOTICE 'Migração concluída. Cliente Padrão gerado com ID: %', default_client_id;
END $$;
```

## 4. Próximos Passos de Integração (Frontend & Backend)

### Backend / Edge Functions
Sempre que uma chamada de API for realizada (ex: `/api/instagram/comments`), o backend precisará validar a identidade do usuário (`auth.uid()`) e extrair o `client_id` atual do contexto (ex: Headers `x-client-id`).

O crédito deve ser descontado em transações críticas, como a geração de conteúdo (LLMs):
1. Checar em `client_balances` se há saldo suficiente.
2. Iniciar a requisição.
3. Obter os tokens de uso (`usage.total_tokens`).
4. Inserir uma linha em `credit_ledger` (ex: `amount = -usage * price`).
5. Realizar o UPDATE no `client_balances`. (Idealmente rodar isso via SQL Triggers no Ledger ou Functions para garantir que a transação não deixe saldos negativos sem querer).

### Frontend (Next.js)
1. **Contexto de Sessão (Auth):** O usuário faz o login normal usando as funções do Supabase Auth (e-mail, Google ou Facebook).
2. **Seleção de Workspace (Tenant):** Após o login, se o usuário possui mais de um `client_id` na tabela `user_clients`, apresentar uma tela de seleção de "Workspace".
3. **Mudar de Workspace:** Armazenar o Workspace/Client atual no Estado Global (Zustand ou Context) e enviá-lo nas chamadas do Next.js via Fetch API Headers.
4. **Login Social da Meta (Instagram/FB Business):** Deve permanecer exatamente como é, com um botão na página de configurações "Conectar Página", usando o fluxo OAuth do aplicativo Meta para associar os access tokens na conta da plataforma, independentemente de quem logou.

## Conclusão
Este planejamento garante que a plataforma seja 100% segura (Zero Data Leakage entre clientes graças ao RLS do PostgreSQL), pronta para monetização, mantendo os dados antigos intactos e pronta para receber SSO seguro.
