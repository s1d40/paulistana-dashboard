# Plano de Implementação: Agendamentos e Mercado Livre

A solicitação abrange duas frentes principais de trabalho. Realizei uma investigação inicial da arquitetura atual do `dashboard` e dos scripts fornecidos na pasta descompactada `ApiMercadoLivre_unzipped`. 

## 1. Sistema de Agendamentos Funcional

**Diagnóstico atual:**
- A interface `post-detail-modal.tsx` já permite configurar uma data e atualiza os campos `data_agendamento` e `status_agendamento = 'agendado'` com sucesso no banco Supabase (tabela `posts`).
- O painel `cronograma/page.tsx` lê e exibe esses posts corretamente.
- A rota `/api/content/publish/route.ts` já implementa as chamadas de webhooks (n8n) corretas para publicar nas redes (Instagram, YouTube, etc).
- **O que falta:** O "motor" automático que roda periodicamente, identifica os posts cuja `data_agendamento` já chegou e dispara a publicação, alterando o status para `publicado`.

**Proposta de Implementação:**
- **Criar uma rota Cron (Next.js):** Criaremos um endpoint seguro em `src/app/api/cron/process-schedules/route.ts`. Este endpoint fará uma busca no Supabase por todos os posts com `status_agendamento = 'agendado'` e `data_agendamento <= NOW()`.
- Para cada post encontrado, o sistema chamará a mesma lógica do webhook do n8n usada no publish manual e em seguida atualizará o post para `status_agendamento = 'publicado'`.
- Como a Vercel permite executar *Cron Jobs* chamando rotas específicas, bastará adicionar `vercel.json` na raiz ou agendar um gatilho *Schedule* simples no n8n que faça uma requisição GET periódica (ex: a cada 15 minutos) para esta nova rota.

## 2. Integração Mercado Livre API (Scripts do André)

**Diagnóstico atual:**
- Extraímos os arquivos. Foram encontrados vários scripts em Python (`auth.py`, `ads_campaigns.py`, `ApiBling.py`, `bling_clientes_to_sqlite.py`, etc.) baseados no uso de SQLite locais (`bling_bom.db`, `ads_campaigns.db`) e integrações com ERP Bling.
- O documento Markdown fornecido detalha uma infraestrutura robusta para Inteligência Competitiva, inferência de estoque, análise posicional e modelagem matemática (Lei de Zipf) sobre as APIs de `search` e `items` do Mercado Livre.

**Proposta de Implementação:**
1. **Migração e Organização:** Mover os scripts Python extraídos da pasta temporária para dentro do padrão da aplicação: `scripts/mercado_livre/`.
2. **Nova Vertical no Dashboard:**
   - Criar uma nova área de Inteligência de Mercado no frontend (`src/app/mercado-livre/page.tsx`).
   - Apresentar as métricas já capturadas pelos scripts do André (Bling + ML) que hoje estão em SQLite (ou migrá-las para tabelas equivalentes no Supabase para visualização unificada no Next.js).
3. **Adaptação para Postgres (Opcional, mas recomendado):** Se o objetivo é unificar tudo no Supabase como *Single Source of Truth*, os scripts Python deverão ser modificados ligeiramente para inserir os dados extraídos do ML e do Bling no banco PostgreSQL do Supabase, substituindo os bancos `.db` do SQLite locais, facilitando o consumo do front-end.

> [!IMPORTANT]
> ## User Review Required
> **1. Cron de Agendamento:** O disparo automático pode ser via um "Schedule Trigger" do n8n batendo no Next.js, ou você prefere configurar o cron direto pela Vercel? 
> **2. Banco de Dados ML:** Sobre os scripts do André, devemos manter a estrutura dele gravando em SQLite local (exigindo que o Next.js os leia do servidor em disco) ou você autoriza modificarmos esses scripts Python para que eles salvem as informações (Ads, Pedidos, Clientes) direto nas tabelas do Supabase? Migrar para Supabase será muito melhor para alimentar o dashboard.
