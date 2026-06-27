# Plano de Ação: Bateria de Testes do Cocreator Studio
**Data:** 25 de Maio de 2026

Este documento apresenta a estrutura planejada para o artefato definitivo (`PLANO_DE_TESTES.md`) que conterá todos os cenários de testes (felizes e inesperados) do sistema. O Agente Investigador mapeou as funcionalidades críticas.

## Escopo dos Testes (O que será documentado)

O documento final será dividido nas seguintes verticais de arquitetura:

### 1. Testes de Fluxo Básico (Happy Paths & Uso Comum)
Antes de testarmos os limites do sistema, precisamos garantir que as operações do dia a dia fluem perfeitamente.

- **Agente Roteirista (Cockpit)**: Entrar no editor, pedir para a IA criar um novo *System Message* na bancada, modificar o conteúdo gerado, testar a nova funcionalidade de carregar presets e, finalmente, clicar em "Salvar Preset" para persistir o novo perfil de IA no banco.
- **Agente de Ideação (Listas de Produção)**: Gerar listas de temas variadas. Testar a criação de listas utilizando a "Seleção de Produtos" (puxando slugs da planilha/Pinecone) e também gerar listas 100% genéricas (sem produtos atrelados).
- **Esteira de Produção em Massa (Navegação Interrompida)**: Disparar a produção em massa e sair da página (fechar a aba ou voltar para o Board) no meio do processo. Retornar à página tempos depois para garantir que a geração continuou no n8n e o status na tela sincronizou corretamente via Supabase.
- **Workflow do Estúdio (Edição Cirúrgica)**: Entrar em um post gerado e editar manualmente o prompt visual ou a narração de apenas uma cena. Testar a funcionalidade de compilar o vídeo novamente usando apenas aquela nova cena atualizada.

### 2. Testes de Erros Sistêmicos e Edge Cases (Estresse)
Aqui vamos focar na robustez e resiliência da infraestrutura.

#### 2.1. Frontend e UX (Next.js & Supabase Realtime)
- **Kanban (Mural de Ideias)**: Race conditions. O que acontece se dois usuários arrastarem cards simultaneamente (via `onDragEnd`)?
- **Desconexão Realtime**: Comportamento do frontend quando o WebSocket do Supabase perde a conexão durante um update de DNA do Roteirista.
- **Formulários e Inputs**: Comportamento do componente de Cockpit se for redimensionado para valores absurdos.

#### 2.2. Agentes de IA e Ferramentas (n8n Webhooks)
- **Agente Arquiteto (Cockpit)**: Forçar o agente a chamar `Gerenciar_Sessoes_Customizadas` sem os parâmetros corretos. 
- **Agente Ideação**: Testar a ferramenta `save_ideation_list` caso o LLM decida enviar o JSON quebrado ou omitindo as hashtags.
- **Mutação Múltipla**: O que acontece se o Arquiteto chamar `Atualizar_Card` em 5 cards simultaneamente no mesmo output?

#### 2.3. Fábrica de Produção e Integrações (Background Workers)
- **Rate Limiting e Concorrência**: Firing de `action="mass_production"` para 50 posts simultâneos para ver se o Next.js e o n8n sobrevivem e respeitam a fila de execução.
- **Falha de Mídia (Zero-Binary Transit)**: Como a UI e o banco (`status`) reagem quando um worker de áudio ou vídeo retorna um link GCS morto/inválido.

#### 2.4. Persistência de Dados e Segurança (Supabase)
- **Upsert Conflicts**: Disparar múltiplas requisições `/api/production` no mesmo `id_post` com *payloads* conflitantes.
- **Exclusão em Cascata**: Deletar um post e assegurar que as tabelas filhas (`imagens`, `audios`, `videos`) não se tornem arquivos zumbis (Orphans).

---

## Próximos Passos
Se esta estrutura agora engloba tanto a validação do uso rotineiro (básico) quanto a resiliência do sistema (erros), me dê o OK! Em seguida, eu irei criar o documento oficial e maciço (`COMPREHENSIVE_TEST_PLAN.md`) detalhando o passo a passo exato de execução de cada um desses testes na prática.
