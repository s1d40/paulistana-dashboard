# Relatório Técnico: Inteligência Competitiva Mercado Livre (Projeto Cocreator)
**Preparação para Reunião Estratégica com André (CEO Paulistana Empório)**

Este documento consolida tudo o que foi desenvolvido até agora no módulo "Market Intelligence" voltado para o Mercado Livre. Ele serve como base técnica e de negócios para a reunião de alinhamento, detalhando as funcionalidades, a arquitetura por trás delas e os próximos passos.

---

## 1. Visão Geral do Módulo
O módulo de Mercado Livre foi construído para ser um "Radar de Espionagem e Sinergia". O objetivo principal é dar à Paulistana Empório uma vantagem competitiva injusta ao monitorar preços, tendências (SEO) e dores de clientes nos anúncios dos concorrentes, permitindo tomadas de decisão rápidas (ex: precificação dinâmica e copy otimizada).

---

## 2. Funcionalidades Desenvolvidas (O que temos hoje)

### 2.1. Motor de Busca Bypass (Radar Paulistana)
- **Como Funciona na Tela:** O usuário digita um termo de busca livre (ex: "Castanha de Caju") e escolhe um nicho (ex: Alimentos e Bebidas). O sistema varre o ML e traz o Top 50 dos produtos mais relevantes.
- **Por Baixo dos Panos (Técnico):** Como o Mercado Livre possui um WAF (Web Application Firewall) rígido e bloqueou rotas públicas de busca (`/sites/MLB/search`), construímos uma infraestrutura híbrida na API do Next.js (`/api/ml-spy`).
  - Utilizamos a API de Catálogo (`/products/search`) somada à varredura de Buy Box (`/products/{id}/items`).
  - Implementamos um **Cache em Memória (Map)** que valida a árvore de categorias (`path_from_root`) consumindo a rota `/categories/`. Isso impede que uma busca por "Alfazema" traga perfumes quando o filtro desejado é Alimentos.

### 2.2. A Mágica do "Meu Produto" (Comparador em Tempo Real)
- **Como Funciona na Tela:** Quando uma busca é feita, o painel *magicamente* encontra os anúncios do próprio André no ML que correspondem àquela busca e os coloca num seletor dourado ("Seu Anúncio - Referência"). No card dos concorrentes, aparece uma etiqueta dinâmica (ex: 🔴 *Você está R$ 3,00 mais caro* ou 🟢 *Você está R$ 5,00 mais barato*).
- **Por Baixo dos Panos (Técnico):** O sistema injeta o Token de Acesso da Paulistana em uma requisição direta para a API privada de listagens (`/users/428354884/items/search?q=termo`). Ele cruza o preço de catálogo do André com os valores de Buy Box da concorrência localmente no React.

### 2.3. Mineração de Palavras-Chave (Nuvem de SEO)
- **Como Funciona na Tela:** Extrai os títulos da primeira página de resultados e gera uma nuvem de "tags" visuais.
- **O Valor:** Mostra exatamente como a concorrência chama o produto (ex: "puro", "premium", "pote", "kit"), permitindo otimização imediata no título dos anúncios do André.

### 2.4. Destrinchar Anúncio (Engenharia Reversa com IA)
- **Como Funciona na Tela:** Um botão no card do concorrente aciona uma análise inteligente.
- **Por Baixo dos Panos (Técnico):** Ao clicar, disparamos um Webhook seguro para o **n8n**. O n8n puxa as *Reviews* (avaliações dos clientes) e a Descrição do concorrente, roda um prompt na LLM (Google Gemini) focado em descobrir "dores" dos compradores e "falhas" daquele anúncio, e devolve o resumo mastigado para o frontend. Não há chaves de IA expostas no código.

### 2.5. Lista de Vigia e Gatilho do Arquiteto (Workflows)
- **Como Funciona na Tela:** Permite marcar vários concorrentes via checkbox e enviá-los para um fluxo de ação via "Barra Flutuante".
- **Por Baixo dos Panos:** 
  - **Arquiteto:** Manda os anúncios para a tela de chat de IA para usá-los como base na criação de conteúdos de redes sociais ou scripts de vídeos.
  - **Lista de Vigia (Vigiar Concorrentes):** Prepara a listagem para um monitoramento cronometrado (tracking diário) de alteração de preço, gravando os deltas em um histórico para gráficos de tendência de preço e ranking (Tabela `ml_competitor_history` planejada/estruturada no Supabase).

---

## 3. Arquitetura e Engenharia (Stack)

Para garantir que a ferramenta não caia nas regras de bloqueio do ML e seja escalável, adotamos:
1. **Next.js API Routes (BFF - Backend For Frontend):** Toda a comunicação com o Mercado Livre acontece no servidor. O cliente (navegador) nunca fala com o ML diretamente, evadiendo problemas de CORS e mantendo o Token seguro.
2. **Autenticação Automática via Python:** O script `/scripts/mercado_livre/print_token.py` (isolado num ambiente virtual `venv`) garante que o Token do Mercado Livre esteja sempre fresco. O Next.js consome esse token via `child_process`.
3. **n8n como "Maestro" de Inteligência Artificial:** A arquitetura delega o processamento pesado de IA (como o Destrinchar) para webhooks do n8n, garantindo resiliência (Retries), facilidade de troca de prompts e logs visuais da automação sem necessidade de re-deploy do frontend.

---

## 4. Pauta para a Reunião com o André (O que Precisamos Alinhar)

*Use estes tópicos para guiar a conversa:*

1. **Apresentação do Dashboard:** Mostrar o painel carregando ao vivo a "Nuvem de SEO" e a comparação em tempo real ("Você está R$ X mais barato").
2. **Validação da Busca:** Confirmar se a lógica atual de buscar produtos pela "Árvore de Categoria" (para fugir de produtos genéricos como perfumes) faz sentido para o dia a dia dele.
3. **Definição da "Lista de Vigia" (Tracking Diário):**
   - Queremos que o robô faça varredura todo dia à meia-noite?
   - Onde o André prefere receber os alertas caso um concorrente abaixe o preço muito agressivamente? (E-mail? Mensagem automática no WhatsApp via n8n? Apenas uma notificação vermelha no Dashboard?)
4. **Próximos Passos (Sinergia de Ecossistema):** Entender se no futuro a ideia é que a plataforma mude o preço do anúncio dele automaticamente (Precificação Dinâmica Automática) ou se a ferramenta será sempre estritamente analítica e consultiva.
