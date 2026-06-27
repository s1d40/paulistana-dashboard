# Guia de Configuração: Workflow do n8n para Rastreador de Preços

Este guia detalha como criar a automação diária no n8n que irá alimentar o nosso dashboard de concorrentes.

## Resumo do Workflow
1. **Schedule Trigger:** Aciona o fluxo todos os dias.
2. **Supabase (Get Ads):** Busca todos os anúncios rastreados.
3. **Loop:** Itera sobre cada anúncio para raspar o preço.
4. **HTTP Request / Puppeteer:** Busca o HTML do anúncio no Mercado Livre e extrai o preço.
5. **Supabase (Insert History):** Salva o preço e a data na tabela `price_history`.

---

## Passo a Passo no n8n

### 1. Gatilho de Agendamento (Schedule Trigger)
*   **Node:** `Schedule Trigger`
*   **Configuração:** Adicione uma regra (`Add Rule`). Selecione `Cron Expression` ou configure para rodar `Every Day` às `02:00 AM`.

### 2. Buscar Anúncios (Supabase)
*   **Node:** `Postgres` ou `Supabase` (depende do que você usa no n8n. O nó Postgres é muito comum para consultas SQL diretas).
*   **Ação:** Execute a query:
    ```sql
    SELECT id, url FROM public.competitor_ads;
    ```
*   **Objetivo:** Obter a lista de URLs que precisamos analisar.

### 3. Loop (Para processar 1 a 1)
*   **Node:** `Loop` (antigo Split In Batches).
*   **Batch Size:** 1 (Para fazer requisições de forma gentil e não ser bloqueado).

### 4. Extração de Preço (HTTP Request + HTML Extract)
*   **Opção A (Apenas HTTP):**
    *   **Node HTTP Request:**
        *   `Method`: GET
        *   `URL`: `={{ $json.url }}`
    *   **Node HTML Extract:**
        *   Use seletores CSS para encontrar o preço. No Mercado Livre, geralmente o preço fica em classes como `.andes-money-amount__fraction`. Extraia também os centavos (`.andes-money-amount__cents`) se necessário, e junte os valores.
*   **Opção B (Se tiver bloqueio por bot):**
    *   Use um serviço como ScraperAPI ou um nó de automação de Browser (Puppeteer/Selenium) para carregar a página e extrair o preço dinamicamente.

### 5. Preparar e Inserir Dados (Supabase)
*   **Node:** `Set` ou `Code`. Formate o preço raspado para um número (ex: substitua vírgula por ponto).
*   **Node:** `Postgres` ou `Supabase` (Insert).
*   **Tabela:** `price_history`.
*   **Dados:**
    *   `ad_id`: `={{ $('Loop').item.json.id }}`
    *   `price`: `={{ $json.extracted_price }}`
    *   `captured_at`: `={{ new Date().toISOString() }}` (ou deixe o banco de dados preencher com o `DEFAULT`).

### 6. Tratamento de Erros (Opcional, mas Recomendado)
*   Adicione um nó `Catch` (Error Trigger) no workflow.
*   Se ocorrer algum erro (ex: Mercado Livre mudou a estrutura do HTML), envie uma notificação via **Telegram**, **Slack** ou **WhatsApp** alertando que o scraper precisa de manutenção.

---

## Dicas Importantes
*   **Rate Limiting:** Não faça 300 requisições em 1 segundo. Adicione um nó de `Wait` (Espera) de 2 a 5 segundos dentro do Loop.
*   **User-Agent:** No nó `HTTP Request`, configure o header `User-Agent` para simular um navegador real e diminuir as chances de ser bloqueado pela página.
