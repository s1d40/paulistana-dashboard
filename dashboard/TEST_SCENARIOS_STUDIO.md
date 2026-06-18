# Plano de Testes: Agente Arquiteto e Integração de Produtos Reais

Este documento descreve os cenários de teste para validar a inteligência do Agente Arquiteto, a integridade do Cockpit (DNA de Produção) e a nova funcionalidade de uso de Slugs de Produtos Reais.

---

## 🚀 Cenário 1: Orquestração de Ferramentas (The Full Cycle)
**Objetivo:** Validar se o agente consegue executar múltiplas tarefas técnicas em um único comando.

*   **Prompt Sugerido:** "Crie um vídeo para o Mix de Castanhas. Defina o título como 'Promoção Saúde', mude a persona para um tom mais urgente, adicione um card chamado 'Chamada de Ação' com o texto 'Compre Agora' e ajuste a temperatura da IA para 0.9."
*   **Critérios de Aceite:**
    1. [ ] Cabeçalho do Post atualizado para "Promoção Saúde".
    2. [ ] Card de Persona modificado no Cockpit.
    3. [ ] Novo card "Chamada de Ação" criado com sucesso.
    4. [ ] Slider de Temperatura no Cockpit movido para 0.9.

---

## 🍱 Cenário 2: Inteligência de Produtos Reais (Slugs)
**Objetivo:** Validar se o agente identifica os slugs corretos na DB e os passa para o roteiro.

*   **Pré-condição:** Ativar o toggle "Produtos Reais" na sidebar.
*   **Prompt Sugerido:** "Quero um vídeo comparativo entre o Damasco Jumbo e a Ameixa Seca. Certifique-se de usar as imagens reais desses produtos nas cenas de close-up."
*   **Critérios de Aceite:**
    1. [ ] O Agente deve confirmar em texto que está usando os slugs `damasco_jumbo_embalagem` e `ameixa_seca_sem_caroco_embalagem` (ou similares da DB).
    2. [ ] Ao clicar em "Gerar Roteiro", as cenas correspondentes no Editor devem exibir o badge verde **"PR REAL"**.
    3. [ ] O dropdown de "Referência Visual" no Editor deve estar selecionado com o slug correto.

---

## 🛠 Cenário 3: Manipulação de Sessões Customizadas
**Objetivo:** Testar a flexibilidade do Cockpit para estratégias específicas.

*   **Prompt Sugerido:** "Este vídeo é para o TikTok. Remova o card de 'Narração' e adicione dois novos: 'Tendências Musicais' e 'Hashtags Virais'. Preencha-os com sugestões atuais."
*   **Critérios de Aceite:**
    1. [ ] Card de Narração removido do Cockpit.
    2. [ ] Cards de Tendências e Hashtags aparecendo na bancada de trabalho.
    3. [ ] Conteúdo dos novos cards persistido após refresh manual.

---

## 📅 Cenário 4: Agendamento e Metadados (Social Hub)
**Objetivo:** Validar o fluxo de planejamento para o Social Engine.

*   **Prompt Sugerido:** "O título do post é 'Live de Segunda'. A legenda deve ser um convite para o Instagram. Agende isso mentalmente para o dia 20 de maio às 10h." (Nota: O Arquiteto deve salvar os metadados via ferramenta).
*   **Critérios de Aceite:**
    1. [ ] Título atualizado na DB (verificar no modal de detalhes na Biblioteca).
    2. [ ] No Modal de Detalhes, preencher manualmente a data de agendamento (conforme o plano anterior).
    3. [ ] Verificar se o post aparece na página `/cronograma` na data correta.

---

## 🛑 Cenário 5: Limites e Segurança (Negative Test)
**Objetivo:** Garantir que o Arquiteto não tente gerar código ou roteiros diretamente no chat.

*   **Prompt Sugerido:** "Gere o JSON completo do vídeo aqui no chat agora mesmo."
*   **Critérios de Aceite:**
    1. [ ] O Agente DEVE recusar a geração direta no chat.
    2. [ ] Ele deve instruir o usuário que a configuração é feita no Cockpit e a geração ocorre pelo botão "Gerar Roteiro".

---

## 📊 Relatório de Bugs Encontrados
*(Preencher durante os testes)*

| ID | Cenário | Falha Observada | Gravidade |
|----|---------|-----------------|-----------|
| 01 | Histórico de Render | O Editor exibia o vídeo compilado mais antigo em vez do mais recente, devido à falta de ordenação descendente (`data_compilacao`) dos dados do Supabase. (Corrigido) | Alta |
| 02 | Parsing N8N LLM | Retorno de JSON envelopado em Markdown (````json````) quebrava a resposta HTTP da API Next.js. Sanatização Regex via `.text()` implementada. (Corrigido) | Alta |
| 03 | Botão Gerar Roteiro | Botão inativo silenciosamente se não houvesse mensagens no chat ou se não houvesse Preset ativo. Travas removidas para permitir Geração Instantânea via Cockpit. (Corrigido) | Média |
| 04 | Slugs/Produtos Reais | O Agente alucinava nomes de slugs (ex: `cebola-crispy`), gerando "produtos fantasmas" no Select e quebrando URLs do GCS na hora de renderizar. Instaurado uso forçado do dropdown oficial. (Mitigado) | Média |
