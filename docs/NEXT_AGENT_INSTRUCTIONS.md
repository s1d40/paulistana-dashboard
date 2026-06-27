# Instruções para o Próximo Agente

Este documento serve como um guia de transferência para garantir a continuidade do projeto **Cocreator Content Studio** sem perda de contexto.

## 📌 Contexto Atual (Maio 2026)
O projeto está em uma fase de refinamento da interface de gestão e expansão para automação de redes sociais. Acabamos de reformular o **Mural de Ideias** para uma experiência profissional estilo Trello.

## 🛠 Módulos Críticos

### 1. Mural de Ideias (Board)
- **Local:** `dashboard/src/app/board/`
- **Mudança Recente:** Refatorado em componentes modulares (`Column`, `TaskCard`).
- **Drag & Drop:** Utiliza `@hello-pangea/dnd` com um componente `Portal` (`src/components/portal.tsx`) para evitar bugs de deslocamento causados por `backdrop-blur`.
- **Banco de Dados:** Tabela `mural_ideias` no Supabase. Colunas importantes: `posicao` (reordenação manual) e `tags` (array de texto).
- **Próximo Passo:** Implementar a UI para gerenciar e colorir as tags.

### 2. Esteira de Produção
- **Local:** `dashboard/src/app/production/`
- **Lógica:** O dashboard envia comandos para o n8n via webhooks (`/api/production`).
- **Realtime:** O Supabase Realtime é usado para atualizar o status dos posts enquanto o n8n processa em background.

### 3. Chat com Roteirista
- **Local:** `dashboard/src/app/chat/roteirista/`
- **Agentes:** Utiliza presets de System Messages para guiar a IA na criação de roteiros.

## 💾 Banco de Dados (Supabase)
Sempre verifique se as migrações mais recentes foram aplicadas. O arquivo `dashboard/MIGRATION_BOARD_TRELLO.sql` contém as alterações necessárias para o funcionamento do Mural.

## 🚀 Prioridades Imediatas
1. **Instagram API:** Investigar por que os webhooks de DM/Comentários não estão disparando no n8n (Checar Meta for Developers).
2. **Edição por Plataforma:** Criar abas específicas no modal de detalhes do post para editar legendas/tags por rede (IG vs YT vs TikTok).
3. **Persistência do Board:** O sistema de `upsert` no `onDragEnd` é otimista. Monitorar se há race conditions em ambientes com múltiplos usuários.

## 📖 Referências Úteis
- `GEMINI.md`: Regras de codificação e arquitetura.
- `docs/ROADMAP_DESENVOLVIMENTO.md`: Visão de longo prazo.
- `docs/CHECKLIST.md`: Status das tarefas de UI.
