Documento de Escopo Técnico:
Dashboard de Content Management

1. Visão Geral do Projeto
Este documento define a arquitetura de frontend e as especificações de interface para o novo
Dashboard de Gerenciamento de Conteúdo. O sistema atuará como a interface principal para
orquestração de postagens, integrando-se com pipelines de automação assíncronos e APIs de
redes sociais para gerenciar operações em escala.

2. Arquitetura de Exploração de Dados (Busca, Filtros
e Ordenação)
Para lidar com o volume de conteúdos, a interface implementará um sistema robusto de
visualização com controles de estado refinados, permitindo localizar rapidamente ativos
específicos em meio a múltiplas campanhas.

2.1. Sistema de Busca (Search)
● Busca Global (Debounced Search): Input de texto livre com delay de 300ms a 500ms
para evitar sobrecarga de requisições e renderizações desnecessárias no frontend.
● Escopo da Busca: A pesquisa deve varrer de forma indexada os campos de Título
Otimizado, Slug, trechos da Caption/Legenda e IDs internos.

2.2. Filtros Multifacetados
Os usuários poderão aplicar múltiplos filtros simultaneamente para isolar lotes de conteúdo
específicos para revisão ou aprovação em massa.
Categoria do Filtro Opções/Valores Esperados Comportamento UI
Status do Fluxo Pendente_Geracao, Gerando,
Revisão, Agendado, Publicado,
Erro

Dropdown de múltipla escolha
(Checkboxes) com contadores
em tempo real.

Plataforma Alvo Instagram, Facebook, TikTok,

YouTube Shorts

Toggle Buttons (Pills) com os
ícones das respectivas redes.

Nicho/Página Alvo Tags dinâmicas baseadas nos

perfis gerenciados

Select Dinâmico com suporte a
digitação (Autocomplete).

2.3. Sistema de Ordenação (Sorting)
● Por Data: Ordem cronológica de Criação ou Agendamento (Ascendente/Descendente).
● Por Status: Agrupamento lógico (ex: trazer alertas de "Erro" e "Pendentes" para o topo
da fila).
● Por Performance (Fase 2): Ordenação baseada em métricas coletadas no retroativo
(Views, Taxa de Retenção).

3. Módulo de Ações e Gatilhos (Triggers)
A interface deve prover feedback visual imediato e bloquear interações duplicadas para ações
que acionam webhooks externos e fluxos pesados de processamento.

3.1. Geração Individual e em Lote
● Single Action: Botão "Gerar" no card individual. Altera o estado local do componente
para "loading" (spinner) e desabilita o botão até receber a confirmação de sucesso ou
timeout do webhook.
● Bulk Action: Botão global "Gerar Pendentes" no cabeçalho. Envia um array de IDs para
o backend enfileirar o processamento. Exige um modal de confirmação indicando a
quantidade de itens afetados para prevenir execuções acidentais na infraestrutura.

4. Interface de Detalhamento por Plataforma (Abas de
Edição)
Ao abrir os detalhes de um post, o sistema apresenta abas específicas, garantindo que os
metadados respeitem as restrições de cada rede social.
● Aba Instagram/Facebook: Renderização do preview de vídeo (aspect ratio 9:16), editor
de texto rico para a legenda preservando quebras de linha essenciais, e input dedicado
para gestão de hashtags.
● Aba YouTube Shorts: Foco estrutural em SEO. Contadores de caracteres estritos para o
Título (max 100), área ampla para Descrição (inclusão de links) e input de Tags
separadas por vírgula.
● Aba TikTok Shop (Semi-Automática): Preview do asset gerado, texto de legenda curto
e otimizado. Inclui botão de download direto do vídeo (com hash de versão) e um campo
para o operador colar o link final da postagem feita manualmente, fechando o loop de
rastreamento.

5. Arquitetura de Estado (State Management)
O estado dos filtros e da paginação deve ser refletido na URL (Query Parameters) para que os
links do dashboard sejam compartilháveis e a equipe não perca o contexto de trabalho ao
recarregar a página.
// Exemplo do payload de estado do Frontend
{
"searchQuery": "mix de castanhas",
"filters": {
"status": ["Pendente_Geracao", "Pronto"],
"platform": ["TikTok", "Instagram"]
},
"sort": {
"field": "createdAt",
"order": "desc"
},
"pagination": {
"page": 1,
"itemsPerPage": 24