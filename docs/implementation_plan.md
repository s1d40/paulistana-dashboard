# Plano de Implementação — Próximos Passos (Reunião 25/06/2026)

> Baseado nas notas da reunião entre Sidnei Felipe e Andre Felicissimo.
> Detalhes técnicos foram adicionados após inspeção da codebase.

---

## User Review Required

> [!IMPORTANT]
> **Aprovação do Plano Técnico**
> Por favor, revise as mudanças propostas abaixo. A implementação envolverá modificações na forma como consumimos a API do Mercado Livre e a criação de uma nova arquitetura de filas para geração de vídeos no n8n.
> Podemos prosseguir com a implementação da **Semana 1** e **Semana 2**?

## Open Questions

> [!WARNING]
> 1. Para a "Fila de processamento de vídeos", existe algum webhook específico no n8n que devo usar para iniciar os *workers*, ou devo criar um novo workflow de *polling* que roda a cada minuto buscando trabalhos pendentes no Supabase? (O plano sugere *polling*, mas *webhook* é mais rápido).
> 2. Documentação da Autenticação do ML: Andre, quando puder, envie os links/documentos da nova API de token para que possamos iniciar a tarefa 5.

---

## Contexto Geral

A equipe revisou o estado atual da plataforma e definiu prioridades claras:
- **Foco primário**: Produção em massa de vídeos + ranking de concorrentes
- **Descontinuado**: Ferramenta de reclamações (baixa prioridade)
- **Monetização a validar**: Afiliados via Instagram/TikTok, SaaS, créditos por processamento
- **Gargalo identificado**: Dependência excessiva de Sidnei; ausência de cronograma semanal

---

## Proposed Changes

### Paginação Mercado Livre

A busca atual limita-se aos primeiros resultados e depois aplica filtros localmente (como o de `fulfillment`), reduzindo drasticamente os resultados úteis.

#### [MODIFY] [route.ts](file:///home/sid/cocreator-n8n/dashboard/src/app/api/ml-spy/route.ts)
- Implementar um loop `while` ou `for` para buscar múltiplas páginas (`offset += 50`) da API do Mercado Livre até que o array de `finalResults` atinja o `limit` desejado (ex: 50 resultados que de fato passaram no filtro).
- Limitar o loop a um número máximo de chamadas (ex: 5-10 páginas) para evitar timeouts na Vercel e rate limits.

#### [MODIFY] [route.ts](file:///home/sid/cocreator-n8n/dashboard/src/app/api/concorrencia/auto-discover/route.ts)
- Atualizar a busca de "Top 25 concorrentes" para também paginar se não encontrar 25 anúncios suficientes após descartar os do próprio André.

---

### Fila de Processamento de Vídeos (n8n)

Evitar timeouts no frontend ao processar múltiplos vídeos simultaneamente.

#### [NEW] [create_video_jobs.sql](file:///home/sid/cocreator-n8n/scripts/create_video_jobs.sql)
- Criar script SQL para inicializar a tabela `video_jobs` no Supabase.
- Campos: `id`, `user_id`, `prompt`, `status` (pending/processing/done/error), `video_url`, `created_at`, `updated_at`.
- Habilitar **Supabase Realtime** nesta tabela para que o frontend seja notificado quando `status` mudar.

#### [NEW] [video_queue_worker.json](file:///home/sid/cocreator-n8n/workflows/video_queue_worker.json)
- Criar um workflow base no n8n que faz polling na tabela `video_jobs` a cada X minutos (ou via Webhook), processa 1 vídeo por vez (Geração de Script -> Áudio -> Imagem -> Vídeo), atualiza o GCS, e marca como `done` no banco.

#### [MODIFY] API de Inicialização de Posts
- Atualizar a rota `/api/production` (ou similar) no Next.js para, ao invés de aguardar a geração completa sincronicamente via HTTP, apenas fazer um `INSERT` na tabela `video_jobs` e retornar `202 Accepted` com o ID do job para o frontend ouvir via Realtime.

---

### Enriquecer Ranking de Concorrentes (Vigia)

Melhorar a visualização dos concorrentes monitorados diariamente.

#### [MODIFY] [page.tsx](file:///home/sid/cocreator-n8n/dashboard/src/app/mercado-livre/page.tsx)
- Na aba "Vigia" (lista de watchlist), adicionar a exibição do **Preço atual**, **Link para o perfil do vendedor** e melhorar a interface do **Gráfico de Preço** histórico (que já é chamado no frontend, mas precisa estar mais visível).
- Adicionar o **filtro de produtos** dentro da lista, facilitando a navegação.

#### [MODIFY] [route.ts](file:///home/sid/cocreator-n8n/dashboard/src/app/api/ml-spy/watchlist/route.ts)
- Garantir que a API de leitura da Watchlist (`GET`) faça um `JOIN` ou retorne o preço mais recente coletado da tabela `price_history` e o ID/nome do vendedor.

---

## Verification Plan

### Automated Tests
- Criar e rodar pequenos scripts em `/home/sid/cocreator-n8n/scripts` (ex: `test_ml_pagination.js`) para simular a chamada das APIs paginadas e garantir que os limites e acúmulos funcionam corretamente.

### Manual Verification
- Acessar o Dashboard localmente e fazer uma busca como "linhaça dourada" ativando o filtro "FULL". Verificar se o sistema retorna 50 itens (buscando em várias páginas) ou se esgota os resultados.
- Inserir um "Video Job" via SQL ou frontend, disparar o n8n e ver o *Supabase Realtime* refletindo a mudança de status na UI.
- Adicionar produtos à Watchlist e verificar a aba "Vigia" para constatar se o preço, foto e gráfico histórico aparecem corretamente.

---

## Cronograma Sugerido

- **Semana 1**: Paginação ML + Validar coleta de concorrentes
- **Semana 2**: Fila de vídeos + Enriquecer ranking (preço + foto)
- **Semana 3**: Autenticação ML + Produção em massa de vídeos de signos
- **Semana 4**: Validação de monetização (afiliados) + Ajustes
