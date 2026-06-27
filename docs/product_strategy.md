# Visão de Produto: Market Intelligence para Paulistana Empório (2026)

## 1. O Problema Atual
Ter um dashboard que mostra os Top 50 anúncios de "Castanhas" ou "Frutas Secas" é legal, mas **não é acionável**. O lojista olha para o gráfico e pensa: *"Ok, o fulano está em 1º e eu em 15º... mas **o que eu faço** com essa informação?"*

No Mercado Livre de 2026, o algoritmo é quase uma "caixa-preta" de conversão. Não adianta apenas saber *quem* vende mais, precisamos que o sistema responda o **porquê** e **o que fazer**.

## 2. Por que um Anúncio Vende Mais que o Outro? (O Algoritmo de 2026)
O Mercado Livre prioriza a **Experiência do Comprador**. O ranking não é quem paga mais, é quem **converte mais**. Os fatores críticos hoje são:

1. **Taxa de Conversão (CVR):** Se 100 pessoas clicam no seu anúncio e 5 compram, sua conversão é 5%. Se o do concorrente é 12%, o ML vai jogar ele para o Topo, pois o ML ganha comissão na venda, não no clique.
2. **Logística (O Peso do "Full"):** Produtos no *Mercado Envios Full* recebem um "anabolizante" artificial no ranking. A promessa de entrega no mesmo dia/dia seguinte destrói a concorrência.
3. **Elasticidade de Preço (Buy Box):** Diferenças de centavos em produtos de prateleira (como chás e castanhas) alteram drasticamente a conversão. 
4. **Condições de Venda:** Parcelamento sem juros (Premium) vs Pagamento à vista (Clássico), Frete Grátis em carrinhos específicos.
5. **Saúde do Anúncio:** Qualidade das fotos (agora com verificação por IA pelo ML), vídeo curto (Mercado Clips), preenchimento 100% da ficha técnica (marca, peso líquido exato, tipo de embalagem).

## 3. O "Smart Flow": A Arquitetura da Solução Perfeita
Para que o sistema seja realmente o "braço direito" da Paulistana Empório, precisamos sair de um "Dashboard Passivo" para um **Motor de Diagnóstico Ativo**.

### Passo 1: Ingestão de Dados (O Radar)
- O sistema varre diariamente os nichos (Chás, Castanhas, Snacks).
- Identifica os 10 primeiros colocados de cada nicho (os "Predadores").

### Passo 2: Raio-X Comparativo (O Diagnóstico)
Para cada predador, o sistema cruza os dados com o melhor anúncio equivalente da Paulistana Empório. O banco de dados vai analisar:
- O concorrente está no Full e a Paulistana não?
- O preço da Paulistana está fora da margem de 5% do concorrente?
- O concorrente está oferecendo Frete Grátis e a Paulistana cobrando frete?

### Passo 3: Geração de Insights (O "Porquê")
O painel exibe um feed de alertas mastigados, usando Inteligência Artificial (ou lógica forte) para gerar frases humanas.

**Alerta de Perda de Ranking: Castanha de Caju (1KG)**
*"Seu anúncio caiu para a 8ª posição. O concorrente 'Rei das Castanhas' subiu para 1º porque ativou frete grátis e mudou para o Full. A diferença de preço entre vocês é de apenas R$ 2,50."*

### Passo 4: O Botão de Reação (Ação)
Junto com o alerta, o sistema oferece botões rápidos de ação que ativam workflows do n8n:
- `[ ] Equiparar Preço (Baixar R$ 2,50)`
- `[ ] Ativar Campanha de Ads neste Anúncio para recuperar visibilidade`
- `[ ] Criar Variação de Kit (Leve 3 Pague 2) para fugir da briga direta de preço`

## 4. Como implementar isso com a nossa stack atual?
1. **Supabase (Realtime):** Armazena o Raio-X. Sempre que o bot (Sniper ou Ranking) rodar e detectar uma anomalia (ex: concorrente baixou o preço), insere um registro na tabela `ml_insights`.
2. **n8n (Motor Lógico):** Um workflow do n8n roda de madrugada, pega os dados do Supabase, compara os preços e condições, gera o texto do insight e manda uma notificação no Telegram/WhatsApp do André.
3. **Next.js (Interface):** Uma aba no Dashboard chamada "Plano de Ação", mostrando apenas o que a Paulistana precisa mudar *hoje* para vender mais.

## Resumo Estratégico
Ao invés de dar planilhas e gráficos para o cliente interpretar, nós vamos dar **Decisões Prontas**. O lojista de 2026 não quer analisar dados, ele quer aprovar ou rejeitar ações que aumentem o faturamento dele.
