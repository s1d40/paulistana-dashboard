# Arquitetura de Segurança Multi-Cliente & Nubimetrics Próprio

> Documento técnico estratégico baseado na reunião de 25/06/2026.
> Elaborado em 26/06/2026.

---

## 🎯 Contexto

O sistema atual funciona assim:
- **n8n** → guarda credenciais e orquestra tudo (correto!)
- **Python + ffmpeg** → monta os vídeos (correto!)
- **Problema** → hoje a plataforma opera com **1 cliente (o André)**. Como fazer isso funcionar com 50 ou 500 clientes sem que as credenciais de um contaminem as do outro?

Essa é a mesma pergunta que empresas como Pipedrive, Shopify e Nubimetrics precisaram responder antes de escalar.

---

## Parte 1: Vault de Credenciais Multi-Cliente

### ❌ O que NÃO fazer (o erro comum de crescimento rápido)

A solução ingênua seria criar um arquivo `.env` gigantesco com as chaves de todos os clientes:

```
CLIENT_001_ML_ACCESS_TOKEN=...
CLIENT_001_ML_REFRESH_TOKEN=...
CLIENT_002_ML_ACCESS_TOKEN=...
```

Isso é um **desastre esperando para acontecer**: um único vazamento compromete todos os clientes, é impossível de gerenciar, e viola as políticas do próprio Mercado Livre.

---

### ✅ O que fazer: Credenciais Criptografadas no Banco de Dados

#### Passo 1: Tabela `client_credentials` no Supabase

```sql
CREATE TABLE public.client_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,            -- 'mercadolivre' | 'shopee' | 'tiktok'
    access_token_encrypted TEXT,       -- Token criptografado com AES-256
    refresh_token_encrypted TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    seller_id TEXT,                    -- ID público do vendedor (não secreto)
    scope TEXT,                        -- Ex: 'read,write' ou 'read_only'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS: cliente só vê suas próprias credenciais
ALTER TABLE public.client_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_sees_own_credentials" ON public.client_credentials
    FOR ALL USING (client_id = auth.uid());
```

#### Passo 2: Criptografar Tokens (AES-256) Antes de Salvar

Os tokens NUNCA são salvos em texto puro. Usamos uma chave mestra (`MASTER_ENCRYPTION_KEY`) que fica apenas no servidor (variável de ambiente segura), nunca no banco:

```python
# scripts/security/credentials.py
from cryptography.fernet import Fernet
import os

MASTER_KEY = os.getenv("MASTER_ENCRYPTION_KEY")  # Nunca vai pro banco
fernet = Fernet(MASTER_KEY)

def encrypt_token(plain_token: str) -> str:
    """Criptografa o token antes de salvar no Supabase."""
    return fernet.encrypt(plain_token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    """Descriptografa apenas na hora de usar. Nunca fica em texto puro."""
    return fernet.decrypt(encrypted_token.encode()).decode()
```

#### Passo 3: Refresh Automático de Tokens

Um Worker Python roda a cada hora e verifica tokens próximos de expirar:

```python
# scripts/security/token_refresher.py
def refresh_expiring_tokens():
    """Pega todos os tokens que expiram nas próximas 2 horas e renova."""
    expiring = supabase.table('client_credentials')
        .select('*')
        .lt('expires_at', now() + 2h)
        .execute()
    
    for cred in expiring.data:
        refresh_token = decrypt_token(cred['refresh_token_encrypted'])
        new_tokens = call_ml_refresh_api(refresh_token)
        
        supabase.table('client_credentials').update({
            'access_token_encrypted': encrypt_token(new_tokens['access_token']),
            'expires_at': new_tokens['expires_at']
        }).eq('id', cred['id']).execute()
```

---

### Como o n8n e o Script Python consomem isso?

O n8n **deixa de guardar as credenciais diretamente**. Ao invés disso, ele faz uma chamada para uma API interna segura (`/api/internal/get-token?client_id=XYZ`) que:
1. Verifica se quem está pedindo tem permissão para aquele client_id.
2. Descriptografa o token na memória do servidor.
3. Devolve o token em texto puro **apenas para aquela requisição**, sem persistir.

```
n8n Workflow
    → POST /api/internal/get-token {client_id, platform}
    ← { access_token: "APP_USR_xxx..." }   [expira em 30 min por segurança]
    → Chama ML API com esse token
    → Roda o script Python passando o token como argumento
```

> [!IMPORTANT]
> **Regra de Ouro:** O token descriptografado **nunca** é gravado em arquivo, banco ou log. Ele existe apenas na memória RAM do processo por alguns segundos. Isso é chamado de "zero persistence".

---

