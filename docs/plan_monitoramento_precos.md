# Planejamento: Rastreador de Preços de Concorrentes

Este documento detalha a arquitetura e os passos necessários para implementar a ferramenta de acompanhamento de preços de concorrentes, conforme a necessidade de monitorar mais de 300 produtos sem esforço manual.

## 1. Visão Geral
A solução consistirá em um sistema onde o usuário cadastra seus produtos e os links (ou IDs) dos anúncios concorrentes. O backend (n8n) fará a verificação diária dos preços de forma autônoma. O frontend (Next.js) exibirá uma tabela consolidada destacando as variações (aumentos e quedas de preços).

---

## 2. Modelagem de Dados (Supabase)
Precisaremos estruturar o banco de dados para suportar o histórico de preços e os grupos de anúncios. Sugestão de novas tabelas:

*   **`tracked_products`**: Os produtos do lojista (o "Grupo" de anúncios).
    *   `id` (UUID), `name` (Nome do produto), `created_at`.
*   **`competitor_ads`**: Os anúncios dos concorrentes que estão sendo monitorados.
    *   `id` (UUID), `product_id` (FK para `tracked_products`), `title` (Título do anúncio), `url` (Link do anúncio) ou `ml_id` (ID do Mercado Livre), `seller_name` (Nome do vendedor concorrente).
*   **`price_history`**: O registro diário de preços.
    *   `id` (UUID), `ad_id` (FK para `competitor_ads`), `price` (Preço capturado), `captured_at` (Data e hora da coleta).

---

## 3. Automação e Backend (n8n Workflows)
O "motor" da coleta de preços viverá no n8n para facilitar a manutenção da automação.

*   **Workflow: Web Scraper / API Diário**
    *   **Gatilho (Trigger):** Schedule Trigger (Cron) para rodar todos os dias de madrugada (ex: 02:00 AM).
    *   **Passo 1 (Fetch DB):** Buscar todos os registros ativos da tabela `competitor_ads`.
    *   **Passo 2 (Coleta de Dados):** Para cada anúncio, fazer uma requisição (HTTP Node ou integração com API do ML) para pegar o preço atual.
    *   **Passo 3 (Persistência):** Salvar o preço encontrado na tabela `price_history`.
*   **Aviso de Falhas:** Notificação (Slack/Email/WhatsApp) caso o web scraping falhe devido a mudanças estruturais na página do Mercado Livre.

---

## 4. Frontend (Next.js Dashboard)
O foco deve ser a praticidade de ler a variação diária.

*   **Nova Rota:** `/dashboard/pricing` ou `/dashboard/competitors`.
*   **UI/UX (Tabela Principal):**
    *   **Filtro/Busca:** Selecionar o seu próprio produto (ex: "Mix de Vegetais").
    *   **Tabela de Concorrentes (Resultados):**
        *   **Colunas:** Vendedor, Título, Preço Anterior (D-1), Preço Atual (D-0), **Variação**.
        *   **Variação (UI):** O grande destaque será um "Badge" mostrando a porcentagem e valor absoluto. Exemplo: `<span class="text-red-500">▼ -5% (-R$ 4,00)</span>` ou `<span class="text-green-500">▲ +2% (+R$ 1,50)</span>`.
*   **Componentes Necessários:**
    *   `CompetitorTable`: A tabela descrita acima.
    *   `PriceVariationBadge`: O componente visual inteligente que calcula a cor e a seta baseado na matemática de preço.
    *   `AddCompetitorModal`: Formulário simples para cadastrar novos links de concorrentes no grupo.

---

## 5. Ordem de Execução Sugerida (Plano de Ação)

1.  **Fase 1: Banco de Dados**
    *   Criar as tabelas `tracked_products`, `competitor_ads` e `price_history` no Supabase.
2.  **Fase 2: Mock de Frontend**
    *   Desenvolver a tela `/dashboard/pricing` no Next.js usando dados estáticos, validando a estética (cores vibrantes, design premium como instruído no *web application development*).
3.  **Fase 3: Automação (n8n)**
    *   Criar o workflow de coleta e fazer o parser do Mercado Livre. Inserir dados reais de teste no banco.
4.  **Fase 4: Integração**
    *   Conectar o Next.js às rotas de API/Supabase para carregar o histórico de preços real e calcular a variação D-1 vs D-0 dinamicamente.
