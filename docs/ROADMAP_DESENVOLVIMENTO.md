# Roadmap de Desenvolvimento: Painel BI & Automação de Vendas

Este documento consolida as próximas etapas prioritárias para a evolução do ecossistema Paulistana BI, integrando o dashboard de gestão com os motores de automação no n8n.

---

## 1. Monitoramento e Métricas 360º (Fase de BI Profundo)
**Objetivo:** Consolidar em uma única tela o desempenho de todas as plataformas de conteúdo, permitindo análise comparativa de alcance e conversão.

- [x] **Integração de APIs de Métricas:**
    - **Google Analytics 4:** Implementado suporte a métricas profundas (Páginas/Artigos/Produtos mais visitados).
    - **WordPress API:** Integrado para exibir status de artigos, datas e links de edição direta.
    - **Instagram Graph API:** Insights de alcance, engajamento e salvamentos para Reels e Posts.
    - **YouTube Data API:** Visualizações, tempo de exibição e taxa de clique (CTR) de Shorts.
    - **Facebook API:** Métricas específicas para Facebook Reels e posts de página.
    - **TikTok API for Business:** Impressões, visualizações completas e compartilhamentos.
- [ ] **Dashboard de Performance Multimídia:**
    - Visualização consolidada de "Custo por Visualização" (se houver ads) e "Taxa de Engajamento" por plataforma.
    - Filtros por "Nicho" ou "Produto" para entender qual categoria performa melhor em qual rede.

## 2. Automação de Vendas e Social Commerce (Módulo Instagram)
**Objetivo:** Resolver o gargalo técnico de captura de leads via DM e comentários para automatizar o funil de vendas.

- [ ] **Configuração de App e Webhooks (Meta for Developers):**
    - Revisar permissões de `instagram_manage_messages` e `instagram_manage_comments`.
    - Configurar o endpoint de Webhook no n8n para interceptar mensagens de DM e comentários em tempo real.
    - Implementar verificação de segurança (X-Hub-Signature) no n8n.
- [ ] **Bot de Resposta Automática (Inteligência de Vendas):**
    - Fluxo n8n para classificar intenção (Dúvida vs. Compra).
    - Resposta automática em comentários ("Te mandei o link no direct!").
    - Envio de DM estruturada com link UTM parametrizado para o Mercado Livre.

## 3. Expansão para TikTok (Ecossistema Inexplorado)
**Objetivo:** Estabelecer presença automatizada no TikTok, aproveitando o motor de criativos já existente.

- [ ] **Configuração da TikTok API:**
    - Criação e configuração do App no TikTok for Developers.
    - Implementação do fluxo de OAuth2 para conexão da conta no Dashboard.
- [ ] **Automação de Postagem (TikTok Video Kit):**
    - Desenvolver o pipeline no n8n para upload automático de vídeos gerados.
    - Integração com métricas nativas do TikTok no painel de relatórios.

## 4. Aprimoramento da Fábrica de Conteúdo (Dashboard UI)
**Objetivo:** Dar controle total ao gestor sobre a criação e refinamento dos ativos.

- [x] **Botões de Comando Interativos:** Implementado botão "Aprovar" que dispara webhook para o n8n com o UUID do post.
- [x] **Fábrica de Criativos A/B (Ganchos de Venda):**
    - Interface para input de URL do Mercado Livre e Gerenciador de Ativos.
    - [x] **Esteira de Produção:** Implementada interface de produção em massa com separação de System Message e Prompt de Campanha.
    - [x] **Chat com Roteirista:** Criada página dedicada para refinamento de roteiros em tempo real.
    - [x] **Renderização Direta:** Botão "Render" integrado na biblioteca para acionar o video_maker.py via n8n.
    - [x] **Mural de Ideias (Trello-style):** Implementado sistema de board interativo com drag-and-drop persistente e edição inline.
- [ ] **Edição por Plataforma (Abas de Detalhes):**
    - Aba Instagram: Editor de legenda com quebra de linha e sugestão de hashtags.
    - Aba YouTube Shorts: SEO focado em Título (max 100 caracteres) e Tags.
    - Aba TikTok: Download direto do vídeo com hash de versão e campo para link de rastreamento.
- [ ] **Integração com Banco de Imagens:**
    - No modal de criação/edição, permitir selecionar fotos das pastas `produtos_reais` e `embalagem` para compor o post.

## 5. Visualização do Funil de Conversão (Mercado Livre)
**Objetivo:** Fechar o ciclo de dados entre a rede social e a venda final.

- [ ] **Relatório de Atribuição:**
    - Gráfico de funil: `Comentários` → `DMs Enviadas` → `Cliques em Links UTM` → `Vendas ML`.
    - Identificação de posts "Campeões de Venda" (os que mais geraram cliques para o checkout).

---

## Próximas Ações Imediatas
1. **Instagram:** Auditoria no Meta for Developers para validar por que o webhook de mensagens não está chegando no n8n.
2. **Board:** Monitorar performance do arraste com muitos cards e implementar sistema de tags coloridas (UI).
3. **TikTok:** Iniciar o cadastro do App na plataforma de desenvolvedores.
4. **Dashboard:** Implementar as abas de edição específica por rede social no `<PostDetailModal />`.