## Parte 2: Nubimetrics Próprio (Analytics com Dados dos Clientes)

Essa é a parte mais poderosa estrategicamente. Cada cliente que você onboarda traz consigo dados que enriquecem o seu sistema para **todos os outros clientes**.

### A Lógica de Negócio

- **Cliente A** vende linhaça. Ele te dá acesso de leitura ao ML dele.
- Você coleta: histórico de preço, ranking, visitas, taxa de conversão — dados que a API pública **não fornece para quem de fora**, mas fornece para o vendedor autenticado.
- Esse dado vai para o seu banco (anonimizado).
- **Cliente B**, que também vende sementes, passa a ver benchmarks muito mais ricos no seu painel — porque o sistema tem dados "de dentro" que o Nubimetrics público não tem acesso.

### Arquitetura de Coleta Federada

```
                       ┌─────────────────────────┐
                       │  Supabase (Banco Central)│
                       │  tabela: market_insights │
                       └────────────┬────────────┘
                                    │ agrega anonimizado
              ┌─────────────────────┼───────────────────────┐
              │                     │                       │
    ┌─────────▼──────┐   ┌──────────▼─────┐   ┌────────────▼────┐
    │  Worker Client A│  │  Worker Client B│  │ Worker Client C │
    │  (linhaça)      │  │  (castanha)     │  │ (chás)          │
    │  token: ****    │  │  token: ****    │  │ token: ****     │
    └────────────────┘   └────────────────┘  └─────────────────┘
         │                    │                      │
         ▼                    ▼                      ▼
    API ML (auth)        API ML (auth)          API ML (auth)
    Dados privados       Dados privados         Dados privados
    do vendedor A        do vendedor B          do vendedor C
```

### Tabela `market_insights` (Dado Agregado Anonimizado)

```sql
CREATE TABLE public.market_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id TEXT NOT NULL,
    snapshot_date DATE NOT NULL,
    
    -- Dados que só um vendedor autenticado tem acesso
    avg_visits_30d NUMERIC,       -- Média de visitas de anúncios nessa categoria
    avg_conversion_rate NUMERIC,  -- Taxa de conversão média
    avg_price NUMERIC,            -- Preço médio
    top_keywords JSONB,           -- Palavras-chave mais buscadas (de dentro)
    
    -- Agregado de N clientes (ex: coletado de 5 vendors diferentes)
    source_count INT DEFAULT 1,   -- Quantos clientes geraram esse dado
    
    UNIQUE(category_id, snapshot_date)
);
```

> [!TIP]
> **Vantagem competitiva real:** O Nubimetrics público coleta dados do lado de fora da API (scraping e dados públicos). O seu sistema coleta dados **de dentro** (autenticado como vendedor). Isso inclui visitas, taxa de conversão, custo por clique — métricas que o Nubimetrics cobra R$500+/mês para mostrar e que você teria de graça como subproduto de ter clientes ativos.

---

## Parte 3: Onboarding OAuth Seguro do Cliente

Para conseguir as chaves de API do cliente de forma **profissional e segura** (sem pedir manualmente), você implementa o **OAuth 2.0 do Mercado Livre** na sua plataforma:

```
1. Cliente clica em "Conectar Mercado Livre" no seu painel.
2. Ele é redirecionado para a página de login do ML.
3. O ML autentica e manda o token para o seu backend (/api/oauth/ml/callback).
4. O backend criptografa e salva na tabela client_credentials.
5. O cliente nunca vê o token — você nunca vê a senha do cliente.
```

Isso é o mesmo fluxo do Nubimetrics, Tiny ERP, Bling. É o padrão de mercado e elimina o risco de credential sharing.

---

## Roadmap de Implementação

| Fase | O que fazer | Quando |
|------|------------|--------|
| **1** | Criar tabela `client_credentials` + sistema de criptografia | Semana 1 |
| **2** | Migrar credenciais do André para o novo sistema | Semana 1 |
| **3** | Criar API interna `/api/internal/get-token` | Semana 1 |
| **4** | Ajustar n8n para chamar a API interna ao invés de usar env vars | Semana 2 |
| **5** | Criar tabela `market_insights` e worker de coleta agregada | Semana 3 |
| **6** | Implementar OAuth flow para onboarding de novos clientes | Semana 4 |
| **7** | Painel de "Benchmark de Mercado" no dashboard usando os dados agregados | Semana 5+ |

---

> [!NOTE]
> O script Python de geração de vídeos com ffmpeg continua sendo chamado pelo n8n — isso é correto e eficiente. O que muda é que o n8n não guarda mais os tokens diretamente. Ele pede o token descriptografado para a nossa API interna no início de cada execução.
