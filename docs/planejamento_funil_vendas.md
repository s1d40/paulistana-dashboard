# Arquitetura de Conversão e Qualificação de Leads (Mercado Livre)

Pivot do sistema de orquestração de IA: transição de uma estratégia de viralização orgânica (focada em métricas de vaidade) para um **Funil de Vendas Automatizado e Orientado a Dados**. O sistema central continuará sendo orquestrado primariamente via n8n, integrando APIs externas de Inteligência Artificial, Meta Graph API e Mercado Livre.

## Visão Geral do Sistema (Microserviços Orquestrados)

O projeto será dividido em 3 módulos assíncronos e integráveis, rodando sobre fluxos de trabalho do n8n.

---

### Módulo 1: Motor de Conteúdo Orientado a Buscas (Social SEO)
**Objetivo:** Eliminar a aleatoriedade da geração de conteúdo focando em intenções de busca claras.

*   **Trigger (Agendamento Cron):** Ex: Semanal/Diário.
*   **Etapa 1 - Ingestão de Tendências:** Requisição a uma API de tendências (ex: Google Trends, ou web scraping interno de palavras-chave no ML) usando termos semente ("insônia natural", "imunidade", "suplemento energia").
*   **Etapa 2 - Processamento LLM:** A IA recebe as palavras em alta e converte nas 3 maiores "dores" do cliente.
*   **Etapa 3 - Geração de Roteiro Constraint-Based:** Cria roteiros com estrutura rígida (Problema > Solução > CTA: "Comenta EU QUERO para o link").
*   **Etapa 4 - Renderização e Post:** Envio das diretrizes para os motores de vídeo/imagem do sistema legou para renderizar o post.

---

### Módulo 2: Automação de Resgate e Redirecionamento (SAC via DM)
**Objetivo:** Romper o atrito da plataforma e direcionar o tráfego organicamente e de forma escalável para o anúncio no Mercado Livre.

*   **Trigger (Webhook Instagram/Meta):** O n8n fica na escuta ("listening") para novos comentários nas publicações da conta conectada.
*   **Etapa 1 - Classificação de Intenção (Filtro):** Usa Regex ou uma chamada LLM leve/rápida para classificar a intenção: `É uma dúvida técnica?` vs `É intenção de compra?` (ex: "qual o preço", "eu quero", "link").
*   **Etapa 2 - Resposta Pública (Meta API):** n8n envia payload para curtir o comentário do usuário e responder publicamente: `"Oi! Te mandei o link com todos os detalhes no seu direct! 📥"`
*   **Etapa 3 - Envio da DM (Meta API):** Envio da Mensagem Direta contendo a Copy de vendas e o [Link UTM Parametrizado] diretamente para o checkout do ML.

---

### Módulo 3: Fábrica de Criativos A/B (Para Meta/TikTok Ads)
**Objetivo:** Criação em lote (Batch Creation) alterando poucas variáveis, focando no Custo de Aquisição de Clientes (CAC) de anúncios.

*   **Trigger (Manual ou Webhook):** Entrada da URL de um produto campeão do Mercado Livre.
*   **Etapa 1 - Extração:** Scrape básico da descrição e benefícios do produto.
*   **Etapa 2 - Geração Fatorial (LLM):** A partir das informações do produto, a IA deve formular 1 corpo de roteiro, porém acoplado a **5 a 10 ganchos (hooks) iniciais** completamente diferentes (Ex: Curiosidade, Alerta, Tutorial, Prova Social).
*   **Etapa 3 - Fila de Renderização (Queue):** n8n orquestra o envio dessas 10 combinações para o serviço de renderização de imagem/vídeo.
*   **Etapa 4 - Exportação Estruturada:** Salva os materiais em uma pasta no Google Drive atrelado a um Google Sheet e CSV com formato ideal para **Meta Ads Bulk Import**.

---

## Perguntas em Aberto

1.  **MVP (Minimum Viable Product):** Quais são os 3 produtos naturais com maior margem/conversão da sua loja que servirão como base para nosso primeiro teste desta estrutura?
2.  **Acessos Meta:** A conta do Instagram do nicho e a página do Facebook já estão configuradas como "Conta Profissional/Business"? Você possui acesso ao portal Meta for Developers para cadastrarmos o app do n8n?
3.  **Links e UTMs:** Usaremos algum formato específico para rastreamento dos cliques no Mercado Livre?
