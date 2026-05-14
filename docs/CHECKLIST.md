# CHECKLIST: Central de Comando Next.js (Dashboard)

## Fase 1: Setup e Estrutura de Dados [CONCLUÍDO]
- [x] Criar arquivo de CHECKLIST e manter atualizado.
- [x] Definir a tipagem `Preset` em TypeScript (id, name, description, systemMessage, prompt, etc).
- [x] Configurar a store com `zustand` (e persistência via `localStorage`) para gerenciar os Presets.
- [x] Configurar a store com `zustand` para o estado de produção (seleção de preset ativo).

## Fase 2: Gestor de Presets (UI) [CONCLUÍDO]
- [x] Criar página/seção "Gestor de Presets" (`/presets`).
- [x] Componente: Lista de cards com presets criados.
- [x] Componente: Formulário/Editor de Preset (textarea para System Message e Prompt).
- [x] Integrar ações do Zustand (criar, editar, excluir, selecionar como ativo).
- [x] Injetar o conteúdo do arquivo `prompt_agente_roteirista.md` como preset "Default" inicial (via Rota de API).

## Fase 3: Esteira de Produção [CONCLUÍDO]
- [x] Criar página/seção "Produção em Massa" (`/production`).
- [x] Componente: Mostrar o Preset Ativo que será usado na esteira.
- [x] Componente: Botão "Iniciar Produção" e feedbacks visuais (loader, success).
- [x] Rota de API Next.js (`/api/production`) para acionar o webhook `ed1f3ce0...` enviando o `systemMessage`.

## Fase 4: Agente Chat [CONCLUÍDO]
- [x] Criar página/seção "Chat com Roteirista" (`/chat/roteirista`).
- [x] Componente: UI de Chat (integrado com `ChatPanel`).
- [x] Rota de API Next.js (`/api/chat/roteirista`) conectada ao webhook do n8n.
- [x] Lógica para separação de System Message vs Prompt nos Presets.

## Fase 5: Refinamento Visual [EM ANDAMENTO]
- [x] Adicionar suporte total a Dark Mode (Dashboard base).
- [ ] Ajustar espaçamentos, bordas arredondadas e estética Premium.
- [ ] Revisão geral do fluxo e links na Sidebar.
