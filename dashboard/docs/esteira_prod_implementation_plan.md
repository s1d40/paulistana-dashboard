# Plano de Implementação: Refinamento da Esteira de Produção e Postagem Automática

Este plano propõe refinar o fluxo de produção em massa e postagem no **Cocreator Dashboard**, habilitando a geração automatizada de captions e hashtags pelo Agente de Ideação, persistência no Supabase e uma interface aprimorada com recursos de download individual/em massa, publicação direta em 3 redes e agendamento sequencial inteligente.

---

## User Review Required

> [!IMPORTANT]
> **Fluxo de Postagem Multi-Canal:** Atualmente, a API de publicação (`/api/content/publish`) dispara posts para redes específicas. Implementaremos um disparador paralelo para publicar nas três plataformas (Instagram, Facebook, YouTube Shorts) em lote ou por post individual, utilizando a conta vinculada no painel lateral.

> [!TIP]
> **Agendamento Sequencial Inteligente (Automático):** Para facilitar a distribuição, incluiremos uma funcionalidade de "Agendamento Automático" que distribuirá todos os vídeos da lista de forma linear (ex: 1 por dia, 2 por dia, etc.) a partir da data de início selecionada.

---

## Proposed Changes

### Frontend & BFF API Components

#### [MODIFY] [route.ts](file:///home/sid/cocreator-n8n/dashboard/src/app/api/production/route.ts)
- Atualizar a ação `init_post` para receber os parâmetros `captions` e `hashtags` do corpo da requisição (`body`).
- Adicionar os campos `captions` e `hashtags` no objeto `postToUpsert` antes de salvar/atualizar no Supabase.

#### [MODIFY] [page.tsx](file:///home/sid/cocreator-n8n/dashboard/src/app/ideacao/page.tsx)
- Modificar a constante `DEFAULT_IDEATION_PROMPT` para instruir explicitamente o Agente de Ideação a gerar também `titulo_otimizado`, `captions` e `hashtags` em cada item da lista.
- O formato do item no array `items` da ferramenta `save_ideation_list` passará a conter:
  - `tema` (tema do vídeo)
  - `prompt` (diretrizes do roteiro)
  - `titulo_otimizado` (título chamativo de até 100 caracteres)
  - `captions` (legenda persuasiva e limpa)
  - `hashtags` (5 a 10 hashtags estratégicas)

#### [MODIFY] [chat-panel.tsx](file:///home/sid/cocreator-n8n/dashboard/src/components/chat-panel.tsx)
- Adicionar no listener do chat uma verificação para a string `"✅ Lista de produção gerada e salva com sucesso."`.
- Ao detectar essa frase (retornada pelo Agente de Ideação após persistir no banco), disparar `onToolSuccess('save_ideation_list')` para garantir feedback adequado no dashboard de ideacão.

#### [MODIFY] [page.tsx](file:///home/sid/cocreator-n8n/dashboard/src/app/production/page.tsx)
- **Modelos e Estados:**
  - Adicionar as propriedades `tituloOtimizado`, `captions` e `hashtags` no tipo/interface `ProductionItem`.
- **Orquestração da Fila Sequencial:**
  - Ao carregar itens da lista de ideação (`dataSource === 'lists'`), ler `titulo_otimizado`, `captions` e `hashtags` de cada item e salvá-los no estado do `ProductionItem`.
  - Na ação de `init_post` do loop sequencial, enviar `captions` e `hashtags` da lista de ideação (com fallback/mesclagem para o roteiro gerado caso existam novos dados).
  - No `polling` em tempo real de produção, carregar os campos `captions`, `hashtags` e `titulo_post` do `livePost` e atualizar o estado do `productionItems`.
- **Funcionalidades de Ação Individual por Card:**
  - Quando um post estiver `Pronto` (`status === 'Pronto'`), expandir a UI do card para mostrar:
    - Um player ou preview de vídeo (aspecto elegante com bordas arredondadas).
    - **Visualizador de Legendas & Tags:** Bloco de texto exibindo a caption e as hashtags geradas, com botões para copiar com um clique ou editar inline.
    - **Botão Baixar (Download):** Botão estilizado com ícone que baixa o arquivo `.mp4` diretamente como um Blob (evitando que abra em nova aba).
    - **Botão Publicar 3 Canais:** Publica o vídeo gerado de forma imediata e paralela no Instagram, Facebook e YouTube usando a conta selecionada.
    - **Botão Agendar:** Seletor de data/hora inline simples e interativo para agendar o post individual.
- **Painel de Ações em Massa (Bulk Actions):**
  - Adicionar no cabeçalho do monitor de produção controles globais quando houver vídeos prontos:
    - **Baixar Todos os Vídeos:** Dispara o download sequencial seguro de todos os vídeos finalizados na lista.
    - **Publicar Lote Completo:** Dispara publicação paralela de todos os posts prontos nas três redes.
    - **Agendar Automaticamente (Massa):** Painel compacto com seletor de "Data de Início" e "Frequência" (ex: 1 post/dia, 2 posts/dia, 3 posts/dia). Calcula sequencialmente e salva no Supabase o agendamento de todos os itens prontos da lista em massa.

### Specifications & n8n Tool Configurations

#### [MODIFY] [IDEATION_AGENT_SPEC.md](file:///home/sid/cocreator-n8n/dashboard/IDEATION_AGENT_SPEC.md)
- Atualizar a definição do schema da ferramenta `save_ideation_list` para incluir `titulo_otimizado`, `captions` e `hashtags` como propriedades obrigatórias do array `items`.
- Ajustar as instruções do agente de ideação (`System Prompt Injection`) para exigir explicitamente que o LLM crie títulos otimizados, legendas persuasivas e hashtags estratégicas na chamada da ferramenta.

#### [MODIFY] [TOOL_DEFINIR_METADADOS.md](file:///home/sid/cocreator-n8n/docs/TOOL_DEFINIR_METADADOS.md)
- Incluir o campo `hashtags` na descrição da ferramenta `Definir_Metadados_Post` do Agente Arquiteto/Roteirista no n8n.
- Atualizar a query SQL correspondente no sub-workflow do n8n para atualizar a coluna `hashtags` na tabela `posts` (adicionalmente à `titulo_post`, `tema_post` e `captions`).

---

## Verification Plan

### Automated & Manual Verification
1. **Geração de Ideias no Ideation Studio:**
   - Acessar `/ideacao` e testar a geração de uma nova pauta.
   - Verificar se as pautas salvas contêm as propriedades `titulo_otimizado`, `captions` e `hashtags` no array JSON da tabela `production_lists`.
2. **Esteira de Produção:**
   - Acessar `/production`, selecionar a lista de ideação recém-criada e iniciar a produção.
   - Confirmar se o `init_post` insere o post com a legenda e as hashtags pré-geradas no banco de dados Supabase.
3. **Validação da UI de Ações no Monitor:**
   - Aguardar a finalização dos vídeos e verificar os cards na aba do monitor.
   - Clicar em "Copiar Legenda" e testar a cópia.
   - Clicar em "Baixar Vídeo" e garantir que o download seja disparado no navegador com o nome do produto/tema correspondente.
   - Testar o painel de "Agendamento Automático em Massa" definindo um espaçamento de posts de 24 horas a partir de amanhã. Verificar no Supabase ou na tela `/cronograma` se as datas e horas foram calculadas e salvas perfeitamente.
