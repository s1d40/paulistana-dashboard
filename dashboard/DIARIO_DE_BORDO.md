# Diário de Bordo - Desenvolvimento do Dashboard Frontend
**Projeto:** Cocreator n8n & Paulistana BI
**Data da Consolidação:** 05 de Maio de 2026

Este documento relata as fundações, arquiteturas e features completadas no Frontend do Dashboard até o presente momento. O projeto transformou-se de uma tela inicial vazia em uma central robusta de inteligência de negócios, operando integrações com Nuvemshop, Google Analytics, Webhooks do n8n (Agentes IA) e Google Sheets (Headless CMS).

---

## 1. Fundações Arquiteturais e Layout
- **Estrutura Base:** Consolidação do uso do Next.js App Router (`src/app`) com TypeScript e Tailwind CSS.
- **Navegação Persistente:** Criação do componente `<Sidebar />` (`src/components/sidebar.tsx`), fornecendo navegação global para Relatórios, Agentes IA e Configurações, com indicadores visuais da rota ativa.
- **Correções de Scroll e Flexbox:** Ajuste do `src/app/layout.tsx` (usando `h-screen flex overflow-hidden`) para garantir que as páginas individuais façam o *overflow* corretamente sem quebrar o layout lateral da barra de navegação.

## 2. Visão Geral (Overview Dashboard)
- **Painel Centralizado:** Refatoração da página principal (`src/app/page.tsx`) com um Grid Responsivo no formato Bento.
- **KPI Cards Dinâmicos:** Cards de métricas alimentados pela camada BFF (Backend For Frontend) na rota `/api/dashboard`, somando dados financeiros reais (Nuvemshop) e de acessos (Google Analytics 4).
- **Tratamentos de Exceção:** Correção de bugs críticos de mapeamento de objetos (prevenindo telas brancas por erros de `Cannot read properties of undefined`).
- **Gráficos:** Inclusão do componente modular `<DashboardChart />` focado na exibição de tráfego ao longo de 7 dias.

## 3. Agentes de IA Operacionais (Chatbots)
- **Componente Reutilizável:** Criação de um `<ChatPanel />` polido que se integra ao SDK da Vercel AI, utilizando um painel de mensagens rolável, com balões de chat distintos para User e Assistant.
- **Isolamento de Contexto:** Divisão física dos Agentes em duas páginas independentes:
  - `/chat/conteudo` (Orquestrador de Conteúdo)
  - `/chat/insights` (Analista de Dados)
- **Integração com n8n:** Ajuste da configuração de Webhooks, permitindo que cada agente acione um fluxo diferente no n8n. Contornamos erros de compilação de TypeScript aplicando tipagens dinâmicas no hook `useChat`.

## 4. Biblioteca de Conteúdos (Headless CMS via Google Sheets)
Esta foi a etapa mais densa, transformando uma planilha simples de operação num CMS autêntico, capaz de carregar e reproduzir mídia.

- **Data Fetching e Parsing:** 
  - Criação do serviço `/src/services/google-sheets.ts`.
  - Utilização da biblioteca `papaparse` para converter exportações CSV públicas (usando seus respectivos GIDs) em interfaces TypeScript (`ContentPost`, `PostImage`, `PostAudio`, `PostVideo`).
- **Endpoints de Agregação:** 
  - `GET /api/content`: Retorna a listagem total de posts validos.
  - `GET /api/content/[id]`: Endpoint dinâmico que cruza dados de 4 abas diferentes (Posts, Imagens/Carrossel, Áudios, Videos) filtrando pelo `id_post` (Chave Estrangeira).
- **Interface da Biblioteca (Grid de Posts):** 
  - Tela `/conteudo/page.tsx` construída com paginação no lado do cliente (12 itens por página, mais recentes primeiro).
  - Cards detalhados com informações de status (`Postado` / `Pendente`), datas formatadas e link direto para o Instagram (se publicado).
- **Detalhes Multimídia (Modal/Drawer):**
  - Criação do `<PostDetailModal />`, fornecendo uma janela expansível e escura focada no post.
  - Exibição limpa do **Roteiro Gerado** e da **Legenda Final**.
  - **Galeria Visual:** Grid das imagens de capas ou carrosséis com links para os arquivos brutos da Google Cloud.
  - **Mídia Integrada:** Players nativos de `<audio>` e `<video>` renderizados em tempo real, permitindo aos gestores ouvirem a narração e assistirem o vídeo editado antes da aprovação/postagem oficial, tudo sem sair do Dashboard.

## 5. Estúdio de Edição Avançado (v2.2)
A página `/conteudo/editor/[id]` foi significativamente aprimorada para permitir um controle cirúrgico da produção.

- **Renderização WYSIWYG:** O editor agora renderiza dinamicamente imagens, áudios e fragmentos de vídeo (`videos_cenas`) conforme são gerados pelos workers.
- **Controle Granular de Produção:**
  - **Gerar Assets:** Botão dedicado para disparar em massa ou individualmente (via hover na timeline) a criação de imagens e audios.
  - **Render por Cena:** Capacidade de renderizar fragmentos de vídeo individuais para validar o "feeling" de cada cena antes da compilação final.
  - **Compilação Final:** Botão para unir todos os fragmentos validados em um vídeo de alta qualidade.
- **Ajustes de Voz (ElevenLabs):** Painel de configurações avançadas permitindo ajustar Estabilidade, Clareza, Velocidade e Estilo da narração via UI.
- **Reatividade em Tempo Real:** Implementação de `supabase.channel` para que a timeline e o preview se atualizem automaticamente assim que os workers gravam novos dados no banco, eliminando a necessidade de refresh.

---

### Próximos Passos (Sugestões Futuras)
Com essa fundação concluída, ouração está altamente expansível. Possíveis passos futuros incluem:
- Autenticação e proteção de rotas (Login para acessar o painel).
- Botões de "Aprovar Post" e "Rejeitar", disparando requests de volta para o Google Sheets/n8n para alterar o status remotamente.
- Ampliação das páginas de relatório específicas (Aquisição, Engajamento, Ecommerce) com métricas profundas isoladas.

---

## 6. Correções e Estabilidade (25 de Maio)
Hoje realizamos uma bateria intensa de correções para robustecer a comunicação entre o Dashboard e o n8n:
- **Ordenação Definitiva do Master Video:** Corrigido o bug onde o `video-studio.tsx` puxava a versão mais antiga do vídeo mestre. Implementamos ordenação reversa por `data_compilacao` para garantir a exibição instantânea da renderização mais recente.
- **Auto-Limpador de Markdown:** Implementada a função `sanitizeJsonString` direto na API Next.js (`route.ts`). O Frontend agora é imune a alucinações de formatação do Agente (como crases e blocos ` ```json `), extraindo o JSON válido silenciosamente antes de quebrar.
- **Desbloqueio de Geração Instantânea:** O botão "Gerar Roteiro" agora permite solicitações de "Cold Start". Removemos as travas rígidas de `activePresetId` nulo e `messages.length === 0`, viabilizando gerações rápidas unicamente via Presets sem obrigar interações de chat prévias.
- **Tratamento de Alucinações de Slugs:** Investigado e isolado o problema de "produtos fantasmas". A UI agora reflete precisamente a desassociação entre slugs falsos inventados pelo LLM (ex: `cebola-crispy`) e a base real do Google Cloud (`cebola_crispy_crocante`).
