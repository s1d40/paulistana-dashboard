# **📝 Observações**

jun. 25, 2026

## **Reunião em 25 de jun. de 2026 às 17:55 GMT-03:00**

Registros da reunião [Transcrição](https://docs.google.com/document/d/1_9Dc6iGiAGq45DEnSts-MmKuH7O6ccZBw4titd9DjNQ/edit?usp=drive_web&tab=t.f0vi1vqlssrv) [Gravação](https://drive.google.com/file/d/1ntOjxXNrINL-gkvgl34ILWqPE7PVwe7-/view?usp=drive_web) 

### **Resumo**

A equipe validou ferramentas de monitoramento e priorizou o ranking de concorrentes para otimizar a monetização futura.

**Otimização operacional e técnica**  
A interface foi padronizada e a lista de vigia estabilizada, resolvendo falhas críticas na coleta de dados. A implementação de paginação completa corrigiu a limitação nos resultados de busca.

**Priorização estratégica de desenvolvimento**  
O desenvolvimento da ferramenta de reclamações foi descontinuado para priorizar o ranking de concorrentes e o rastreamento de preços. A lucratividade do modelo de negócio será validada por testes práticos.

**Infraestrutura e escalabilidade**  
A migração para servidores mais potentes reduzirá a latência no processamento de imagens. Sistemas de fila foram planejados para garantir estabilidade operacional durante acessos simultâneos de múltiplos clientes.

### **Próximas etapas**

- [ ] \[Sidnei Felipe Nunes Telles de Almeida\] Corrigir paginação: Implementar a busca completa dos itens de pesquisa incluindo todas as páginas de resultados. Evitar limitar a extração apenas aos primeiros itens retornados pelo Mercado Livre.

- [ ] \[O grupo\] Definir cronograma: Elaborar um plano de trabalho detalhado com prazos semanais para o desenvolvimento do projeto. Organizar atividades para evitar a dispersão em múltiplos projetos paralelos sem finalização.

- [ ] \[Sidnei Felipe Nunes Telles de Almeida\] Investigar reclamações: Analisar o funcionamento do sistema de reclamações para identificar e corrigir erros de processamento. Garantir que todas as solicitações sejam devidamente registradas e monitoradas.

- [ ] \[Sidnei Felipe Nunes Telles de Almeida\] Testar servidor: Aumentar o processamento na nuvem da máquina utilizada para a produção de vídeos em massa para realizar um teste de desempenho e velocidade.

- [ ] \[Sidnei Felipe Nunes Telles de Almeida\] Verificar custo: Verificar o custo exato de produção de cada vídeo para definir a precificação do serviço.

- [ ] \[Sidnei Felipe Nunes Telles de Almeida\] Implementar fila: Implementar um sistema de fila para o processamento de vídeos para evitar falhas por excesso de requisições e permitir o atendimento de múltiplos clientes.

- [ ] \[Andre Felicissimo\] Criar listas: Criar novas listas de produtos para a publicação em páginas adicionais.

- [ ] \[Andre Felicissimo\] Enviar documentação: Enviar a documentação do Mercado Livre sobre a mudança na autenticação por token.

- [ ] \[Sidnei Felipe Nunes Telles de Almeida\] Pesquisar autenticação: Pesquisar sobre as mudanças na autenticação do Mercado Livre para validar se o uso de refresh token será dispensado.

- [ ] \[Sidnei Felipe Nunes Telles de Almeida\] Coletar dados: Executar o sistema de coleta de anúncios novamente para verificar se a captura de dados de concorrentes está funcionando corretamente.

- [ ] \[The group\] Reunião: Realizar uma reunião de acompanhamento às 16 horas.

### **Detalhes**

* **Preferências de Interface do Dashboard**: Andre Felicissimo e Sidnei Felipe Nunes Telles de Almeida discutiram a consistência visual do painel, notando que certas seções apareciam em modo claro enquanto outras estavam em modo escuro, e concordaram que o modo escuro oferece melhor visibilidade ([00:09:13](#00:09:13)).

* **Status Funcional da Lista de Vigia**: Sidnei Felipe Nunes Telles de Almeida confirmou que resolveu o problema onde os itens não estavam sendo salvos corretamente na lista de vigia e garantiu que o sistema está operando e configurado para realizar as coletas de dados durante a madrugada ([00:10:32](#00:10:32)) ([00:19:16](#00:19:16)).

* **Funcionalidade de Trends e Estratégia de Anúncios**: A ferramenta de tendências, que cruza palavras-chave pesquisadas para sugerir alterações de títulos, foi revisada; Andre Felicissimo destacou a dificuldade operacional de alterar anúncios no Mercado Livre, mas reconheceu o valor de utilizar dados sazonais, como "Festa Junina", para futuras estratégias de embalagem ou posicionamento ([00:10:32](#00:10:32)).

* **Melhorias na Ferramenta de Insights**: Sidnei Felipe Nunes Telles de Almeida apresentou a atualização da funcionalidade de insights, que agora busca os 25 produtos mais relevantes com base em volume de vendas e nome, recebendo feedback positivo de Andre Felicissimo pela eficácia da pesquisa ([00:13:14](#00:13:14)).

* **Filtros de Pesquisa e Desafios de Paginação**: A discussão abordou a implementação de filtros por departamento, mas identificou um problema técnico onde os resultados de busca estão limitados à primeira página; eles concordaram que o sistema precisa implementar uma paginação completa para capturar a totalidade dos dados, evitando resultados incompletos ou aleatórios ([00:14:13](#00:14:13)).

* **Ergonomia no Ambiente de Trabalho**: Sidnei Felipe Nunes Telles de Almeida mencionou que está trabalhando em pé para evitar dores lombares, enquanto Andre Felicissimo relatou dores no pescoço, levando a uma breve discussão sobre a importância de mesas com altura ajustável para melhorar a saúde física durante o trabalho ([00:18:31](#00:18:31)).

* **Priorização da Ferramenta de Reclamações**: Andre Felicissimo avaliou a ferramenta de reclamações e decidiu que ela não deve ser uma prioridade, sugerindo que o foco deve ser mantido no desenvolvimento do ranking de concorrentes e na funcionalidade de vigia, que são mais úteis para o modelo de negócios atual ([00:20:10](#00:20:10)).

* **Aprimoramento do Ranking de Concorrentes**: A dupla discutiu a necessidade de enriquecer o ranking de produtos com informações de preço, fotos e, futuramente, acesso ao perfil dos vendedores para facilitar o acompanhamento e análise de mercado ([00:21:47](#00:21:47)).

* **Automação de Redes Sociais**: Sidnei Felipe Nunes Telles de Almeida confirmou a configuração bem-sucedida do TikTok para postagens automáticas, um passo essencial para a estratégia de crescimento em múltiplas plataformas ([00:23:18](#00:23:18)).

* **Estratégia de Conteúdo e Afiliados**: Foi discutida a transição para uma estratégia de produção em massa de vídeos, incluindo temas de nicho como signos e produtos naturais, visando a monetização através de marketing de afiliados e redirecionamento de tráfego para plataformas como Mercado Livre e Shopee ([00:24:08](#00:24:08)) ([00:27:33](#00:27:33)).

* **Produção de Conteúdo de Longa Duração**: Sidnei Felipe Nunes Telles de Almeida propôs a criação de vídeos educativos mais longos utilizando inteligência artificial, seguindo tendências de mercado que geram alto volume de visualizações ao responder a perguntas complexas ou longas ([00:26:40](#00:26:40)).

* **Necessidade de Cronograma Estruturado**: Ambos concordaram que a falta de um cronograma claro, com deadlines semanais específicos, tem causado dispersão em vários projetos pequenos, sendo necessário focar em finalizar a produção de vídeos em massa como prioridade ([00:28:29](#00:28:29)) ([00:33:52](#00:33:52)).

* **Escalabilidade e Acesso Multi-Cliente**: Discutiu-se a viabilidade de comercializar a plataforma para terceiros, confirmando que a arquitetura atual permite a separação de acessos e logins, mantendo as chaves de API e configurações de ambiente protegidas individualmente para cada usuário ([00:30:02](#00:30:02)).

* **Automação de Atendimento via Direct Message**: A implementação da automação de resposta em DM (mensagens diretas) e comentários foi celebrada, com Sidnei Felipe Nunes Telles de Almeida explicando que a ferramenta utiliza inteligência artificial para buscar produtos em uma tabela interna e responder o link correto ao cliente, sem alucinar ([00:34:29](#00:34:29)).

* **Modelo de Monetização**: Foram debatidas formas de monetização, incluindo a venda do software como um serviço (SaaS), módulos específicos como o rastreamento de preços do Mercado Livre, ou marketing de afiliados, decidindo que testes práticos determinarão o modelo mais lucrativo ([00:36:06](#00:36:06)) ([00:38:33](#00:38:33)).

* **Otimização de Servidores e Latência**: Sidnei Felipe Nunes Telles de Almeida e Andre Felicissimo analisaram gargalos no processamento de imagens e áudio via API e concordaram em testar a migração para servidores mais potentes na nuvem para reduzir o tempo de renderização e latência, que atualmente é considerado longo para uma experiência de usuário ideal ([00:40:12](#00:40:12)).

* **Implementação de Fila de Processamento**: Para permitir o uso simultâneo por múltiplos clientes sem causar erros ou bloqueios pelas APIs, Sidnei Felipe Nunes Telles de Almeida planeja implementar um sistema de fila (queue) no N8N, garantindo estabilidade e segurança ao sistema ([00:44:40](#00:44:40)) ([00:57:43](#00:57:43)).

* **Custos e Metodologia de Cobrança**: Foi estimado que o custo de produção por vídeo é baixo, entre R$ 4 e R$ 5, e discutiu-se a implementação de um sistema de créditos por processamento para cobrar usuários, caso a plataforma seja comercializada ([00:45:30](#00:45:30)).

* **Resolução de Erros de Time-out no Frontend**: Durante os testes de geração em massa, ocorreram erros de time-out no frontend; Sidnei Felipe Nunes Telles de Almeida identificou que, embora o processo de fundo funcione, o tempo de resposta excedeu o limite da interface, e está trabalhando para corrigir isso ([00:49:55](#00:49:55)).

* **Fluxo de Trabalho de Geração Automática**: A reunião concluiu com a revisão do fluxo de trabalho, onde o sistema gera roteiros, áudios e imagens, subindo os ativos para o Google Cloud, e o frontend aguarda pings do banco de dados para atualizar o status, confirmando que este é o processo de automação que deve ser refinado para os próximos dias ([00:54:47](#00:54:47)) ([00:59:03](#00:59:03)).

* **Ferramenta de análise de anúncios**: Sidnei Felipe Nunes Telles de Almeida apresentou um sistema, baseado em prompts, que analisa anúncios para identificar gatilhos mentais e a promessa principal do produto, como exemplificado com uma experiência de chá premium ([01:02:20](#01:02:20)). Adicionalmente, a ferramenta inclui um botão para transformar anúncios de concorrentes em temas de vídeo, uma funcionalidade sugerida pela Inteligência Artificial que permite ao grupo reutilizar conceitos de vídeos de terceiros para a criação de novos conteúdos ([01:03:03](#01:03:03)).

* **Comercialização do produto**: Andre Felicissimo e Sidnei Felipe Nunes Telles de Almeida discutiram a viabilidade de vender a estrutura desenvolvida para escalar o negócio. Eles observaram que existem produtos no mercado, como transformadores de vídeo em carrossel, sendo vendidos por 397 (moeda não especificada), e planejam validar a estrutura própria anunciando o produto para testar o mercado e realizar ajustes conforme o feedback dos usuários ([01:03:47](#01:03:47)).

* **Desafios de escalabilidade e equipe**: O projeto encontra-se atualmente muito dependente de Sidnei Felipe Nunes Telles de Almeida, o que foi identificado como um gargalo para o crescimento ([01:04:35](#01:04:35)). Para solucionar isso, Andre Felicissimo sugeriu a possibilidade de contratar um programador, mencionando um amigo que poderia colaborar, embora tenham concordado que, no momento, a expansão da equipe ainda é um passo distante e que o foco imediato é estruturar o processo para permitir a contratação futura ([01:05:17](#01:05:17)).

* **Integração de APIs**: A equipe confirmou que o sistema está integrado com sucesso às principais APIs, incluindo TikTok, Mercado Livre e Meta. Andre Felicissimo informou que o processo de autenticação do Mercado Livre está passando por uma mudança, com a previsão de que o token seja embutido no retorno, eliminando a necessidade de requisições constantes de refresh token, e comprometeu-se a enviar a documentação atualizada para Sidnei Felipe Nunes Telles de Almeida ([01:09:05](#01:09:05)).

* **Sistema de coleta de dados de concorrentes**: Sidnei Felipe Nunes Telles de Almeida desenvolveu um sistema automatizado que coleta e armazena diariamente dados, como preço, de anúncios de concorrentes ([01:10:03](#01:10:03)). O sistema foi colocado em funcionamento para montar um acompanhamento de preços, sendo esperado um intervalo de alguns dias para a coleta de dados suficientes para alimentar os gráficos de análise ([01:10:52](#01:10:52)).

* **Desenvolvimento profissional e portfólio**: O projeto é visto por Sidnei Felipe Nunes Telles de Almeida como uma adição significativa ao portfólio profissional, destacando o aprendizado técnico, especialmente na implementação de JWT (JSON Web Token) ([01:13:27](#01:13:27)). Ambos concordaram que é necessário monetizar o projeto efetivamente para criar uma estrutura que suporte o pagamento de uma remuneração melhor e a contratação de pessoas para funções operacionais ([01:14:21](#01:14:21)).

* **Programa Total Pass**: Andre Felicissimo apresentou o serviço "Total Pass", que permite o acesso a diversas academias e atividades esportivas (como natação, boxe e pilates) por uma mensalidade de 120 (moeda não especificada) ([01:16:01](#01:16:01)). Após receber orientações, Sidnei Felipe Nunes Telles de Almeida realizou o cadastro utilizando o CPF (419 713 428 23\) e encontrou opções locais de academias e clínicas, incluindo a "Carreira Fit" e a "Clínica Juja" ([01:16:53](#01:16:53)) ([01:23:11](#01:23:11)).

* **Saúde e bem-estar**: Os participantes conversaram sobre dores físicas, especificamente na lombar, quadril e ombro, e discutiram a importância de alongamentos, atividades físicas e fisioterapia. Andre Felicissimo relatou que está realizando fisioterapia devido a uma lesão no ombro resultante de um acidente de moto ([01:15:08](#01:15:08)) ([01:20:38](#01:20:38)). Sidnei Felipe Nunes Telles de Almeida sugeriu o plano de saúde "Santa Saúde" como uma opção acessível, custando 430 (moeda não especificada) por mês para o titular e dois dependentes ([01:25:35](#01:25:35)).

* **Emissão de notas fiscais**: Andre Felicissimo solicitou a emissão de notas fiscais de serviço para os trabalhos realizados, visando a conformidade dos impostos da empresa. Sidnei Felipe Nunes Telles de Almeida confirmou a disponibilidade para realizar a emissão, concordando em receber os pagamentos por meio de uma conta bancária empresarial ([01:26:25](#01:26:25)).

* **Experimentos com conteúdo no YouTube**: Sidnei Felipe Nunes Telles de Almeida relatou a criação de vídeos de 8 horas para o YouTube, utilizando scripts em Python para repetir afirmações positivas e músicas de relaxamento criadas via IA, com o objetivo de trabalhar a reprogramação neurolinguística ([01:27:19](#01:27:19)). Embora um dos testes tenha obtido apenas 20 visualizações, eles discutiram o potencial desse formato, citando canais similares que alcançam grande engajamento (com menções a 60.000 visualizações e 1,5 milhão de inscritos) e discutiram a importância de vídeos longos como estratégia para o futuro ([01:28:18](#01:28:18)).

* **Encerramento e próximos passos**: Andre Felicissimo e Sidnei Felipe Nunes Telles de Almeida encerraram a conversa combinando uma nova reunião para as 16h, visando continuar o alinhamento das atividades do projeto ([01:31:24](#01:31:24)).

*Revise as anotações do Gemini para checar se estão corretas. [Confira dicas e saiba como o Gemini faz anotações](https://support.google.com/meet/answer/14754931)*

*Como está a qualidade de **destas observações?** [Responda a uma breve pesquisa](https://google.qualtrics.com/jfe/form/SV_9vK3UZEaIQKKE7A?confid=HVN0P7EojcrkdVe5jOYcDxIUOAIIigIgABgFCA&detailid=standard&screenshot=false) para nos dar seu feedback, incluindo o quanto as observações foram úteis para o que você precisa.*

# **📖 Transcrição**

jun. 25, 2026

## **Reunião em 25 de jun. de 2026 às 17:55 GMT-03:00 \- Transcrição**

### **00:04:14**

**Sidnei Felipe Nunes Telles de Almeida:** Ele ainda não tá respeitando. mano. Ah. Nossa, cara, uma vez eu eu tava andando na feira, eu falei: "Essa batata aqui parece tá meio estragada, tá meio pud. Eu peguei ela embora pra casa para criar e virou isso aqui, ó. Uma batata. Pinh Não sei que ele quer falar, velho.

**Andre Felicissimo:** Nossa, do de leite. 1000 folhas de aqui só tem 200 folhas. Você não quer não? Eu vou comer.

**Sidnei Felipe Nunes Telles de Almeida:** Fala, meu querido

**Andre Felicissimo:** Meu rei. Tudo certo.

**Sidnei Felipe Nunes Telles de Almeida:** Aí,

**Andre Felicissimo:** Cadê tu?

**Sidnei Felipe Nunes Telles de Almeida:** tá me ouvindo aí?

**Andre Felicissimo:** Tô não trocar uma ideia.

**Sidnei Felipe Nunes Telles de Almeida:** E aí, como é que que manda?

**Andre Felicissimo:** Só ver como que tá funcionando as coisas, o que que você implementou. Tá, você não fez isso.

**Sidnei Felipe Nunes Telles de Almeida:** Ah, vamos lá.

### **00:09:13** {#00:09:13}

**Andre Felicissimo:** Não dá para comer não.

**Sidnei Felipe Nunes Telles de Almeida:** Você chegou a dar uma você Oi.

**Andre Felicissimo:** Falando com meu irmão.

**Sidnei Felipe Nunes Telles de Almeida:** Chegou a dar uma explorada lá?

**Andre Felicissimo:** Por

**Sidnei Felipe Nunes Telles de Almeida:** Nossa,

**Andre Felicissimo:** cima.

**Sidnei Felipe Nunes Telles de Almeida:** parece tá tá alto meu microfone ou tá de boa?

**Andre Felicissimo:** Minutinho irmão me dá um doce aqui. Você viu meu tênis? Você viu o papelho? Tava na escada. Quase caí. Cadê a p\*\*\*\*?

**Sidnei Felipe Nunes Telles de Almeida:** Beleza.

**Andre Felicissimo:** minutinh porta que seu tá branco e meu é preto o

**Sidnei Felipe Nunes Telles de Almeida:** O quê?

**Andre Felicissimo:** dashboard

**Sidnei Felipe Nunes Telles de Almeida:** Aqui o seu tá preto.

**Andre Felicissimo:** É,

**Sidnei Felipe Nunes Telles de Almeida:** Sério?

**Andre Felicissimo:** é,

**Sidnei Felipe Nunes Telles de Almeida:** Não, não.

**Andre Felicissimo:** eu sou da

**Sidnei Felipe Nunes Telles de Almeida:** Essa tela inicial aqui,

**Andre Felicissimo:** hã,

**Sidnei Felipe Nunes Telles de Almeida:** essa primeira tela aqui não. As outras telas são escuras,

**Andre Felicissimo:** será porque tá mas é tudo preto,

### **00:10:32** {#00:10:32}

**Sidnei Felipe Nunes Telles de Almeida:** mas essa aqui não.

**Andre Felicissimo:** não tem nada branco no meu. É,

**Sidnei Felipe Nunes Telles de Almeida:** Louco.

**Andre Felicissimo:** eu vou partilhar para tu ver.

**Sidnei Felipe Nunes Telles de Almeida:** Qual que você prefere?

**Andre Felicissimo:** Como faz? Eu acho que branco fica mais visível. Mas o meu amigo até falou: "Pô, coloca um botão aqui de deixar preto e branco". Não, mas não é um problema que tem que resolver

**Sidnei Felipe Nunes Telles de Almeida:** Nossa, velho, eu quero mudar o meu para preto agora. Eu nem sei.

**Andre Felicissimo:** todo

**Sidnei Felipe Nunes Telles de Almeida:** Nossa,

**Andre Felicissimo:** preso.

**Sidnei Felipe Nunes Telles de Almeida:** então eu eu refinei aquela parada lá que você pediu, né, que ele realmente não tava salvando os itens na vigia lá.

**Andre Felicissimo:** Uhum. Não tava.

**Sidnei Felipe Nunes Telles de Almeida:** Agora não, não tava. Agora ele tá, né? Tá salvando ainda. Não tá puxando. Ah, eu fiz essa parada das trends aqui, né? Isso aí você viu, né,

### **00:11:37**

**Andre Felicissimo:** Vi, deixa eu olhar de novo

**Sidnei Felipe Nunes Telles de Almeida:** que é tipo, ele cruza,

**Andre Felicissimo:** até

**Sidnei Felipe Nunes Telles de Almeida:** cruza as palavras mais pesquisadas assim e dá umas sugestões assim, né? Tipo assim,

**Andre Felicissimo:** Uhum.

**Sidnei Felipe Nunes Telles de Almeida:** ele deu essa sugestão aí que era você alterar o título dos anúncios para escrever festa junina, porque a galera,

**Andre Felicissimo:** Uhum.

**Sidnei Felipe Nunes Telles de Almeida:** tipo, compra só por ser festa junina, sabe? Um bagulho meio

**Andre Felicissimo:** Sim. É que não é legal ficar fazendo a alteração no Ué,

**Sidnei Felipe Nunes Telles de Almeida:** psicológico.

**Andre Felicissimo:** sumiu daqui. Caiu não, não é legal.

**Sidnei Felipe Nunes Telles de Almeida:** Não, tô aqui. Tô

**Andre Felicissimo:** Primeiro que não é tão nem tão fácil de alterar os

**Sidnei Felipe Nunes Telles de Almeida:** aqui.

**Andre Felicissimo:** anúncios.

**Sidnei Felipe Nunes Telles de Almeida:** Ah,

**Andre Felicissimo:** Ele pede pra gente mudar, mandar foto,

**Sidnei Felipe Nunes Telles de Almeida:** tá.

**Andre Felicissimo:** mandar comprovante, demora tempo. Mas legal ainda que pode ser o 21 em algum algum momento.

### **00:12:30**

**Sidnei Felipe Nunes Telles de Almeida:** É tipo assim, de repente pro ano que vem, né, você, tipo,

**Andre Felicissimo:** Sim,

**Sidnei Felipe Nunes Telles de Almeida:** é só encomendar em uma embalagem diferente,

**Andre Felicissimo:** eu acho que é,

**Sidnei Felipe Nunes Telles de Almeida:** o produto é o mesmo, aí você faz uma embalagem com as

**Andre Felicissimo:** eu acho que até para monitorar, tipo,

**Sidnei Felipe Nunes Telles de Almeida:** bandeirinha,

**Andre Felicissimo:** eh, por exemplo, ele ele sugere alterações, mas ele fala qualquer as palavraschaves que tá em Ah, fala aqui, mas não fala todas,

**Sidnei Felipe Nunes Telles de Almeida:** fala.

**Andre Felicissimo:** fala só algumas.

**Sidnei Felipe Nunes Telles de Almeida:** É só as as principais, né?

**Andre Felicissimo:** Mas ele seta é só 10 ou a gente dá o retorno de 100 palavras?

**Sidnei Felipe Nunes Telles de Almeida:** Não retorna mais. Dá para dá para ampliar isso aí se quiser.

**Andre Felicissimo:** É porque eu acho que eu usaria mais isso do que um do que as palavras em si, mas enfim. É legal isso daí.

**Sidnei Felipe Nunes Telles de Almeida:** Tipo,

**Andre Felicissimo:** Eu vi um negócio também que você

**Sidnei Felipe Nunes Telles de Almeida:** é, então ele para ele retornar as palavraschave de outro de outras categorias também,

### **00:13:14** {#00:13:14}

**Andre Felicissimo:** fez.

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** Uhum.

**Sidnei Felipe Nunes Telles de Almeida:** Vor categoria,

**Andre Felicissimo:** É, mas isso é mais pro estudo de mercado futuro,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** entendeu? Pô, o que que as pessoas estão pesquisando que produto que tá em alta?

**Sidnei Felipe Nunes Telles de Almeida:** Sim.

**Andre Felicissimo:** Não, para calma,

**Sidnei Felipe Nunes Telles de Almeida:** E aí esse aqui ele busca os anúncios mais relevantes, né,

**Andre Felicissimo:** deixa eu ver. Deixa eu abrir que eu tô dividindo a tela.

**Sidnei Felipe Nunes Telles de Almeida:** produto, né? Essa parte aqui do insites aqui, ele tipo, ele pesquisaria já os os 25 mais relevantes por produto que você tem, entendeu? Você dá uma

**Andre Felicissimo:** Hum.

**Sidnei Felipe Nunes Telles de Almeida:** olhada

**Andre Felicissimo:** Pô, mas isso ficou melhor do que negócio de pesquisa. Como você faz isso?

**Sidnei Felipe Nunes Telles de Almeida:** o quê?

**Andre Felicissimo:** Isso daqui buscou os produtos mais relevantes.

**Sidnei Felipe Nunes Telles de Almeida:** Eu mandei a Iá fazer

**Andre Felicissimo:** Não,

**Sidnei Felipe Nunes Telles de Almeida:** pelo tipo pelo nome e e por quantidade vendida,

### **00:14:13** {#00:14:13}

**Andre Felicissimo:** porque

**Sidnei Felipe Nunes Telles de Almeida:** assim, os que estão em primeiro na lista,

**Andre Felicissimo:** deixa eu testar uma coisinha aqui.

**Sidnei Felipe Nunes Telles de Almeida:** entendeu? Os o mais relevante seria esse aí, ó, o preço médio, que é esse de semente de abóbora.

**Andre Felicissimo:** ver. Ah, tá. Tá. Deixa eu dar uma olhadinha aqui no negócio. Eu vejo que você adicionou mais um filtro também, né, de departamento para conseguir pesquisar outros nichos.

**Sidnei Felipe Nunes Telles de Almeida:** Isso.

**Andre Felicissimo:** Legal.

**Sidnei Felipe Nunes Telles de Almeida:** Os os globais,

**Andre Felicissimo:** Isso daqui é excelente.

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** Uhum. Mas tem os subnichos,

**Sidnei Felipe Nunes Telles de Almeida:** Globaiãos assim

**Andre Felicissimo:** por exemplo, eu pesquisei o global, eu consigo pesquisar outro nicho dentro.

**Sidnei Felipe Nunes Telles de Almeida:** dá para fazer. Eu deixei só os que você trabalha,

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** Mas daria para exp,

**Andre Felicissimo:** Não tá.

### **00:15:15**

**Sidnei Felipe Nunes Telles de Almeida:** tipo,

**Andre Felicissimo:** Sim,

**Sidnei Felipe Nunes Telles de Almeida:** entendi o que você tá falando.

**Andre Felicissimo:** sim. Vai linkar, né? Ô, mas por exemplo aqui,

**Sidnei Felipe Nunes Telles de Almeida:** É

**Andre Felicissimo:** ó, pesquisa nozes aí para você ver. Deixa eu ver se eu pesquiso 50 aqui.

**Sidnei Felipe Nunes Telles de Almeida:** nozes. As árvores somos nozes.

**Andre Felicissimo:** Não, porque aquela quebra língua, né?

**Sidnei Felipe Nunes Telles de Almeida:** Ah, quebra quebra nozes.

**Andre Felicissimo:** Não, ele só apareceu esse. Eu nem testei outro, testei só noes. Eu vou ter aí por isso que eu falei, pô, caramba, o outro puxou tudo.

**Sidnei Felipe Nunes Telles de Almeida:** Estranho.

**Andre Felicissimo:** Por que que esse daqui não será que é uma palavra só?

**Sidnei Felipe Nunes Telles de Almeida:** Ele não puxa nada, né?

**Andre Felicissimo:** Hum. Não,

**Sidnei Felipe Nunes Telles de Almeida:** Dependendo da

**Andre Felicissimo:** eu testei aqui se é min girassol.

**Sidnei Felipe Nunes Telles de Almeida:** palavra,

**Andre Felicissimo:** Vamos ver se ele

**Sidnei Felipe Nunes Telles de Almeida:** eu deveria retornar muita coisa, né, na verdade.

### **00:16:21**

**Andre Felicissimo:** tem. É. Então, por exemplo, os outros itens, é, você me mostrou o exemplo que você me deu, que você me deu, que você fez aí no nesse ranking, pô, tem um monte de item que não, tipo, não tá vindo no Eu pesquei agora sem de girassol também não tá retornando nada.

**Sidnei Felipe Nunes Telles de Almeida:** no radar,

**Andre Felicissimo:** Ah, agora agora veio.

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** Mas, por exemplo, eu pesquisei 50 itens, veio três.

**Sidnei Felipe Nunes Telles de Almeida:** É, ele tem que fazer uma paginação maior,

**Andre Felicissimo:** Não,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** aí eu não sei como que funcionaria isso, mas eu acho que ele, que que ele deve tá fazendo na primeira página só tem três, entendeu?

**Sidnei Felipe Nunes Telles de Almeida:** É tipo, ele deve pesquisar, tipo assim, digamos que o você faz uma pesquisa, o Mercado Livre deve retornar, sei lá, 25 itens, aí ele aplica já um filtro antes de mostrar, entendeu?

**Andre Felicissimo:** Tem que fazer a paginação toda, guardar os arquivos.

**Sidnei Felipe Nunes Telles de Almeida:** É, vai ter que tipo assim, ah, ele não deu tanto, deu X itens assim, ele vai ter que buscar mais, né,

### **00:17:21**

**Andre Felicissimo:** Sim. E não,

**Sidnei Felipe Nunes Telles de Almeida:** para poder mostrar o

**Andre Felicissimo:** eu acho que até, por exemplo, como são itens, por exemplo, tem um linhaça dourada,

**Sidnei Felipe Nunes Telles de Almeida:** resultado.

**Andre Felicissimo:** você pesquisar linhaça dourada, ele traz tipo tudo que é dourado, então ele vai trazer infinitos itens. Aí eu não sei como que faria faria esse filtro, mas eu acho que tem que buscar tudo, não tipo buscar os 50 primeiros,

**Sidnei Felipe Nunes Telles de Almeida:** Não tá vendo?

**Andre Felicissimo:** entendeu? que ele retorna aleatoriamente.

**Sidnei Felipe Nunes Telles de Almeida:** Uhum.

**Andre Felicissimo:** Че?

**Sidnei Felipe Nunes Telles de Almeida:** É esse que tá faltando, né, velho? Mesmo aqui sem nenhum nicho pesquisa aqui linhas ele tá retornando só dois, né?

**Andre Felicissimo:** Ah, tá. Não, isso eu nem testei, eu já coloquei no nicho já. É algum filtro que ele tá fazendo anterior, né? Tá sem cadeira,

**Sidnei Felipe Nunes Telles de Almeida:** Tô nada.

**Andre Felicissimo:** caro.

**Sidnei Felipe Nunes Telles de Almeida:** Eu tô trabalhando em pé, mano. É, pô, para não ficar o dia inteiro

### **00:18:31** {#00:18:31}

**Andre Felicissimo:** Não é bom. Eu tô com uma dor aqui no na no pescoço,

**Sidnei Felipe Nunes Telles de Almeida:** sentado.

**Andre Felicissimo:** mano, que eu ficar assim, né, olhando o computador.

**Sidnei Felipe Nunes Telles de Almeida:** Então, e dá uma dor do c\*\*\*\*\*\* na lombar,

**Andre Felicissimo:** Nossa,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** não dá. Ah, não, Lomb não,

**Sidnei Felipe Nunes Telles de Almeida:** Então,

**Andre Felicissimo:** mas o na pescoçu

**Sidnei Felipe Nunes Telles de Almeida:** aí aqui como aí como tá aqui na TV, né? Tipo, a TV fica bem na altura do meu olho. Aí dá para trabalhar de pé,

**Andre Felicissimo:** é

**Sidnei Felipe Nunes Telles de Almeida:** de boa assim. Até tô preferindo, velho, que assim eu consigo. É tipo isso, o sangue circula,

**Andre Felicissimo:** os caras faz até de mais esteira,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** né? Levanta a mesa, já viu?

**Sidnei Felipe Nunes Telles de Almeida:** Então eu queria uma mesinha dessa.

**Andre Felicissimo:** Ah, mas três conto, dois conto a mesa,

**Sidnei Felipe Nunes Telles de Almeida:** Ah, mas dá para fazer, né?

### **00:19:16** {#00:19:16}

**Sidnei Felipe Nunes Telles de Almeida:** Dá para fazer

**Andre Felicissimo:** p\*\*\*\*. Aí, mas aí você é eu,

**Sidnei Felipe Nunes Telles de Almeida:** um

**Andre Felicissimo:** a minha mesa já tá mal feita. com a mão francesa aqui.

**Sidnei Felipe Nunes Telles de Almeida:** Então esse a lista de vigia agora tá funcionando. Você clicar nele, ele ele ele

**Andre Felicissimo:** Tá, deixa eu dar até uma olhadinha, então. Mas aí eu olhei,

**Sidnei Felipe Nunes Telles de Almeida:** salva.

**Andre Felicissimo:** por exemplo, é que eu não tinha conseguido porque tava com esse o espaço de busca pequeno, né?

**Sidnei Felipe Nunes Telles de Almeida:** É, então deixa eu até ver esse negócio aí.

**Andre Felicissimo:** Cadê o vídeo? Então, mas não, ele minerou o dado, por exemplo, vigia, porque eu clico aqui, não aparece nada, aparece nenhum dado histórico coletado.

**Sidnei Felipe Nunes Telles de Almeida:** Então é uma vez por dia, né?

**Andre Felicissimo:** Então, mas não tem nenhum,

**Sidnei Felipe Nunes Telles de Almeida:** É, então aí vai rodar de madrugada hoje.

**Andre Felicissimo:** tá?

**Sidnei Felipe Nunes Telles de Almeida:** Ah, os outros não tava.

**Andre Felicissimo:** Mas é que não tava ativo,

**Sidnei Felipe Nunes Telles de Almeida:** É, não tava que eu arrumei agora.

### **00:20:10** {#00:20:10}

**Andre Felicissimo:** tá? Então,

**Sidnei Felipe Nunes Telles de Almeida:** Eu precisava ver esse negócio das reclamações também que não tá dando certo,

**Andre Felicissimo:** e eu gostei. Não, acho que isso daí também nem é útil.

**Sidnei Felipe Nunes Telles de Almeida:** velho.

**Andre Felicissimo:** A gente tem também tem que focar mais. Não é muita coisa. Se a gente for tentar fazer um pouquinho de tudo para ficar perfeito,

**Sidnei Felipe Nunes Telles de Almeida:** É.

**Andre Felicissimo:** ô, esse negócio que você fez aqui, eu gostei muito, que eu pesquisar, parar, por exemplo, os vigias que eu conseguisse filtrar pelo meu produto também. Ou, por exemplo, eu não sei como como que você você fez o mesmo esquema desse daqui, desses produtos, esse bagulho de busca, não. Ah, você colocou já o preço.

**Sidnei Felipe Nunes Telles de Almeida:** Como assim?

**Andre Felicissimo:** Olhando aqui um minutinho. Foi legal. Bem legal. Esse negócio de buscas que você fez, ó, esse de insides, eu consigo filtrar os produtos pelo pelo meu produto pé, por exemplo. Então,

**Sidnei Felipe Nunes Telles de Almeida:** Isso.

**Andre Felicissimo:** isso que era legal também fazer um vigia. Eu eu acho que na verdade eu acho que o insight está melhor que o VG,

### **00:21:47** {#00:21:47}

**Sidnei Felipe Nunes Telles de Almeida:** Entendi.

**Andre Felicissimo:** obviamente. O

**Sidnei Felipe Nunes Telles de Almeida:** É porque o Insightes já é uma coisa globalzona,

**Andre Felicissimo:** ins

**Sidnei Felipe Nunes Telles de Almeida:** né? Ele já pega de tudo já. A vigia é uma coisa que você vai escolher, você iria escolher manual.

**Andre Felicissimo:** esse rank dos concorrentes.

**Sidnei Felipe Nunes Telles de Almeida:** Esse inseg automático, tipo, para todos os produtos para você,

**Andre Felicissimo:** Sim.

**Sidnei Felipe Nunes Telles de Almeida:** entendeu?

**Andre Felicissimo:** Então, mas aqui,

**Sidnei Felipe Nunes Telles de Almeida:** Essa aqui foi a ideia,

**Andre Felicissimo:** ó, por exemplo, para mim eles são correlacionados tanto o Vigia quanto o Obviamente o Insight tem mais coisas,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** mas esse ranking dos concorrentes seria, eu acho que o Vigia ideal. Pô, tem, obviamente, é legal mostrar foto, mas, por exemplo, no Vigia não tá mostrando valor,

**Sidnei Felipe Nunes Telles de Almeida:** É, então entendi.

**Andre Felicissimo:** entendeu?

**Sidnei Felipe Nunes Telles de Almeida:** Mostrando.

**Andre Felicissimo:** É,

**Sidnei Felipe Nunes Telles de Almeida:** Ele tem que fazer o acompanhamento.

### **00:22:34**

**Sidnei Felipe Nunes Telles de Almeida:** É, então ainda não tá fazendo isso.

**Andre Felicissimo:** e tem o E tem o

**Sidnei Felipe Nunes Telles de Almeida:** O certo era ele fazer o acompanhamento diário desses produtos aí,

**Andre Felicissimo:** S tem e tem o,

**Sidnei Felipe Nunes Telles de Almeida:** tá ligado?

**Andre Felicissimo:** por exemplo, o filtro,

**Sidnei Felipe Nunes Telles de Almeida:** ele v e montar o gráfico.

**Andre Felicissimo:** né? Aqui tem pouco, aqui tem pouco item,

**Sidnei Felipe Nunes Telles de Almeida:** Hã,

**Andre Felicissimo:** mas era legal também ter o filtro de pouco. Coloquei castanha do Pará, ele filtrou todas as castanhas do Pará. No, no a mesma coisa que tem no Insightes. Você colocou,

**Sidnei Felipe Nunes Telles de Almeida:** aonde?

**Andre Felicissimo:** eu seleciono o produto e ele filtra tudo. Olha aí no Insight. Vai lá, desce na tabela, no ranking de produtos. Não tem aí não. Do lado do nome rank de produtos.

**Sidnei Felipe Nunes Telles de Almeida:** Aham.

**Andre Felicissimo:** Eu não sei.

**Sidnei Felipe Nunes Telles de Almeida:** Sim, sim.

**Andre Felicissimo:** Eu seleciono produto na outra. É que aqui tem seis produtos, mas quando tiver 100,

**Sidnei Felipe Nunes Telles de Almeida:** Seis.

### **00:23:18** {#00:23:18}

**Sidnei Felipe Nunes Telles de Almeida:** Não tem bem. Ah, tá,

**Andre Felicissimo:** entendeu?

**Sidnei Felipe Nunes Telles de Almeida:** entendi. No na lista, né,

**Andre Felicissimo:** É na lista que ele tá vigiando.

**Sidnei Felipe Nunes Telles de Almeida:** que você vai marcando favoritos.

**Andre Felicissimo:** É, mas tá excelente isso daqui.

**Sidnei Felipe Nunes Telles de Almeida:** Entendi. Uma busca, né,

**Andre Felicissimo:** Ah,

**Sidnei Felipe Nunes Telles de Almeida:** uma maneira de filtrar e tal.

**Andre Felicissimo:** e colocar as informações, né? O o

**Sidnei Felipe Nunes Telles de Almeida:** preço,

**Andre Felicissimo:** eh tem se tivesse o

**Sidnei Felipe Nunes Telles de Almeida:** os dados do do produto em si, né?

**Andre Felicissimo:** negócio que o pessoal também faz é acessar o perfil do cliente do do vendedor.

**Sidnei Felipe Nunes Telles de Almeida:** Eu consegui configurar também o TikTok, mano. Eu acho que agora vou conseguir também subir os vídeos.

**Andre Felicissimo:** Postar automático.

**Sidnei Felipe Nunes Telles de Almeida:** É,

**Andre Felicissimo:** Legal.

**Sidnei Felipe Nunes Telles de Almeida:** automático. Aí vai ficar bom.

**Andre Felicissimo:** que eu tava pensando, ô C, a gente já tá num passo, já tá quase tudo muito bom de começar.

### **00:24:08** {#00:24:08}

**Andre Felicissimo:** Eu tô vendo muita gente vender por afiliado. a gente já poderia começar na nessas páginas, por exemplo, de vai de signos, vender alguma coisinha afiliado, vender no na página dos produtos naturais, só que isso teria que tá alinhado ao à produção em massa,

**Sidnei Felipe Nunes Telles de Almeida:** Isso é tipo assim,

**Andre Felicissimo:** né, de a

**Sidnei Felipe Nunes Telles de Almeida:** a página de signos.

**Andre Felicissimo:** gente

**Sidnei Felipe Nunes Telles de Almeida:** Agora vou implementar essa parada de responder as DM automático, né? responder os comentários e voltar a postar nela,

**Andre Felicissimo:** tá,

**Sidnei Felipe Nunes Telles de Almeida:** né, que eu dei uma parada,

**Andre Felicissimo:** mas se a gente colocar produzir em massa, que a gente se toma uma estratégia E depois a gente até coloca aquele filtro de acompanhamento,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** a gente, pô, consigo produzir os de você tem o vídeo, produzir vídeos de todos os signos. Aí ele vai fazer lá e vai publicando,

**Sidnei Felipe Nunes Telles de Almeida:** Isso.

**Andre Felicissimo:** a gente nem vai precisar tocar a mão, entendeu? a gente dá uma lista do que a gente quer,

**Sidnei Felipe Nunes Telles de Almeida:** Sim.

**Andre Felicissimo:** ele vai publicando e isso a gente, porque, por exemplo, tudo que a gente testou agora funcionou até na página de de naturais tá funcionando agora porque a gente colocou a mão,

### **00:25:05**

**Sidnei Felipe Nunes Telles de Almeida:** Tá, tá começando a crescer, né?

**Andre Felicissimo:** hã,

**Sidnei Felipe Nunes Telles de Almeida:** Tá começando a crescer,

**Andre Felicissimo:** é tudo que a gente colocou a mão fez e deu uma intenção.

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** Então a gente intencionalizar, pô, esse vídeo funciona, esse vídeo tá muito bom, a gente produz em massa e até outras coisas, por exemplo, vai a eh repercutir notícias, dá pra gente começar a monetizar isso. Eu vi produtos parecidos com o nosso, obviamente nem perto disso. Eu vi um cara que você jogava um vídeo da internet e ele vira transformava em carrossel e o cara vendendo o produto, entendeu? Então acho que a gente já pode setar isso daqui pra gente monetizar de alguma maneira. Ou eu acho que afiliado seria o melhor formato, mas a gente pode tentar formar isso daqui,

**Sidnei Felipe Nunes Telles de Almeida:** afiliado,

**Andre Felicissimo:** deixar.

**Sidnei Felipe Nunes Telles de Almeida:** você fala usar o Instagram, né?

**Andre Felicissimo:** É isso,

**Sidnei Felipe Nunes Telles de Almeida:** Usar o Instagram para converter alguma venda.

**Andre Felicissimo:** isso,

**Sidnei Felipe Nunes Telles de Almeida:** É, eu acho interessante.

**Andre Felicissimo:** isso.

**Sidnei Felipe Nunes Telles de Almeida:** Eu acho que, tipo assim, a página de signos, agora que eu consegui liberar essa parada de responder,

### **00:26:02**

**Andre Felicissimo:** E até mesmo,

**Sidnei Felipe Nunes Telles de Almeida:** porque era era esse o gargalo,

**Andre Felicissimo:** vamos falar assim,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** até mesmo o TikTok Shop,

**Sidnei Felipe Nunes Telles de Almeida:** Esse era o gargalo.

**Andre Felicissimo:** futuramente a gente hã não não

**Sidnei Felipe Nunes Telles de Almeida:** Você fala de signo no TikTok?

**Andre Felicissimo:** tô falando, a gente eh futura, a gente dá até para, por exemplo, produzir em massa e colocar no TikTok shop de de produto X, entendeu?

**Sidnei Felipe Nunes Telles de Almeida:** Sim,

**Andre Felicissimo:** Que não seja o

**Sidnei Felipe Nunes Telles de Almeida:** que esses vídeos não foi postado no TikTok,

**Andre Felicissimo:** nosso.

**Sidnei Felipe Nunes Telles de Almeida:** né? A gente nem sabe qual que vai ser a aceitação, né, desses vídeos de signo também no TikTok.

**Andre Felicissimo:** Sim.

**Sidnei Felipe Nunes Telles de Almeida:** Às vezes bomba mais do que o Instagram, né?

**Andre Felicissimo:** Total, total. Não, vamos falar se a gente falasse de religião,

**Sidnei Felipe Nunes Telles de Almeida:** Vai saber qualquer coisa,

**Andre Felicissimo:** mano, estourar de de mulher, colocar qualquer coisa.

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** Exatamente. Só que a gente precisa alinhar isso de produção em

### **00:26:40** {#00:26:40}

**Sidnei Felipe Nunes Telles de Almeida:** Eu tive uma ideia de vídeos assim para fazer vídeos mais longos

**Andre Felicissimo:** massa.

**Sidnei Felipe Nunes Telles de Almeida:** assim que foi tipo aquele, não sei se você já viu aquele tipo uma hora de Sérgio sacando e falando sobre mistério do buraco negro para dormir.

**Andre Felicissimo:** Nunca vi de A.

**Sidnei Felipe Nunes Telles de Almeida:** É, é aí. Só que é o Sérgio Sacani falando,

**Andre Felicissimo:** Aham.

**Sidnei Felipe Nunes Telles de Almeida:** tipo, é uma hora dele falando sobre mistérios do espaço assim que é para dar

**Andre Felicissimo:** Mano, sabe o que que eu vi? Eu vi um vídeo,

**Sidnei Felipe Nunes Telles de Almeida:** sono do quê?

**Andre Felicissimo:** fui abrir o vídeo naturalzão. Eu fui abrir um vídeo, pô, torne de Santos de não sei que lá. Por que que o Porto de Santos é isso que é? abri o vídeo, eu vi que tinha umas intro de A,

**Sidnei Felipe Nunes Telles de Almeida:** Ага.

**Andre Felicissimo:** vi que a voz era de A, mas eu falei: "Ah, daqui a pouco vai alguém começar a falar: "Mano, mano, 15 minutos do do cara falando de A, não sei quantos mil views, tipo cinco dias postad." Eu f c\*\*\*\*\*\*,

### **00:27:33** {#00:27:33}

**Andre Felicissimo:** mano, o res é muito legal que a gente consegue fazer em massa,

**Sidnei Felipe Nunes Telles de Almeida:** Угуm.

**Andre Felicissimo:** né? Mas a gente acertando, por exemplo, a gente pega os termos de busca mais buscado e faz vídeos dele, mano. Tipo, ah, por que que você não deve tomar o Zen Pque? Ah, por que que meu namorado não me ama? É tipo os bagulhos, tipo, pegar os termos de busca mesmo, isso daí é cauda longa,

**Sidnei Felipe Nunes Telles de Almeida:** Ага.

**Andre Felicissimo:** né? A dá visualização, vai não vai dar tanto no começo, mas e ele roda muito, né?

**Sidnei Felipe Nunes Telles de Almeida:** Sim,

**Andre Felicissimo:** É um termo de busca

**Sidnei Felipe Nunes Telles de Almeida:** a parada do a página lá de Natural Feeding já tá conectada,

**Andre Felicissimo:** de

**Sidnei Felipe Nunes Telles de Almeida:** mano. Já conectou com Já tá tudo pronto. Tipo assim, mandar mensagem para ela, ela já redireciona pro Mercado Livre.

**Andre Felicissimo:** legal.

**Sidnei Felipe Nunes Telles de Almeida:** Se alguém mandar mensagem lá no

**Andre Felicissimo:** Então isso também eu até pensei,

**Sidnei Felipe Nunes Telles de Almeida:** na

**Andre Felicissimo:** a gente tá criando um canal de de mídia, mano.

### **00:28:29** {#00:28:29}

**Andre Felicissimo:** Poderia ter, tipo,

**Sidnei Felipe Nunes Telles de Almeida:** É.

**Andre Felicissimo:** só achar dinos da Shopee, bagulho de promoção, entendeu? Promoção da Shopee, promoção do Mercado Livre.

**Sidnei Felipe Nunes Telles de Almeida:** Ah, você fala fazer outras páginas dark do Instagram em outros

**Andre Felicissimo:** Então, qual qual a gente tem que,

**Sidnei Felipe Nunes Telles de Almeida:** nichos.

**Andre Felicissimo:** obviamente a gente não vai escolher um o modelo que a gente vai ganhar dinheiro nisso,

**Sidnei Felipe Nunes Telles de Almeida:** Tem que ter um método.

**Andre Felicissimo:** mas a gente pode testar, a gente pode vender esse produto, essa essa plataforma, a gente pode vender acompanhamento do Mercado Livre, a gente pode vender infoproduto,

**Sidnei Felipe Nunes Telles de Almeida:** Cara,

**Andre Felicissimo:** afiliado, só que tá faltando a gente testar, eu acho.

**Sidnei Felipe Nunes Telles de Almeida:** é, eu acho que tá faltando setar um cronograma,

**Andre Felicissimo:** a gente colocar a, por exemplo, meu amigo,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** eh,

**Sidnei Felipe Nunes Telles de Almeida:** Que tá faltando,

**Andre Felicissimo:** meu amigo falou:

**Sidnei Felipe Nunes Telles de Almeida:** eu acho que é setar um cronograma certinho,

**Andre Felicissimo:** "Por que que vocês não vende um eh vão fazer isso?"

### **00:29:11**

**Sidnei Felipe Nunes Telles de Almeida:** fazer, ó, semana um vamos fazer tal coisa, semana dois vai ser tal coisa,

**Andre Felicissimo:** Exatamente. É, exatamente.

**Sidnei Felipe Nunes Telles de Almeida:** porque senão fica, igual você tá falando,

**Andre Felicissimo:** É,

**Sidnei Felipe Nunes Telles de Almeida:** muito disperso, né?

**Andre Felicissimo:** é. E a gente não termina nada.

**Sidnei Felipe Nunes Telles de Almeida:** vários projetinhos assim separado que não tem um e nenhum finaliza,

**Andre Felicissimo:** É, fim. É, a gente vai ter,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** vai ficar um produto maravilhoso que a gente nunca testou

**Sidnei Felipe Nunes Telles de Almeida:** Sim,

**Andre Felicissimo:** efetivamente.

**Sidnei Felipe Nunes Telles de Almeida:** eu acho que o foco é esse agora, né? Tipo assim, eh, essa parte da produção de vídeos em massa, acho que tá rolando já. Tem algumas coisinhas para arrumar,

**Andre Felicissimo:** Tá. E que e que onde seria nessa produção em massa mesmo?

**Sidnei Felipe Nunes Telles de Almeida:** mas Oi. É, então é que eu fiz um teste agora,

**Andre Felicissimo:** Como que seria essa?

**Sidnei Felipe Nunes Telles de Almeida:** ele deu erro. Eu não sei, não porque às vezes dá uns bugzinho no N8N, mas eu fiz uma lista, fiz tipo assim, ah, você pega, você escolhe, né, o preset, né, tipo aquele do, tipo esse aqui,

### **00:30:02** {#00:30:02}

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** ó, fazer fazer um vídeo para cada,

**Andre Felicissimo:** Ah, no mesmo formato, né,

**Sidnei Felipe Nunes Telles de Almeida:** vamos ver se é aí ele vai ele vai criar a lista,

**Andre Felicissimo:** chat?

**Sidnei Felipe Nunes Telles de Almeida:** né? né? Vai criar uma lista de

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** temas.

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** Essa era a ideia. E aí, mas deixa eu ver se vai funcionar porque ele não tava funcionando, velho. Agora a pouco. Eu acho que ainda tá dando bug no

**Andre Felicissimo:** E eu tava pensando como a gente ter vendendo esse produto, como que você acha que essa estrutura funciona do mesmo jeito?

**Sidnei Felipe Nunes Telles de Almeida:** Como assim?

**Andre Felicissimo:** Por exemplo, eu quero dar para alguém, por exemplo, eh, eu quero lá pro cara do da igreja fazer vídeo dele. Como que ele faria os vídeos dele?

**Sidnei Felipe Nunes Telles de Almeida:** Ah,

**Andre Felicissimo:** Ele teria um login?

**Sidnei Felipe Nunes Telles de Almeida:** do mesmo jeito. Do mesmo jeito.

### **00:31:01**

**Andre Felicissimo:** Então, eles teriam um login,

**Sidnei Felipe Nunes Telles de Almeida:** Isso aí ele ia vir, só que ele não ia ter essa parte dos produtos,

**Andre Felicissimo:** não? Sim,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** sim. Mas eu tô falando amanhã que que eu falei assim, pô, amanhã você vai produzir os vídeos. Ele ia fazer um login dele, não ia até a parte de de produto, ele ia conseguir fazer os vídeos dele rodar,

**Sidnei Felipe Nunes Telles de Almeida:** conseguia normal. Daí ia vir aqui e tal no no estúdio,

**Andre Felicissimo:** tá?

**Sidnei Felipe Nunes Telles de Almeida:** né? Ia falar aqui, fazer um vídeo, ia falar com escolher a conta dele que ele quer

**Andre Felicissimo:** Tá. E por exemplo,

**Sidnei Felipe Nunes Telles de Almeida:** postar.

**Andre Felicissimo:** é exatamente, você acha que você conseguiria tirar esses acessos que a gente, por exemplo, a área do Mercado Livre não é uma área que serviria para essa pessoa.

**Sidnei Felipe Nunes Telles de Almeida:** Não consigo,

**Andre Felicissimo:** Tá separado isso,

**Sidnei Felipe Nunes Telles de Almeida:** consigo. Dá,

**Andre Felicissimo:** mas tá separado.

**Sidnei Felipe Nunes Telles de Almeida:** dá para fazer pelo acesso,

### **00:31:46**

**Andre Felicissimo:** Ah,

**Sidnei Felipe Nunes Telles de Almeida:** pelo próprio acesso, assim, pelo próprio e-mail da pessoa, né?

**Andre Felicissimo:** não, não, eu tô falando,

**Sidnei Felipe Nunes Telles de Almeida:** Ia ter partes do site que ia tá disponível ou não.

**Andre Felicissimo:** mas a a são todas estruturas separadas, né? Não tá tudo,

**Sidnei Felipe Nunes Telles de Almeida:** Oi.

**Andre Felicissimo:** são todas estruturas separadas que você fez,

**Sidnei Felipe Nunes Telles de Almeida:** É, são páginas,

**Andre Felicissimo:** por exemplo,

**Sidnei Felipe Nunes Telles de Almeida:** né? páginas

**Andre Felicissimo:** não, por exemplo, Mercado Livre. Mercado Livre tem um login do Mercado Livre,

**Sidnei Felipe Nunes Telles de Almeida:** dentro.

**Andre Felicissimo:** tem algumas coisas do Mercado Livre, ele tá separado do login da dos Instagrams, por exemplo, da API dos Instagrams,

**Sidnei Felipe Nunes Telles de Almeida:** Como assim separado? Não entendi dizer com

**Andre Felicissimo:** por exemplo, vamos falar assim, ó. Vamos falar assim, não é uma pasta que tá tipo,

**Sidnei Felipe Nunes Telles de Almeida:** isso.

**Andre Felicissimo:** pô, logindo chaves APIs, todas chaves

**Sidnei Felipe Nunes Telles de Almeida:** Ah, sim. Não,

### **00:32:24**

**Andre Felicissimo:** APIs.

**Sidnei Felipe Nunes Telles de Almeida:** tá sim. tá no tipo assim, é um é um arquivo secreto, né? Um arquivo de ambiente que fala aonde tá todas as chaves ali.

**Andre Felicissimo:** Tá? Então, porque eu tô pensando nisso,

**Sidnei Felipe Nunes Telles de Almeida:** Se fosse para tipo se fosse para se fosse para uma outra loja

**Andre Felicissimo:** eh, é, então é isso que eu tô pensando, porque, por exemplo,

**Sidnei Felipe Nunes Telles de Almeida:** aí.

**Andre Felicissimo:** a gente tem, obviamente, tá um produto, ninguém tem o modelo que a gente tá fazendo, mas a gente tá pensando no Mercado Livre,

**Sidnei Felipe Nunes Telles de Almeida:** Aham.

**Andre Felicissimo:** na produção de vídeo e no posto automático. Eu acho que isso daí

**Sidnei Felipe Nunes Telles de Almeida:** É, não, tipo assim, se fosse para comercializar para para um outro cliente,

**Andre Felicissimo:** sim,

**Sidnei Felipe Nunes Telles de Almeida:** eu teria que fazer um teria que adaptar o sistema. Não tá pronto ainda para receber outros clientes ainda.

**Andre Felicissimo:** tá?

**Sidnei Felipe Nunes Telles de Almeida:** Isso aí você tem razão.

**Andre Felicissimo:** É isso que Mas você,

**Sidnei Felipe Nunes Telles de Almeida:** Teria que preparar para vou poder entregar uma parada com

### **00:33:13**

**Andre Felicissimo:** por exemplo,

**Sidnei Felipe Nunes Telles de Almeida:** segurança.

**Andre Felicissimo:** mas a você acha que você mexeria toda a estrutura ou não?

**Sidnei Felipe Nunes Telles de Almeida:** Não, não seria toda a estrutura,

**Andre Felicissimo:** Não tem muita coisa feita já,

**Sidnei Felipe Nunes Telles de Almeida:** né? Tem muita,

**Andre Felicissimo:** mas por

**Sidnei Felipe Nunes Telles de Almeida:** tem muita coisa que não vai mexer.

**Andre Felicissimo:** exemplo,

**Sidnei Felipe Nunes Telles de Almeida:** Seria só, só essa questão da separação mesmo, né? Igual você tá falando, separação dos do fatores. Para,

**Andre Felicissimo:** tá sim.

**Sidnei Felipe Nunes Telles de Almeida:** para um cliente tem acesso a tal coisa, outro cliente tem acesso a outra coisa.

**Andre Felicissimo:** Eu acho que eu acho que era legal a gente colocar, a gente pode até sentar e fazer um cronograma do que que a gente vai fazer em relação a isso,

**Sidnei Felipe Nunes Telles de Almeida:** Eu acho interessante,

**Andre Felicissimo:** mas a gente sentar e fazer fal assim,

**Sidnei Felipe Nunes Telles de Almeida:** velho.

**Andre Felicissimo:** pô, isso é esse é um produto que a gente acredita.

**Sidnei Felipe Nunes Telles de Almeida:** Eu

**Andre Felicissimo:** Obviamente a gente pode ter essa estrutura pra gente, mas pô, esse é um produto que a gente acha que faz sentido.

### **00:33:52** {#00:33:52}

**Andre Felicissimo:** E a gente até começar a anunciar,

**Sidnei Felipe Nunes Telles de Almeida:** até trabalho melhor datas,

**Andre Felicissimo:** deixar a gente testar, ver os bugs que

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** tem.

**Sidnei Felipe Nunes Telles de Almeida:** É, então eu até trabalho melhor assim com datas assim, né? Com tipo deadline,

**Andre Felicissimo:** Sim,

**Sidnei Felipe Nunes Telles de Almeida:** né? É bom,

**Andre Felicissimo:** sim.

**Sidnei Felipe Nunes Telles de Almeida:** tipo, ó, tem até tal dia para finalizar tal coisa,

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** que assim consigo até manter o foco,

**Andre Felicissimo:** É perfeito.

**Sidnei Felipe Nunes Telles de Almeida:** né? Também.

**Andre Felicissimo:** Eia te falar mais alguma coisa?

**Sidnei Felipe Nunes Telles de Almeida:** Mas estamos avançando, velho. p\*\*\*\*,

**Andre Felicissimo:** Não, tá muito bom.

**Sidnei Felipe Nunes Telles de Almeida:** fiquei feliz com esse bagulho do do Instagram que,

**Andre Felicissimo:** Só que a gente vai colocar isso para rodar.

**Sidnei Felipe Nunes Telles de Almeida:** tipo assim, agora tá rolando, né? Então, manda mensagem, o bagulho responde sozinho, né, velho?

### **00:34:29** {#00:34:29}

**Andre Felicissimo:** E e responde bem.

**Sidnei Felipe Nunes Telles de Almeida:** Viemos,

**Andre Felicissimo:** Você você testou outras coisas? Ah, não gostei outro.

**Sidnei Felipe Nunes Telles de Almeida:** viamos no século XX.

**Andre Felicissimo:** Hã,

**Sidnei Felipe Nunes Telles de Almeida:** Entramos no século XX.

**Andre Felicissimo:** não, tá bonito demais isso. Dá daí várias coisas muito bem feitas, né?

**Sidnei Felipe Nunes Telles de Almeida:** É, não,

**Andre Felicissimo:** Muito bem estruturas.

**Sidnei Felipe Nunes Telles de Almeida:** ainda não testei muita coisa não, para falar a verdade, eu tava mais fazendo ele funcionar mesmo.

**Andre Felicissimo:** Não, não, só para ter uma ideia, tipo, é, é a que responde, né? Não é legal.

**Sidnei Felipe Nunes Telles de Almeida:** É, você tá vendo aí minha tela? É esse fluxo aqui, ó. Ele ele só tem um ele tem só uma uma

**Andre Felicissimo:** Тога

**Sidnei Felipe Nunes Telles de Almeida:** ferramentinha simples que busca os seus produtos. Aqui, ó, o link, né, do, ó, ID e tal. Daí ele retorna o link, o preço e o nome do produto. E aí, tipo, é o chat GPT, o GPT 4O.

### **00:35:23**

**Andre Felicissimo:** Mas tem a instrução dele também,

**Sidnei Felipe Nunes Telles de Almeida:** É, aí tem instrução, ó.

**Andre Felicissimo:** né?

**Sidnei Felipe Nunes Telles de Almeida:** Você é o assistente virtual. Aí sempre que o cliente perguntar, você tem que buscar o produto na tabela e mandar o link.

**Andre Felicissimo:** Ah, legal, legal.

**Sidnei Felipe Nunes Telles de Almeida:** E só bem simples que era o

**Andre Felicissimo:** Mas você então aí você mandou isso, eu já falei, pô, isso daí dá muito para fazer,

**Sidnei Felipe Nunes Telles de Almeida:** que

**Andre Felicissimo:** tipo, a pessoa comenta, falei, comenta, eu quero que eu te mando o link no WhatsApp, no direct.

**Sidnei Felipe Nunes Telles de Almeida:** DM. É.

**Andre Felicissimo:** Só que a gente precisa, a gente precisa de ferramentas para testar isso, né?

**Sidnei Felipe Nunes Telles de Almeida:** E aí, tipo assim, como ele tem acesso à tabela dos produtos,

**Andre Felicissimo:** Isso.

**Sidnei Felipe Nunes Telles de Almeida:** se for, por exemplo, ele não vai alucinar. Se for igual a gente faz o vídeo lá do camu, não tem kamu camu,

**Andre Felicissimo:** Uhum.

**Sidnei Felipe Nunes Telles de Almeida:** mas ele vai falar:

### **00:36:06** {#00:36:06}

**Andre Felicissimo:** Sim,

**Sidnei Felipe Nunes Telles de Almeida:** "Ah, tipo assim,

**Andre Felicissimo:** sim.

**Sidnei Felipe Nunes Telles de Almeida:** a gente não infelizmente não tem esse produto, né?

**Andre Felicissimo:** Não, mas por exemplo,

**Sidnei Felipe Nunes Telles de Almeida:** Mas você pode pesquisar outras coisas,

**Andre Felicissimo:** a gente nem precisa ter, a gente nem precisa ter, porque a gente pode jogar de afiliado no Mercado Livre,

**Sidnei Felipe Nunes Telles de Almeida:** tal".

**Andre Felicissimo:** entendeu?

**Sidnei Felipe Nunes Telles de Almeida:** Ah, outras páginas,

**Andre Felicissimo:** É, entendeu?

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** A gente não precisa vender só produto natural. Se isso funcionar, é isso que eu tô falando, a gente não sabe qual o caminho que vai funcionar primeiro.

**Sidnei Felipe Nunes Telles de Almeida:** Ah, você já tá,

**Andre Felicissimo:** A gente pode ver já,

**Sidnei Felipe Nunes Telles de Almeida:** você já tá você já tá pensando, expandindo as

**Andre Felicissimo:** c\*\*\*\*\*\*. A gente tem que fazer, p\*\*\*\*. Dá para fazer tudo isso. Eh,

**Sidnei Felipe Nunes Telles de Almeida:** possibilidades.

**Andre Felicissimo:** a gente não sabe qual que é o caminho que vai funcionar, se é afiliado, se é vender o o uso do produto. Mas eu acho que, pô, dá para testar isso daí testando, entendeu?

### **00:36:49**

**Sidnei Felipe Nunes Telles de Almeida:** Você está múltiplas front,

**Andre Felicissimo:** É muita.

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** É, e todas podem dar dinheiro no final das contas ou nenhuma, apenas uma, mas isso a gente só vai saber com teste.

**Sidnei Felipe Nunes Telles de Almeida:** Aham.

**Andre Felicissimo:** Aí, ó. Aí que eu acho que o deadline número um seria a produção de conteúdo em massa. Aí depois,

**Sidnei Felipe Nunes Telles de Almeida:** Tá.

**Andre Felicissimo:** eh, login de acessos separados. Aí depois a gente vai citando as outras coisas,

**Sidnei Felipe Nunes Telles de Almeida:** Uhum.

**Andre Felicissimo:** mas acho que a primeira coisa seria a produção de de vídeo em massa, que aí isso já alavancaria a nossa página,

**Sidnei Felipe Nunes Telles de Almeida:** É,

**Andre Felicissimo:** todas elas, entendeu? E a gente já ia

**Sidnei Felipe Nunes Telles de Almeida:** é tipo assim, seria o fluxo, o fluxo completo,

**Andre Felicissimo:** colocar,

**Sidnei Felipe Nunes Telles de Almeida:** não só a produção de vídeo em massa, mas o fluxo de venda, né? Você a fluxo de venda total, que é a produção do conteúdo, a postagem e responder automaticamente, né,

**Andre Felicissimo:** é, eu acho que responder até um passo dois,

### **00:37:38**

**Sidnei Felipe Nunes Telles de Almeida:** os comentários de DM.

**Andre Felicissimo:** mas por exemplo que colocar o link, primeiro passo, a gente precisa fazer as páginas, a gente não ter o trabalho de acompanhar essas páginas, ficar postando, pedindo vídeo diariamente, porque Aí no momento que a gente, pô, a página tá com 10.000 seguidores, mano, a gente tem que vender alguma coisa nessa página. Não precisa ficar vendendo a partir do dia um. Pode ser, mas a gente precisa ter um canal de mídia pra gente,

**Sidnei Felipe Nunes Telles de Almeida:** Ah,

**Andre Felicissimo:** pô, pô, já tava, já tá muita gente. Que que a gente vai fazer agora? Precisa vender para essas pessoas,

**Sidnei Felipe Nunes Telles de Almeida:** sim.

**Andre Felicissimo:** arrumar um problema pra gente achar a solução.

**Sidnei Felipe Nunes Telles de Almeida:** É, já vai criando problema antes,

**Andre Felicissimo:** Eh, não, isso eu tenho certeza. A gente pode já deixar a estrutura montada,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** mas eu falei, você resolveu o produção de conteúdo em massa? Pô, resolveu. Vamos cuidar disso. Como que a gente vai vender para essas pessoas agora? Entendeu?

### **00:38:33** {#00:38:33}

**Andre Felicissimo:** Aí, ô, eu acho que nem seria passo dois,

**Sidnei Felipe Nunes Telles de Almeida:** Sim.

**Andre Felicissimo:** né? Mas em paralelo, login das pessoas, pra gente já tentar comercializar essa plataforma de de fazer vídeo para as outras pessoas, vê se a estrutura funciona, vê se vai ter problema.

**Sidnei Felipe Nunes Telles de Almeida:** é que é, na verdade, essa plataforma é um bizão monstro, né?

**Andre Felicissimo:** Sim,

**Sidnei Felipe Nunes Telles de Almeida:** E aí dá para dá para dá para vender ela inteira ou vender

**Andre Felicissimo:** é fazer módulos, né? Tipo, não,

**Sidnei Felipe Nunes Telles de Almeida:** algumas

**Andre Felicissimo:** mas é, por exemplo, eu acho que isso do Mercado Livre é muito complexo e eu acho que seria um produto à parte até

**Sidnei Felipe Nunes Telles de Almeida:** partes.

**Andre Felicissimo:** acompanhamento de preço do Mercado Livre, entendeu? Nenhum sistema faz, pô, vamos exagerar, pô. Você tem um acompanhamento de preços dos produtos, o cara vai apitar no WhatsApp do cara, pô, eh, seu concorrente abaixou o preço,

**Sidnei Felipe Nunes Telles de Almeida:** No Telegram, né?

**Andre Felicissimo:** é no Telegram, no é nem apita, entendeu? Mas é um um produto daria para vender só esse, vamos falar 50, mano, mês,

### **00:39:35**

**Sidnei Felipe Nunes Telles de Almeida:** Sim.

**Andre Felicissimo:** entendeu? Preparado. Dá para não precisa vender essa moto.

**Sidnei Felipe Nunes Telles de Almeida:** Ah, tem que ser uns 300, né?

**Andre Felicissimo:** Hã,

**Sidnei Felipe Nunes Telles de Almeida:** Tem que ser uns

**Andre Felicissimo:** não. Sim, mas eu tô falando, pô, no produto só faz isso,

**Sidnei Felipe Nunes Telles de Almeida:** 300\.

**Andre Felicissimo:** só fala se aumentou o preço ou não.

**Sidnei Felipe Nunes Telles de Almeida:** É, mas mas tipo assim, é um produto igual aquele que você usa também, né? Como é que é o nome?

**Andre Felicissimo:** Nubim, mas no bimmet não me avisa,

**Sidnei Felipe Nunes Telles de Almeida:** Nubimetrix.

**Andre Felicissimo:** eu tenho que acessar lá,

**Sidnei Felipe Nunes Telles de Almeida:** Não,

**Andre Felicissimo:** pesquisar.

**Sidnei Felipe Nunes Telles de Almeida:** mas lá qual que é o preço aí,

**Andre Felicissimo:** é R$ 2.000 anual,

**Sidnei Felipe Nunes Telles de Almeida:** ó?

**Andre Felicissimo:** mas ele me dá muitos mais dados, né? Ele faz aquele quanto que a pessoa vendeu no dia. Mas então,

**Sidnei Felipe Nunes Telles de Almeida:** É,

### **00:40:12** {#00:40:12}

**Andre Felicissimo:** mas é uma maneira de gente atingir, por exemplo, esse produto, eu acho que a gente atinge um cara grande. Tem produtos que a gente pode atingir caras pequenos.

**Sidnei Felipe Nunes Telles de Almeida:** sim.

**Andre Felicissimo:** Pode ser um isso tudo, pode ser um produto grande como pode não ser, a gente precisa testar, né?

**Sidnei Felipe Nunes Telles de Almeida:** Tá,

**Andre Felicissimo:** Você quer já pensar em alguma coisa de a gente qual

**Sidnei Felipe Nunes Telles de Almeida:** entendi. Eu acho que sim.

**Andre Felicissimo:** que seria o passo?

**Sidnei Felipe Nunes Telles de Almeida:** Acho que já é o momento da gente começar a meio que empacotar,

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** né,

**Andre Felicissimo:** Uhum.

**Sidnei Felipe Nunes Telles de Almeida:** em produtos assim que a gente consiga comercializar e separar.

**Andre Felicissimo:** Ah, eu acho que, por exemplo, o estúdio de eu tava pensando o processamento de do áudios e

**Sidnei Felipe Nunes Telles de Almeida:** Eh,

**Andre Felicissimo:** de imagens não é na nossa máquina, não é? É via PI, máquina da do da IA, não é?

**Sidnei Felipe Nunes Telles de Almeida:** sim.

**Andre Felicissimo:** Não daria para você pedir paraas três automaticamente em vez de processar uma, depois processar outra, depois processar outra.

### **00:41:08**

**Andre Felicissimo:** a cena que,

**Sidnei Felipe Nunes Telles de Almeida:** Como assim?

**Andre Felicissimo:** por exemplo, quando você quando você setou o o roteiro, ele primeiro processa a primeira imagem, primeiro áudio, depois ele vai pra segunda imagem, segundo áudio.

**Sidnei Felipe Nunes Telles de Almeida:** Não, ele dispara tipo as as nove imagens, depois ele dispara os nove áudios, aí depois ele vai renderizando uma por uma. Mas é também porque senão muita carga, né?

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** Tipo, o servidor que a gente pegou também não é tão bom para ele renderizar tudo ao mesmo tempo.

**Andre Felicissimo:** É, e eu acho que, por exemplo,

**Sidnei Felipe Nunes Telles de Almeida:** Então eu fiz isso para ele poder,

**Andre Felicissimo:** se a gente for fazer e quanto que a gente paga 50,

**Sidnei Felipe Nunes Telles de Almeida:** tipo, balancear a carga, né?

**Andre Felicissimo:** R$ 100 de do negócio,

**Sidnei Felipe Nunes Telles de Almeida:** É, tá dando sem mango, porque são dois servidores que tá que tá rodando.

**Andre Felicissimo:** tá?

**Sidnei Felipe Nunes Telles de Almeida:** Um que é só o N8N, que é o que faz os vídeos,

**Andre Felicissimo:** Isso,

**Sidnei Felipe Nunes Telles de Almeida:** que é só do NN e o outro é onde tá o blog e o esse front end, esse painel,

### **00:42:08**

**Andre Felicissimo:** tá?

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** E se a gente melhorasse o servidor, melhoraria a velocidade disso e a

**Sidnei Felipe Nunes Telles de Almeida:** É, só precisaria, na verdade,

**Andre Felicissimo:** capacidade?

**Sidnei Felipe Nunes Telles de Almeida:** por enquanto, só precisaria mexer no N8N para ele renderizar os vídeos mais rápido. Você fala:

**Andre Felicissimo:** É,

**Sidnei Felipe Nunes Telles de Almeida:** "Mas você acha que tá muito lento?" tinha que ser instantâneo.

**Andre Felicissimo:** acho como produto. Sim. Não instantâneo.

**Sidnei Felipe Nunes Telles de Almeida:** Então,

**Andre Felicissimo:** Instantâneo acho que vai ser difícil a gente chegar, mas não 2 minutos, tipo 15 segundos. Gente,

**Sidnei Felipe Nunes Telles de Almeida:** para renderizar um vídeo.

**Andre Felicissimo:** é, não, não, é, não renderizar,

**Sidnei Felipe Nunes Telles de Almeida:** É.

**Andre Felicissimo:** mas tipo, mano, a imagem já tem que tá lá, o vídeo já tem que tá lá e a pessoa tá pronta para não é, não quero ficar esperando processar. A gente tá, a gente é 4.0, né? Não dá para ficar esperando nada.

**Sidnei Felipe Nunes Telles de Almeida:** Entendi. Você não dá,

### **00:42:58**

**Andre Felicissimo:** Ainda mais e ainda mais na tela.

**Sidnei Felipe Nunes Telles de Almeida:** dá para fazer assim,

**Andre Felicissimo:** Tem que ser um bagulho que eu consigo sair da tela.

**Sidnei Felipe Nunes Telles de Almeida:** algumas coisas demora, porque tipo assim, ó, por exemplo, a imagem, a imagem tem um gargalo, o que é a gente manda para uma outra PI que gera a imagem, né? Tipo, o N8 não é a nossa máquina local que gera o a imagem,

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** né? Então, na verdade, a gente faz uma request pro replicate, o replicate faz uma request pro Google e aí devolve a imagem pro replicate que devolve pra gente, né? Então, tem um pouco desse gargalo

**Andre Felicissimo:** Tá. Mas, por exemplo,

**Sidnei Felipe Nunes Telles de Almeida:** assim.

**Andre Felicissimo:** entendi isso, eu entendi. Não tem outros gargalos, por exemplo, a legenda não é a renderização é rápido, seria rápida se a gente mudasse alguma

**Sidnei Felipe Nunes Telles de Almeida:** Isso aíó, só o que vai mudar mesmo é a renderização,

**Andre Felicissimo:** coisa.

**Sidnei Felipe Nunes Telles de Almeida:** né? Renderização do vídeo, do das cenas e do vídeo final.

### **00:43:52**

**Sidnei Felipe Nunes Telles de Almeida:** Isso muda,

**Andre Felicissimo:** Tá,

**Sidnei Felipe Nunes Telles de Almeida:** isso mudaria sim, aumenta, aceleraria, mas de qualquer jeito tem alguns gargalinhos aí que é,

**Andre Felicissimo:** tá,

**Sidnei Felipe Nunes Telles de Almeida:** né, da própria PI,

**Andre Felicissimo:** tá. Entendi. Entendi.

**Sidnei Felipe Nunes Telles de Almeida:** mas dá, pô, dá para pegar uma máquina mais rápida e fazer o teste, porque lá também eh paga por dia, né? Então, tipo, dá para,

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** se quiser amanhã eu pego uma máquina mais rápida, a gente faz um teste lá, se vê que deu diferença mesmo real,

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** a gente

**Andre Felicissimo:** E e para e por exemplo, se a gente tivesse outros,

**Sidnei Felipe Nunes Telles de Almeida:** consegue,

**Andre Felicissimo:** temos arrumei três clientes, a gente conseguiria processar as os vídeos deles ao mesmo momento? Mas que tá,

**Sidnei Felipe Nunes Telles de Almeida:** já tá fazendo assim.

**Andre Felicissimo:** mas seria um fluxo diferente.

**Sidnei Felipe Nunes Telles de Almeida:** Aí vai ter uma fila, né? vai ter uma fila, tipo assim,

**Andre Felicissimo:** Hã,

### **00:44:40** {#00:44:40}

**Sidnei Felipe Nunes Telles de Almeida:** teria que implementar um sistema para, por exemplo, não crashar o servidor, né, digamos, imagina ele se se ele tomar toda

**Andre Felicissimo:** mas eu acho que a gente tá pagando R$ 100 mês. Eu acho que daí, por exemplo,

**Sidnei Felipe Nunes Telles de Almeida:** é

**Andre Felicissimo:** poderia aumentar muito, daí não é um custo. Esse é, eu acho que é o que principalmente faria diferença.

**Sidnei Felipe Nunes Telles de Almeida:** Ah, sim, mano. Então,

**Andre Felicissimo:** Vê,

**Sidnei Felipe Nunes Telles de Almeida:** dá para escalar infinito, velho.

**Andre Felicissimo:** tá,

**Sidnei Felipe Nunes Telles de Almeida:** Uma nuvem dá para escalar infinito.

**Andre Felicissimo:** tá legal.

**Sidnei Felipe Nunes Telles de Almeida:** Não tem Isso aí, não é o problema.

**Andre Felicissimo:** Tá? Então acho que alinhar isso de Ah, vê aí o se respondeu a produção, a lista de Tá,

**Sidnei Felipe Nunes Telles de Almeida:** Não deu erro, velho. Preciso ver

**Andre Felicissimo:** acho que a primeira coisa seria isso pra gente testar a gente e depois for

**Sidnei Felipe Nunes Telles de Almeida:** aqui.

**Andre Felicissimo:** tentar separar essas fazer a não

**Sidnei Felipe Nunes Telles de Almeida:** É, vamos fazer

### **00:45:30** {#00:45:30}

**Andre Felicissimo:** só a lista como a produção. Pô,

**Sidnei Felipe Nunes Telles de Almeida:** funcionar.

**Andre Felicissimo:** já vai produzir um em sequência do outro. E depois a gente separar esses produtos, porque eu acho que já dá, do jeito que tá, acho que a gente já consegue comercializar alguma coisa, entendeu?

**Sidnei Felipe Nunes Telles de Almeida:** Tá legal. Eu também acho,

**Andre Felicissimo:** E como que funcionaria? E como que funcionaria a cobrança disso?

**Sidnei Felipe Nunes Telles de Almeida:** velho.

**Andre Felicissimo:** Você acha que você consegue medir?

**Sidnei Felipe Nunes Telles de Almeida:** Por créditos, né? fazer um sistema de crédito.

**Andre Felicissimo:** Mas você acha que é fácil?

**Sidnei Felipe Nunes Telles de Almeida:** Ah, é, é, é tranquilo,

**Andre Felicissimo:** É.

**Sidnei Felipe Nunes Telles de Almeida:** tranquilo.

**Andre Felicissimo:** E aí acho que para isso a gente precetar quanto que quanto que a

**Sidnei Felipe Nunes Telles de Almeida:** O, cada imagem é um tanto de crédito,

**Andre Felicissimo:** gente

**Sidnei Felipe Nunes Telles de Almeida:** cada segundo de áudio um tanto de crédito. Para renderizar o vídeo, cobra,

**Andre Felicissimo:** tá já tá é

**Sidnei Felipe Nunes Telles de Almeida:** sei lá, um valor, um valor fixo lá, sei lá, né?

### **00:46:19**

**Andre Felicissimo:** até até embutido no na na mensalidade da pessoa.

**Sidnei Felipe Nunes Telles de Almeida:** Geralmente eles cobram por segundo de processamento, né?

**Andre Felicissimo:** E quanto que você tem ideia de quanto que é pra gente produzir um vídeo?

**Sidnei Felipe Nunes Telles de Almeida:** Quanto custa?

**Andre Felicissimo:** É,

**Sidnei Felipe Nunes Telles de Almeida:** Ah, mano, é baratinho. Acho que são uns R$ 4, R$ 5\.

**Andre Felicissimo:** o vídeo não deve ser mesmo,

**Sidnei Felipe Nunes Telles de Almeida:** É o menos.

**Andre Felicissimo:** pô. A gente produziu uma centena de vídeos.

**Sidnei Felipe Nunes Telles de Almeida:** Ah,

**Andre Felicissimo:** Dá uma olhadinha nisso.

**Sidnei Felipe Nunes Telles de Almeida:** velho, eu vou vou ver certinho.

**Andre Felicissimo:** Dá uma olhadinha.

**Sidnei Felipe Nunes Telles de Almeida:** Pode falar o valor certo melhor.

**Andre Felicissimo:** Dá uma olhadinha nisso.

**Sidnei Felipe Nunes Telles de Almeida:** É para ver quanto que sai

**Andre Felicissimo:** Então, acho que primeiro passo para pros próximos dias esquecer um pouco o

**Sidnei Felipe Nunes Telles de Almeida:** exato.

**Andre Felicissimo:** resto e dar uma focada nessa produção em da lista e de produção em massa. Aí pode aumentar o o processamento o a máquina na

### **00:47:03**

**Sidnei Felipe Nunes Telles de Almeida:** Tá

**Andre Felicissimo:** nuvem pra gente ver se melhora também a velocidade.

**Sidnei Felipe Nunes Telles de Almeida:** focar a publicação, né? Tipo criação e para publicar tudo, né? já agendar e publicando,

**Andre Felicissimo:** Isso,

**Sidnei Felipe Nunes Telles de Almeida:** fazendo um sistema aqui que já faz

**Andre Felicissimo:** isso. fizesse automático isso.

**Sidnei Felipe Nunes Telles de Almeida:** automático. Ué, o webhook mudou? Não, mudou nada. E o TikTok tá vendendo bem?

**Andre Felicissimo:** Ah, eu tava fazendo eh tava fazendo impulsionando, só que eu coloquei como eu coloquei até para m para fazer vídeo,

**Sidnei Felipe Nunes Telles de Almeida:** Eu

**Andre Felicissimo:** coloquei umas blogueiras, não sei se chegou a ver também.

**Sidnei Felipe Nunes Telles de Almeida:** vi uma loirinha lá.

**Andre Felicissimo:** É,

**Sidnei Felipe Nunes Telles de Almeida:** Acabou de chegar o meu quiabo. O meu

**Andre Felicissimo:** é. f\*\*\*-se, vai fazer vídeo. Ô,

**Sidnei Felipe Nunes Telles de Almeida:** quiabo.

**Andre Felicissimo:** e aí eu vou quero impulsionar esses vídeos.

### **00:48:21**

**Andre Felicissimo:** Não tive tempo ainda de impulsionar esses vídeos para parar de impulsionar o dos outros, né? Mas tá indo, tá cantando. É que tava quando eu tava colocando grana, ele ele detona.

**Sidnei Felipe Nunes Telles de Almeida:** Ele jogou,

**Andre Felicissimo:** Não.

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** É, mas é bom também. Já tô tô aguardando aqui para colocar alguém aqui dentro para ajudar na separação tudo.

**Sidnei Felipe Nunes Telles de Almeida:** O web tá configurado. Ч.

**Andre Felicissimo:** Minutinho, mestre.

**Sidnei Felipe Nunes Telles de Almeida:** Ah, agora foi. Presente cósmico dos incas.

**Andre Felicissimo:** E esses produtos aqui, f\*\*\*-se. Deixa, deixa assim mesmo.

**Sidnei Felipe Nunes Telles de Almeida:** Que

**Andre Felicissimo:** Tem aqui a mexa e

**Sidnei Felipe Nunes Telles de Almeida:** produto?

**Andre Felicissimo:** tama.

**Sidnei Felipe Nunes Telles de Almeida:** Aonde você tá vendo isso?

**Andre Felicissimo:** Ah, mas seva, pô. concreto.

**Sidnei Felipe Nunes Telles de Almeida:** Ah, aqui.

**Andre Felicissimo:** É.

**Sidnei Felipe Nunes Telles de Almeida:** Ah, não, esse aqui são os produtos que tá tá na tabela.

### **00:49:55** {#00:49:55}

**Andre Felicissimo:** Ah, são todos. Eu pensei que tinha dois selecionados. Ah, pensei que tinha

**Sidnei Felipe Nunes Telles de Almeida:** Os produtos que ele tem acesso na tabela.

**Andre Felicissimo:** dois

**Sidnei Felipe Nunes Telles de Almeida:** Vamos ver se vai. Tá rodando. Não. Ó, deu erro, mas acho que foi time out. Demorou muito para responder. Ele deu erro. Se pá,

**Andre Felicissimo:** Mas é ISO daí ou não?

**Sidnei Felipe Nunes Telles de Almeida:** ó, lista de produção gerada e salva com sucesso. Mas deu erro no front end. Deve ser tipo, deve ser porque demorou muito. Vamos ver se a lista Так.

**Andre Felicissimo:** Oh.

**Sidnei Felipe Nunes Telles de Almeida:** Ah, moleque, deu certo. Ó, tá vendo?

**Andre Felicissimo:** Legal. Aí você vai falar gerar,

**Sidnei Felipe Nunes Telles de Almeida:** Você viu?

**Andre Felicissimo:** gerar, gerar.

**Sidnei Felipe Nunes Telles de Almeida:** É,

### **00:53:22**

**Andre Felicissimo:** Legal,

**Sidnei Felipe Nunes Telles de Almeida:** é que eu fiz assim porque para não sair gerando tudo e ficar gastando à toa,

**Andre Felicissimo:** legal. Não, excelente. Excelente.

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** Excelente.

**Sidnei Felipe Nunes Telles de Almeida:** Mas eu gere aqui gerar roteiro.

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** Tem que gerar tudo também, né?

**Andre Felicissimo:** Tá legal. Ali gera todos os roteiros e e começa a produzir os vídeos. Não,

**Sidnei Felipe Nunes Telles de Almeida:** É,

**Andre Felicissimo:** tá,

**Sidnei Felipe Nunes Telles de Almeida:** ainda não testei.

**Andre Felicissimo:** tá.

**Sidnei Felipe Nunes Telles de Almeida:** Vamos ver. Mas geralmente eu abriria aqui, né? Eu abriria

**Andre Felicissimo:** Ah, não, mas tem que ser em massa pra gente setar muito bem o prompt mandar ele fazer tudo de uma

**Sidnei Felipe Nunes Telles de Almeida:** aqui.

**Andre Felicissimo:** vez. Mas, ó, esse tempo é muito demorado, isso, entendeu?

**Sidnei Felipe Nunes Telles de Almeida:** É,

**Andre Felicissimo:** Isso tá num roteiro ainda, né?

**Sidnei Felipe Nunes Telles de Almeida:** é, nem começou a gerar ainda,

### **00:54:01**

**Andre Felicissimo:** Não,

**Sidnei Felipe Nunes Telles de Almeida:** ó.

**Andre Felicissimo:** já já aumenta.

**Sidnei Felipe Nunes Telles de Almeida:** Vamos ver quanto tempo agora é.

**Andre Felicissimo:** É, já aumenta.

**Sidnei Felipe Nunes Telles de Almeida:** 7:55

**Andre Felicissimo:** Pode aumentar bastante o poder dessa máquina e ver se faz diferença. Ah, não, mas esse daqui é a, né?

**Sidnei Felipe Nunes Telles de Almeida:** é, ó, por exemplo, agora, ó, ó, tá vendo? Eu eu mandei ele gerar tudo, ó. Eu cliquei aqui em compilar, tá vendo? Ele vai gerar tudo automático. Vamos ver aqui no Vou te mostrar aqui no N8N. Ele rodando, ó. Tá gerando só, ó, os áudios já gerou todos,

**Andre Felicissimo:** Não tô chovendo agora.

**Sidnei Felipe Nunes Telles de Almeida:** tá vendo?

**Andre Felicissimo:** Eu tô vendo, mas tava tava travando.

**Sidnei Felipe Nunes Telles de Almeida:** Tá me ouvindo?

**Andre Felicissimo:** Agora eu tô, mas tava travando a imagem.

**Sidnei Felipe Nunes Telles de Almeida:** Ó, gerou todos os áudios. Já tá gerando as imagens.

### **00:54:47** {#00:54:47}

**Sidnei Felipe Nunes Telles de Almeida:** Tá vendo? As imagens demoram um pouquinho mais,

**Andre Felicissimo:** Угуm.

**Sidnei Felipe Nunes Telles de Almeida:** 30 segundos por imagem. E aí o que que acontece? Ele ele gera as imagens e sobe pro Google Cloud, né? e joga o link no banco de dados. O front end fica, ele fica escutando esse banco de dados. Então ele tem que esperar atualizar o banco de dados, ele recebe um ping e aí atualiza o front end. Por isso que às vezes parece que demora.

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** Aí depois que gera tudo, aí depois que gera tudo, todas as imagens, todos os áudios, aí ele começa a renderizar as cenas uma por uma.

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** Tá vendo, ó? Ele já fez a

**Andre Felicissimo:** Mas, por exemplo, você colocou criar,

**Sidnei Felipe Nunes Telles de Almeida:** primeira.

**Andre Felicissimo:** ele cons eu conseguiria criar ele sem sem tá com o estúdio aberto.

**Sidnei Felipe Nunes Telles de Almeida:** Fechar a janela, né?

### **00:55:48**

**Sidnei Felipe Nunes Telles de Almeida:** Você fala.

**Andre Felicissimo:** É,

**Sidnei Felipe Nunes Telles de Almeida:** É, então acho que por aqui, né? Vamos ver.

**Andre Felicissimo:** mas daria para fazer ou Eu acho que esse é o segundo passo.

**Sidnei Felipe Nunes Telles de Almeida:** Dá por essa tela aqui,

**Andre Felicissimo:** É,

**Sidnei Felipe Nunes Telles de Almeida:** ó.

**Andre Felicissimo:** não tô vendo direito.

**Sidnei Felipe Nunes Telles de Almeida:** Ó, eu cliquei aqui, ó. Eu cliquei tipo em gerar,

**Andre Felicissimo:** Ah, gerar,

**Sidnei Felipe Nunes Telles de Almeida:** gerar auto.

**Andre Felicissimo:** tá?

**Sidnei Felipe Nunes Telles de Almeida:** Tá vendo?

**Andre Felicissimo:** Legal, legal, legal,

**Sidnei Felipe Nunes Telles de Almeida:** Aham. Já tá gerando. Ele fez o roteiro,

**Andre Felicissimo:** legal.

**Sidnei Felipe Nunes Telles de Almeida:** ó. Se dá para abrir ele no estúdio também. Tem

**Andre Felicissimo:** Tá legal.

**Sidnei Felipe Nunes Telles de Almeida:** que ser melhor, né? Algumas

**Andre Felicissimo:** É, acho que amanhã testar a nuvem, aumentar,

**Sidnei Felipe Nunes Telles de Almeida:** coisas.

### **00:56:40**

**Andre Felicissimo:** ver se melhora a capacidade de de produção disso. Eu já vou fazer umas listas também pra gente publicar no nas outras páginas. E agendamento como que funciona aqui? É um por um,

**Sidnei Felipe Nunes Telles de Almeida:** É, então por enquanto um por um e

**Andre Felicissimo:** tá? Não, mas sem problema. Isso é rápido também. Aí eu abro lá o vídeo e agendo.

**Sidnei Felipe Nunes Telles de Almeida:** botão agendar tudo, né?

**Andre Felicissimo:** Tá, mas eu também vi da última vez que eu vi não tava funcionando os os agendamento,

**Sidnei Felipe Nunes Telles de Almeida:** Isso

**Andre Felicissimo:** né? Tá produzindo mais de uma vez.

**Sidnei Felipe Nunes Telles de Almeida:** tá produzindo os dois ao mesmo tempo. Esses dois aqui. Ah, mas esse aqui já viu que travou,

**Andre Felicissimo:** É porque se não se o problema não é processamento,

**Sidnei Felipe Nunes Telles de Almeida:** ó.

**Andre Felicissimo:** é o tempo de resposta da dá para produzir vários, né?

**Sidnei Felipe Nunes Telles de Almeida:** Dá, dá, mas tem também um pouco de tipo assim

**Andre Felicissimo:** Ah, já deu erro

**Sidnei Felipe Nunes Telles de Almeida:** Ó, deu erro.

### **00:57:43** {#00:57:43}

**Sidnei Felipe Nunes Telles de Almeida:** Isso aqui às vezes dá uns errinhos que também,

**Andre Felicissimo:** aí.

**Sidnei Felipe Nunes Telles de Almeida:** tipo, essas APIs também é f\*\*\*. Você manda muito request ao mesmo tempo, eles rejeitam, né? Eu tenho que fazer uma fila, tá ligado,

**Andre Felicissimo:** Tá,

**Sidnei Felipe Nunes Telles de Almeida:** mano.

**Andre Felicissimo:** mas por exemplo mes é

**Sidnei Felipe Nunes Telles de Almeida:** Eu acho que isso aí é uma parada que eu vou ter que preparar mesmo, igual vou ter que preparar certinho para poder não tipo eles

**Andre Felicissimo:** é isso que eu ia falar aqui. Receber.

**Sidnei Felipe Nunes Telles de Almeida:** não bloquearem a gente, né?

**Andre Felicissimo:** Sim,

**Sidnei Felipe Nunes Telles de Almeida:** Receber vários clientes ao mesmo tempo em massa e ele não

**Andre Felicissimo:** exatamente. É.

**Sidnei Felipe Nunes Telles de Almeida:** bloquear. E aí ficou todos aqui também, né? Ficou tipo, ficou todas as ideias aqui, né?

**Andre Felicissimo:** Tá legal,

**Sidnei Felipe Nunes Telles de Almeida:** Então tem algumas que tá sem roteiro, né? Aí dá aí daria para você vir e gerar por aqui, ó.

### **00:59:03** {#00:59:03}

**Sidnei Felipe Nunes Telles de Almeida:** Tá vendo?

**Andre Felicissimo:** tá?

**Sidnei Felipe Nunes Telles de Almeida:** Não tem roteiro. Põe aqui ele vai fazer o roteiro que já tá salvo.

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** Qual que é o as instruções, né, da IA já ficou salvo na hora que fez a lista, né?

**Andre Felicissimo:** Tá legal. Ah, dá uma melhorada nisso amanhã. Então, aí a gente conversa no final do dia. Amanhã é sexta. É, nem no final do dia. É,

**Sidnei Felipe Nunes Telles de Almeida:** É sexta.

**Andre Felicissimo:** me dá nem nem preciso de nem fazer a reunião.

**Sidnei Felipe Nunes Telles de Almeida:** E aí,

**Andre Felicissimo:** Só me dar uns toquinhos no WhatsApp.

**Sidnei Felipe Nunes Telles de Almeida:** Viruí?

**Andre Felicissimo:** Quê? Cortou.

**Sidnei Felipe Nunes Telles de Almeida:** Tranquilo, cara. Vou vou botar uma máquina top lá,

**Andre Felicissimo:** Coloca. Pode

**Sidnei Felipe Nunes Telles de Almeida:** uma mais topzinha assim e vou fazer essa parada aí

**Andre Felicissimo:** colocar

**Sidnei Felipe Nunes Telles de Almeida:** de dele aguentar, né,

**Andre Felicissimo:** isso.

### **00:59:57**

**Sidnei Felipe Nunes Telles de Almeida:** vários ao mesmo tempo.

**Andre Felicissimo:** É. E e primeiro,

**Sidnei Felipe Nunes Telles de Almeida:** E publicação

**Andre Felicissimo:** em vez de aumentar, é,

**Sidnei Felipe Nunes Telles de Almeida:** massa.

**Andre Felicissimo:** várias chamadas, você fala, né, ao mesmo tempo. Isso.

**Sidnei Felipe Nunes Telles de Almeida:** Isso é uma fila,

**Andre Felicissimo:** Isso mesmo.

**Sidnei Felipe Nunes Telles de Almeida:** né? Precisa só fazer uma fila certinho,

**Andre Felicissimo:** Uhum. Mas será que o sistema não tem um para múltiplos usuários?

**Sidnei Felipe Nunes Telles de Almeida:** tá ligado?

**Andre Felicissimo:** Que alguém deve tá usando isso no mesmo formato, né?

**Sidnei Felipe Nunes Telles de Almeida:** Não é um é um fluxo, né? É um fluxo que você faz no NN que ele funciona tipo como um telefonista,

**Andre Felicissimo:** Tá,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** tá.

**Sidnei Felipe Nunes Telles de Almeida:** Entendeu?

**Andre Felicissimo:** Fica ligando, né?

**Sidnei Felipe Nunes Telles de Almeida:** Tipo como um um segurança de de uma porta de banco,

**Andre Felicissimo:** Tá,

**Sidnei Felipe Nunes Telles de Almeida:** assim, ele fica controlando a entrada,

**Andre Felicissimo:** entendi.

### **01:00:37**

**Sidnei Felipe Nunes Telles de Almeida:** deixa passar um de cada vez,

**Andre Felicissimo:** Tá, entendi.

**Sidnei Felipe Nunes Telles de Almeida:** tá ligado?

**Andre Felicissimo:** Entendi.

**Sidnei Felipe Nunes Telles de Almeida:** É um fluxo. E aí ele vai soltando aos poucos. É uma fila, né?

**Andre Felicissimo:** Demorou. É isso.

**Sidnei Felipe Nunes Telles de Almeida:** Por ordem de chegada.

**Andre Felicissimo:** Boa noite. Vai ficar, vai tocar assim.

**Sidnei Felipe Nunes Telles de Almeida:** Eu é que eu não eu não tava muito preocupado com isso, na verd na verdade,

**Andre Felicissimo:** Não, eu sei.

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** É que é que às vezes a ideia tá na minha cabeça,

**Sidnei Felipe Nunes Telles de Almeida:** Agora,

**Andre Felicissimo:** eu não falo também, né? E de e possivelmente a gente vai pegar uns dias pra gente também dar um

**Sidnei Felipe Nunes Telles de Almeida:** como

**Andre Felicissimo:** uma selecionada no no Mercado Livre, ver esse monitoramento de preços, mas eu acho que isso daqui pode tocar independente, entendeu? Tiver rodando isso daqui,

**Sidnei Felipe Nunes Telles de Almeida:** mas é bom essas reuniões também.

**Andre Felicissimo:** a gente

**Sidnei Felipe Nunes Telles de Almeida:** Por mim, a gente faz mais reuniões, velho,

### **01:01:19**

**Andre Felicissimo:** sim.

**Sidnei Felipe Nunes Telles de Almeida:** mais cal,

**Andre Felicissimo:** É,

**Sidnei Felipe Nunes Telles de Almeida:** que assim a gente consegue ir alinhando melhor

**Andre Felicissimo:** mas é organização, mano. É que eu tô tô tô sufocado ainda,

**Sidnei Felipe Nunes Telles de Almeida:** as

**Andre Felicissimo:** mas eu quero terceirizar cada vez coisas, entendeu? pro Mateus, deixando as coisas mais ágeis, mas eu tô pensando em muita coisa, por isso que às vezes tô distante.

**Sidnei Felipe Nunes Telles de Almeida:** tinha uma outra parada que eu tinha feito aqui, que era pegar um item e eu não acho,

**Andre Felicissimo:** Hum.

**Sidnei Felipe Nunes Telles de Almeida:** não sei se é aqui na vigia.

**Andre Felicissimo:** Ah, legal.

**Sidnei Felipe Nunes Telles de Almeida:** Ah,

**Andre Felicissimo:** É isso.

**Sidnei Felipe Nunes Telles de Almeida:** é,

**Andre Felicissimo:** Criar um roteiro das

**Sidnei Felipe Nunes Telles de Almeida:** é. Não, não era bem esse aqui não. Eu acho que era aqui no radar mesmo.

**Andre Felicissimo:** dores.

**Sidnei Felipe Nunes Telles de Almeida:** Pera aí. Ah, era esse botão de destrinchar aqui. Você viu

### **01:02:20** {#01:02:20}

**Andre Felicissimo:** Não.

**Sidnei Felipe Nunes Telles de Almeida:** isso?

**Andre Felicissimo:** Ah, você colocou overloja também. Eu consigo acessar a loja do cara daí.

**Sidnei Felipe Nunes Telles de Almeida:** Isso a loja é. Aham.

**Andre Felicissimo:** Aí não.

**Sidnei Felipe Nunes Telles de Almeida:** Não sei se tá todos funcionando, né?

**Andre Felicissimo:** Sim,

**Sidnei Felipe Nunes Telles de Almeida:** Se ele tá redirecionando certinho,

**Andre Felicissimo:** sim. Legal. Uma coisa

**Sidnei Felipe Nunes Telles de Almeida:** mas ó, aqui, ó, ele ele faz um,

**Andre Felicissimo:** que

**Sidnei Felipe Nunes Telles de Almeida:** eu mandei ele fazer um prompt que analisa o anúncio, né? Então, tá aqui,

**Andre Felicissimo:** tá.

**Sidnei Felipe Nunes Telles de Almeida:** ó, tipo, ó, quais gatilhos mentais, ó? Não sei se tá vendo,

**Andre Felicissimo:** Uhum.

**Sidnei Felipe Nunes Telles de Almeida:** gatilhos mentais utilizados, promessa principal, ofereceram uma experiência de chá premium, não sei o quê,

**Andre Felicissimo:** Legal.

**Sidnei Felipe Nunes Telles de Almeida:** que é tipo uma análise do do anúncio

**Andre Felicissimo:** Entendi. Entendi. Do produto.

### **01:03:03** {#01:03:03}

**Sidnei Felipe Nunes Telles de Almeida:** num geral.

**Andre Felicissimo:** Aham.

**Sidnei Felipe Nunes Telles de Almeida:** E aí tem esse botãozinho de transformar em vídeo,

**Andre Felicissimo:** Legal.

**Sidnei Felipe Nunes Telles de Almeida:** que ele pegaria tipo um anúncio do concorrente e transformaria num tema de vídeo assim, né?

**Andre Felicissimo:** Legal.

**Sidnei Felipe Nunes Telles de Almeida:** Isso aí foi a Iá que deu a sugestão. Tipo, eu peguei um dia, falei assim: "Ah, analisa aí o sistema e dá algumas sugestões aí de ferramenta que a gente pode usar que junte tudo que Aí ele fez essa

**Andre Felicissimo:** Legal.

**Sidnei Felipe Nunes Telles de Almeida:** parada. Aí ele joga para

**Andre Felicissimo:** Não, muito legal. Eu acho que daí dá para usar até, tipo,

**Sidnei Felipe Nunes Telles de Almeida:** cá.

**Andre Felicissimo:** a gente vai fazer vídeo de terceiros, pega e faz o vídeo do assim e publica, entendeu? De outros produtos.

**Sidnei Felipe Nunes Telles de Almeida:** Sim, sim. É boa ideia, né?

**Andre Felicissimo:** É,

**Sidnei Felipe Nunes Telles de Almeida:** Dá pra gente ir explorando isso aí também.

**Andre Felicissimo:** não muito. Você tem muitas ideias

### **01:03:47** {#01:03:47}

**Sidnei Felipe Nunes Telles de Almeida:** É uma coisa, é uma coisa. E nunca vi em nenhum,

**Andre Felicissimo:** boas,

**Sidnei Felipe Nunes Telles de Almeida:** nunca vi em nenhum outro lugar.

**Andre Felicissimo:** mas vamos tocar isso daí. Vamos começar a vender isso daí para até escalar isso daí. Tô vendo um monte de Eu vi o cara vendendo, acho que era 397 o produto dele. Você pegava o vídeo e transformava em em carro. Foi desgraçado.

**Sidnei Felipe Nunes Telles de Almeida:** Coisa mais básica que tem,

**Andre Felicissimo:** É,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** então a gente tá com uma super estrutura e não tá Ah,

**Sidnei Felipe Nunes Telles de Almeida:** Ele, mas os carrossel era bonito, tipo, era uns carrossel

**Andre Felicissimo:** é, mas ele preetou um formato,

**Sidnei Felipe Nunes Telles de Almeida:** bom.

**Andre Felicissimo:** né? Tipo, ah, modelo Twitter, modelo,

**Sidnei Felipe Nunes Telles de Almeida:** Sim,

**Andre Felicissimo:** mas nada demais.

**Sidnei Felipe Nunes Telles de Almeida:** mas a gente tem o nosso meio que pronto aí também.

**Andre Felicissimo:** É, então falei: "Pô, já dá para anunciar isso daí, gasta uma grana em ver quem que entra,

### **01:04:35** {#01:04:35}

**Sidnei Felipe Nunes Telles de Almeida:** É,

**Andre Felicissimo:** vê se vai dar

**Sidnei Felipe Nunes Telles de Almeida:** dá, dá para dá para fazer em tipo em pacotes,

**Andre Felicissimo:** bora

**Sidnei Felipe Nunes Telles de Almeida:** né, mano? Tipo, ah, pacote X é só

**Andre Felicissimo:** por exemplo, se a gente formatar isso de um produto,

**Sidnei Felipe Nunes Telles de Almeida:** vio.

**Andre Felicissimo:** mesmo que perca dinheiro, entendeu? pra gente validar isso aí depois se seta certinho,

**Sidnei Felipe Nunes Telles de Almeida:** Aham.

**Andre Felicissimo:** vê o público e vai mudando certinho. Pô, tem que fazer menos

**Sidnei Felipe Nunes Telles de Almeida:** Mano, na verdade, na verdade tem muita coisa,

**Andre Felicissimo:** vídeo.

**Sidnei Felipe Nunes Telles de Almeida:** velho. Tem o bote do threads também que eu comecei a fazer e também já ficou

**Andre Felicissimo:** Sim. É, é que também não,

**Sidnei Felipe Nunes Telles de Almeida:** adormecido.

**Andre Felicissimo:** a gente tá com pouca gente para até perguntar isso para você futuramente. Isso tá muito focado em você hoje. Por isso que também a gente não tá É a mesma coisa. É gargalos, né? Gargalos.

### **01:05:17** {#01:05:17}

**Andre Felicissimo:** Um minutinho. Falou. maior. Se fosse

**Sidnei Felipe Nunes Telles de Almeida:** อ

**Andre Felicissimo:** Um de moto, outro de carro. Tá aí.

**Sidnei Felipe Nunes Telles de Almeida:** Opa.

**Andre Felicissimo:** É. Só fazer um sor aqui.

**Sidnei Felipe Nunes Telles de Almeida:** Então, bora trocar uma ideia.

**Andre Felicissimo:** Fala.

**Sidnei Felipe Nunes Telles de Almeida:** Amanhã eu vou

**Andre Felicissimo:** Bora. Acho que amanhã dá. Eh, rapidinho, que que você acha que a gente para terminar essa conversa, eh, qual que seria o passo dois e a gente,

**Sidnei Felipe Nunes Telles de Almeida:** Ah.

**Andre Felicissimo:** por exemplo, tá tudo concentrado em você hoje, que que a gente faria para para diminuir essa

**Sidnei Felipe Nunes Telles de Almeida:** Você

**Andre Felicissimo:** Tá,

**Sidnei Felipe Nunes Telles de Almeida:** fala arrumar mais alguém,

**Andre Felicissimo:** é,

**Sidnei Felipe Nunes Telles de Almeida:** mais uma pessoa para trampar?

**Andre Felicissimo:** não sei se pensa em alguém em relação a isso

**Sidnei Felipe Nunes Telles de Almeida:** Cara,

**Andre Felicissimo:** ou

**Sidnei Felipe Nunes Telles de Almeida:** eu acho que rola sim, mas não conheço ninguém também. Um programador é claro,

### **01:07:36**

**Andre Felicissimo:** Ah,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** sim, sim.

**Sidnei Felipe Nunes Telles de Almeida:** Enquanto que o cara, alguém vai cobrar,

**Andre Felicissimo:** É,

**Sidnei Felipe Nunes Telles de Almeida:** não ser que você tenha um,

**Andre Felicissimo:** vou também. Eu tô sondando esse meu amigo que eu que

**Sidnei Felipe Nunes Telles de Almeida:** não ser que você tem um primo aí que tá começando uma faculdade agora,

**Andre Felicissimo:** eu não,

**Sidnei Felipe Nunes Telles de Almeida:** alguém tipo da sua família aí, tipo,

**Andre Felicissimo:** eu acho que esse o o mano que eu tipo eu vou

**Sidnei Felipe Nunes Telles de Almeida:** meio vagabundo, não tá fazendo nada da vida, fala assim, ó, te dou 50 conto por semana para você

**Andre Felicissimo:** te então não,

**Sidnei Felipe Nunes Telles de Almeida:** trampar.

**Andre Felicissimo:** eu acho que meu amigo abraça, gostou das ideias dos vídeos. Ele vai abraçar, eu acho, né? Tem que ver a disposição dele,

**Sidnei Felipe Nunes Telles de Almeida:** Aham.

**Andre Felicissimo:** mas só para ter uma ideia disso. Demorou.

**Sidnei Felipe Nunes Telles de Almeida:** Ah,

**Andre Felicissimo:** Amanhã a gente troca uma ideia,

**Sidnei Felipe Nunes Telles de Almeida:** eu não não lembro trabalhar em equipe, velho.

### **01:08:13**

**Andre Felicissimo:** então.

**Sidnei Felipe Nunes Telles de Almeida:** Eu eu prefiro até trabalhar em equipe, ter mais alguém para conversar também, trocar umas ideias. Sempre bom, mais mentes trabalhando,

**Andre Felicissimo:** Sim.

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** É, mas isso acho que é um passo distante ainda. Mas eu acho que, pô, é um gargalo que a gente sabe que é, né?

**Sidnei Felipe Nunes Telles de Almeida:** É, eu acho que a gente tem que fazer mais reuniões assim.

**Andre Felicissimo:** Sabe que largo, hein,

**Sidnei Felipe Nunes Telles de Almeida:** O sermão também não tem muito tempo de dar atenção nisso, né?

**Andre Felicissimo:** mano. Ele ele não tá nem tão preparado quanto eu tô, né? E sufocado, né? Todo mundo tem bastante trabalho aqui. É tanta coisinha para pensar e no meio disso eu quero fechar blogueira,

**Sidnei Felipe Nunes Telles de Almeida:** É,

**Andre Felicissimo:** quero achar uma social mídia, os problemas diários, mas tô tô pensando em me estruturar,

**Sidnei Felipe Nunes Telles de Almeida:** entendi.

**Andre Felicissimo:** né, em relação a isso.

**Sidnei Felipe Nunes Telles de Almeida:** Entendi.

**Andre Felicissimo:** Mas é gente, tem um momento que é

**Sidnei Felipe Nunes Telles de Almeida:** É, talvez eu conheça o pessoal que trabalha com essa essa parte de marketing também.

### **01:09:05** {#01:09:05}

**Andre Felicissimo:** gente.

**Sidnei Felipe Nunes Telles de Almeida:** De repente, vamos ver, né, se precinho for camarada.

**Andre Felicissimo:** Ah, não, só para só para fundar mesmo. A gente vai conversando disso. Amanhã dá pra gente

**Sidnei Felipe Nunes Telles de Almeida:** Beleza.

**Andre Felicissimo:** reunião,

**Sidnei Felipe Nunes Telles de Almeida:** É, vamos fazendo mais causa aí, vamos se falando mais, entendeu? Mas eu acho que a gente avançou bastante,

**Andre Felicissimo:** demorar.

**Sidnei Felipe Nunes Telles de Almeida:** velho. Conseguimos integrar aí, tipo assim, nós conseguimos integrar as as APIs assim, que são as principais já, né, que é o TikTok,

**Andre Felicissimo:** Tá tudo conversando bem.

**Sidnei Felipe Nunes Telles de Almeida:** Mercado Livre, não vem shop,

**Andre Felicissimo:** Ah,

**Sidnei Felipe Nunes Telles de Almeida:** meta

**Andre Felicissimo:** Mercado Livre vai mudar, viu? Eu vou te mandar o porque eu não sei,

**Sidnei Felipe Nunes Telles de Almeida:** Ah.

**Andre Felicissimo:** não sei, eu não entendi muito bem ali por cima, mas aparentemente é o a a senha, né, o token vai ficar embutido no retorno. Você não vai precisar ficar requisitando a senha de verificação. Vou até te mandar agora,

### **01:10:03** {#01:10:03}

**Sidnei Felipe Nunes Telles de Almeida:** É,

**Andre Felicissimo:** senão vai esquecer.

**Sidnei Felipe Nunes Telles de Almeida:** então porque bom, me manda lá a documentação, porque a maneira como eu faço aqui é com um token, um refresh token, né,

**Andre Felicissimo:** Sim. Então,

**Sidnei Felipe Nunes Telles de Almeida:** que é um token que você usa para buscar o token novo,

**Andre Felicissimo:** exatamente. É, então,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** eu acho que não vai precisar mais desse refresh token.

**Sidnei Felipe Nunes Telles de Almeida:** Ah, me manda aí que eu dou uma olhadinha.

**Andre Felicissimo:** Vou mandar, vou mandar até agora,

**Sidnei Felipe Nunes Telles de Almeida:** Eu também dou uma pesquisada aqui

**Andre Felicissimo:** senão vai esquecer. é que chegou no meu e-mail,

**Sidnei Felipe Nunes Telles de Almeida:** também.

**Andre Felicissimo:** deve não deve tá tão amostra assim o

**Sidnei Felipe Nunes Telles de Almeida:** E tipo assim, a gente também a gente tá montando um banco de dados também com os dados dos

**Andre Felicissimo:** Ah, e é o Chegou um e-mail do TikTok

**Sidnei Felipe Nunes Telles de Almeida:** seus dos seus concorrentes,

**Andre Felicissimo:** também.

**Sidnei Felipe Nunes Telles de Almeida:** tá ligado? Então, tipo assim, tudo que eh eu montei um sistema que todo dia, né, ele pega esses anúncios e salva,

### **01:10:52** {#01:10:52}

**Andre Felicissimo:** Uhum.

**Sidnei Felipe Nunes Telles de Almeida:** tá ligado, os dados, preço, tudo mais, pra gente ir montando esse acompanhamento de preço que você falou,

**Andre Felicissimo:** Tá.

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** É, era uma coisa,

**Sidnei Felipe Nunes Telles de Almeida:** Por isso que são aqueles gráficos lá,

**Andre Felicissimo:** essa é uma coisa Isso é,

**Sidnei Felipe Nunes Telles de Almeida:** entendeu?

**Andre Felicissimo:** mas você vê se tá funcionando início também já me dá um

**Sidnei Felipe Nunes Telles de Almeida:** Não é para tá funcionando,

**Andre Felicissimo:** toque.

**Sidnei Felipe Nunes Telles de Almeida:** só que como eu eu coloquei ele para rodar hoje, né? Então vai, tipo,

**Andre Felicissimo:** Ah,

**Sidnei Felipe Nunes Telles de Almeida:** vai demorar uns dias para ele ir

**Andre Felicissimo:** tá. Não, mas se eu rodou amanhã para ver se ele tá com salvando,

**Sidnei Felipe Nunes Telles de Almeida:** ele isso,

**Andre Felicissimo:** certo, entendeu?

**Sidnei Felipe Nunes Telles de Almeida:** coletando os dados. Daqui a pouco eu já mando ele rodar de novo. De repente já teve, né, mudança, né? Sei lá.

### **01:11:26**

**Sidnei Felipe Nunes Telles de Almeida:** Às vezes no mesmo dia não tem, né? Difícil,

**Andre Felicissimo:** Então acho que não demora isso daí,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** mas só de ele ele salva os dados, não salva dia a dia.

**Sidnei Felipe Nunes Telles de Almeida:** É para salvar.

**Andre Felicissimo:** Ah, sim. Então é isso.

**Sidnei Felipe Nunes Telles de Almeida:** Então é isso.

**Andre Felicissimo:** Pera aí que eu já vou te mandar um negócio, senão vou fechar aqui que eu nem comi ainda. E foi para onde? Vejou para onde então?

**Sidnei Felipe Nunes Telles de Almeida:** M. Mano, eu fui em São Paulo, fui resolver uns negócios aí.

**Andre Felicissimo:** Ah, pensei que tivesse.

**Sidnei Felipe Nunes Telles de Almeida:** Então,

**Andre Felicissimo:** Você postou bagulho de aeroporto, não postou?

**Sidnei Felipe Nunes Telles de Almeida:** ah, mas aquilo ali é só para fazer um charme,

**Andre Felicissimo:** Ah, fazer uma

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** graça.

**Sidnei Felipe Nunes Telles de Almeida:** As pessoas achar que eu sou o cara viajado, né?

**Andre Felicissimo:** Vou te mandar o link aí no no WhatsApp.

**Sidnei Felipe Nunes Telles de Almeida:** Mas eu tava lá, pô, tava na frente do aeroporto.

### **01:12:43**

**Andre Felicissimo:** que se vai

**Sidnei Felipe Nunes Telles de Almeida:** Não,

**Andre Felicissimo:** fazer.

**Sidnei Felipe Nunes Telles de Almeida:** eu precisei visitar meu primo lá e porque ele tá ruim no hospital, tá ligado? Com essa situação lá.

**Andre Felicissimo:** É

**Sidnei Felipe Nunes Telles de Almeida:** Ah, é,

**Andre Felicissimo:** grave.

**Sidnei Felipe Nunes Telles de Almeida:** mano. Ele perdeu os dois rins, né?

**Andre Felicissimo:** Aí passa que fazer mod. É, meu o meu amigo tem tem problema também de rim tá na fila do

**Sidnei Felipe Nunes Telles de Almeida:** fazer mon direto,

**Andre Felicissimo:** transplante de urinária,

**Sidnei Felipe Nunes Telles de Almeida:** né? Aí às vezes p\*\*\*\* da infecção, né?

**Andre Felicissimo:** né?

**Sidnei Felipe Nunes Telles de Almeida:** Não infecção porque tem que ficar furando, né?

**Andre Felicissimo:** Ah, do do local.

**Sidnei Felipe Nunes Telles de Almeida:** É.

**Andre Felicissimo:** É, é embaçado esse. Ele

**Sidnei Felipe Nunes Telles de Almeida:** Ah, tá, tá, tá. De JWT. Aham. Beleza. Isso aqui

### **01:13:27** {#01:13:27}

**Andre Felicissimo:** colocou.

**Sidnei Felipe Nunes Telles de Almeida:** é basicamente a autorização agora é um arquivo, né? É um arquivo Jason. Sim. Ó, aprendi bastante também, mano, fazendo essas paradas aqui, velho, com você também,

**Andre Felicissimo:** Tá,

**Sidnei Felipe Nunes Telles de Almeida:** p\*\*\*\*.

**Andre Felicissimo:** tá fácil para fazer qualquer outra coisa agora,

**Sidnei Felipe Nunes Telles de Almeida:** Ah, é um portfólio massa agora,

**Andre Felicissimo:** né?

**Sidnei Felipe Nunes Telles de Almeida:** mano, que eu tenho, né? Tipo assim, de repente mais, tipo assim, se eu for, né, de repente acabar o projeto, for para outro lugar, já tem um portfólio.

**Andre Felicissimo:** Sim,

**Sidnei Felipe Nunes Telles de Almeida:** Eu não tenho faculdade, né? Mas é um portfólio monstro,

**Andre Felicissimo:** sim.

**Sidnei Felipe Nunes Telles de Almeida:** né? Que é o que vale, né?

**Andre Felicissimo:** Não, total não.

**Sidnei Felipe Nunes Telles de Almeida:** Cara,

**Andre Felicissimo:** Você tá apto a fazer um monte de coisa, né? E é um ponto que também eu acho que você tá fazendo um trabalho, desempenhando trabalho para um salário baixo.

### **01:14:21** {#01:14:21}

**Sidnei Felipe Nunes Telles de Almeida:** é,

**Andre Felicissimo:** A gente tem que monetizar isso para criar uma estrutura de pagar melhor, pagar uma pessoa para fazer funções que não deve ser a gente que faça, entendeu?

**Sidnei Felipe Nunes Telles de Almeida:** e escalonar, né, tipo,

**Andre Felicissimo:** É,

**Sidnei Felipe Nunes Telles de Almeida:** fazer o projeto se pagar e vender,

**Andre Felicissimo:** sim,

**Sidnei Felipe Nunes Telles de Almeida:** né, porque, tipo assim,

**Andre Felicissimo:** sim,

**Sidnei Felipe Nunes Telles de Almeida:** os produtos já tão já tem muito produto, né? Agora é só focar mesmo em terminar,

**Andre Felicissimo:** sim.

**Sidnei Felipe Nunes Telles de Almeida:** em pacotar numa parada que dê para ser vendida, né? Acho que esse é o foco agora,

**Andre Felicissimo:** Exatamente.

**Sidnei Felipe Nunes Telles de Almeida:** né? Tipo, a gente ver como a gente vai eh fazer os testes, né? Fazer os estudos de caso, né? Pelo que eu entendi,

**Andre Felicissimo:** Sim,

**Sidnei Felipe Nunes Telles de Almeida:** vamos fazer esses estudos de caso nas nas páginas, né? Do Instagram,

**Andre Felicissimo:** é tudo tudo a princípio eu pretendo fazer com a gente,

### **01:15:08** {#01:15:08}

**Sidnei Felipe Nunes Telles de Almeida:** é fazer o nosso o nosso os nossos,

**Andre Felicissimo:** mas validar

**Sidnei Felipe Nunes Telles de Almeida:** como é que fala? Eh, né,

**Andre Felicissimo:** nossos produtos.

**Sidnei Felipe Nunes Telles de Almeida:** validar, né, validar a ideia, né,

**Andre Felicissimo:** Uhum. Eu

**Sidnei Felipe Nunes Telles de Almeida:** e empacotar e vender, né?

**Andre Felicissimo:** acho que dá. E tá fácil.

**Sidnei Felipe Nunes Telles de Almeida:** Falta pouco, né?

**Andre Felicissimo:** Falta pouquíssimo na

**Sidnei Felipe Nunes Telles de Almeida:** Nossa, que dor do c\*\*\*\*\*\*.

**Andre Felicissimo:** lombar.

**Sidnei Felipe Nunes Telles de Almeida:** É que quadril, mano.

**Andre Felicissimo:** Faz um alongamentozinho. Eu tô meti uma físia agora que também não tá aguentando de dor no ombro.

**Sidnei Felipe Nunes Telles de Almeida:** Tem que correr, fazer caminhada.

**Andre Felicissimo:** Aí não faz nada também de esporte, né?

**Sidnei Felipe Nunes Telles de Almeida:** Pô, eu tava treinando bastante, mano.

**Andre Felicissimo:** Que falar,

**Sidnei Felipe Nunes Telles de Almeida:** Eu tava degradinho,

**Andre Felicissimo:** eu tenho, nem te falei,

**Sidnei Felipe Nunes Telles de Almeida:** mas ultimamente eu

**Andre Felicissimo:** já tá nesse assunto.

### **01:16:01** {#01:16:01}

**Andre Felicissimo:** E eu tenho um bagulho de, eu coloquei um bagulho de total pés aqui na na empresa.

**Sidnei Felipe Nunes Telles de Almeida:** Hã,

**Andre Felicissimo:** Aí não sei se interessar você, você vai continuar pagando a mensalidade do mesmo jeito, mas aí você pode treinar em várias academias, pode treinar em vários bagulhos.

**Sidnei Felipe Nunes Telles de Almeida:** mas como que faz isso?

**Andre Felicissimo:** Então, que que eu funciona? Que que eu faço? Por exemplo, eu pago R$ 120 e eu posso treinar em vários bagulhos.

**Sidnei Felipe Nunes Telles de Almeida:** O que faz?

**Andre Felicissimo:** Eu posso treinar na Smartfit, eu posso treinar em outra academia, eu posso fazer box, eu posso fazer natação.

**Sidnei Felipe Nunes Telles de Almeida:** Mas como que eu faço para entrar nesse no Ah,

**Andre Felicissimo:** Eu vou te mandar te

**Sidnei Felipe Nunes Telles de Almeida:** me manda, pô. Eu quero aqui Peruíbos Academia que aceita.

**Andre Felicissimo:** mandar. Vou ter que te mandar.

**Sidnei Felipe Nunes Telles de Almeida:** Acho que tem duas ou três,

**Andre Felicissimo:** Manda seu e-mail aí para mim no WhatsApp.

**Sidnei Felipe Nunes Telles de Almeida:** mano.

**Andre Felicissimo:** Ah, mas eu não sei se eles vai continuar.

### **01:16:53** {#01:16:53}

**Andre Felicissimo:** Eles estão me cobrando R$ 2.000 do nada. Do nada que d vocês estão maluco.

**Sidnei Felipe Nunes Telles de Almeida:** Nar.

**Andre Felicissimo:** O bagulho é 200 mango.

**Sidnei Felipe Nunes Telles de Almeida:** Ai, velho.

**Andre Felicissimo:** Por enquanto tá funcionando, tá? Mas dá uma olhadinha. Ele deve ter total pés o nome.

**Sidnei Felipe Nunes Telles de Almeida:** He.

**Andre Felicissimo:** Deve ter um te informando melhor do que eu tô falando. Aí vai chegar o e-mail, faz o cadastrinho. CPF. Eh,

**Sidnei Felipe Nunes Telles de Almeida:** O meu 419 713 428

**Andre Felicissimo:** M.

**Sidnei Felipe Nunes Telles de Almeida:** 23

**Andre Felicissimo:** Fala de novo para mim. Fala de novo para mim, seu é

**Sidnei Felipe Nunes Telles de Almeida:** CPF 419 713 428

**Andre Felicissimo:** M.

**Sidnei Felipe Nunes Telles de Almeida:** 23

**Andre Felicissimo:** Mano, acho que é só você entrar no aplicativo e fazer o cadastro. Agora o aplicativo é Total Pass, aí você cadastra certinho que vai aparecer.

**Sidnei Felipe Nunes Telles de Almeida:** CPF. Deixa eu ver.

### **01:20:38** {#01:20:38}

**Andre Felicissimo:** É,

**Sidnei Felipe Nunes Telles de Almeida:** E aí, tem dado uns rolê aí ou

**Andre Felicissimo:** tem nada.

**Sidnei Felipe Nunes Telles de Almeida:** nada?

**Andre Felicissimo:** Então tô mais em casa do que nunca.

**Sidnei Felipe Nunes Telles de Almeida:** Só trabalho, né? Mas você tá treinando academia?

**Andre Felicissimo:** Tô nada, só pagogando, só tô com fui treinar, meu tá zoado, mano. Vou fazer a fisioterapia, depois eu quero voltar na semana que vem.

**Sidnei Felipe Nunes Telles de Almeida:** Zoad. Por qu que que aconteceu?

**Andre Felicissimo:** Ah, caí de moto com uma cota atrás e nunca mais

**Sidnei Felipe Nunes Telles de Almeida:** Ah,

**Andre Felicissimo:** arena.

**Sidnei Felipe Nunes Telles de Almeida:** entendi. Você foi no kiropraxista?

**Andre Felicissimo:** Foi nada. Ah, não era lesão de fortalecimento mesmo.

**Sidnei Felipe Nunes Telles de Almeida:** Não, aquele que dá umas estraladas,

**Andre Felicissimo:** Mas não não tava fora do lugar

**Sidnei Felipe Nunes Telles de Almeida:** às vezes tem que botar de volta no lugar algumas coisas.

**Andre Felicissimo:** não. Mais de ano. Ó, acho que para costa, para as colunas sim tem que ir.

### **01:21:28**

**Andre Felicissimo:** Mas não foi não. E tu tá, tu tá com dor aí, né? Tá dando uns

**Sidnei Felipe Nunes Telles de Almeida:** Tô com uma dor da p\*\*\*\* no meu tornozelo, na minha lombar,

**Andre Felicissimo:** pulinho.

**Sidnei Felipe Nunes Telles de Almeida:** velho. Mas eu gosto de trabalhar assim, porque eu fico me mexendo, né? Eu só, eu fico o dia inteiro assim, eu fico trabalhando, fico pulando, meu, eu agacho, aí eu faço flexão, sabe?

**Andre Felicissimo:** Agita,

**Sidnei Felipe Nunes Telles de Almeida:** Aí eu vou lá fora,

**Andre Felicissimo:** né?

**Sidnei Felipe Nunes Telles de Almeida:** eu volto, fico o dia inteiro em pé, velho. Tipo, umas 8 horas em pé.

**Andre Felicissimo:** Mas você já tinha essas dor já.

**Sidnei Felipe Nunes Telles de Almeida:** É melhor hã.

**Andre Felicissimo:** Você já tinha dor já.

**Sidnei Felipe Nunes Telles de Almeida:** Ah, é porque eu passei muito tempo sentado,

**Andre Felicissimo:** Ah,

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** isso que eu tô falando. É, não é de agora,

**Sidnei Felipe Nunes Telles de Almeida:** Não,

**Andre Felicissimo:** né?

### **01:22:15**

**Sidnei Felipe Nunes Telles de Almeida:** aqui, ó. André F dos Santos apareceu.

**Andre Felicissimo:** Só fazer o cadastro aí. Aí tem que pagar o mensalidade da academia. Tem vários planos aí. Quanto mais cá, mais academia te dá direito. Mas o Peruíb nem deve ter muitas. Aí você vê, você consegue ver todas as que tem por plano disponível. Aí tem várias coisas, tem luta, tem vários tipos de esporte, tem pilates. Pilates é bom para tu, viu?

**Sidnei Felipe Nunes Telles de Almeida:** Pois é, né, mano?

**Andre Felicissimo:** Não é muito hétero, mas é bom.

**Sidnei Felipe Nunes Telles de Almeida:** A mobilidade, né? É, sentar na bola, né? Meio complicado,

**Andre Felicissimo:** É de boca, de peito na bola,

**Sidnei Felipe Nunes Telles de Almeida:** meio complicado,

**Andre Felicissimo:** bola na bola.

**Sidnei Felipe Nunes Telles de Almeida:** cara.

**Andre Felicissimo:** É ou segura no pé e empina a

**Sidnei Felipe Nunes Telles de Almeida:** Parada, c\*\*\*\*\*\*.

**Andre Felicissimo:** bunda.

**Sidnei Felipe Nunes Telles de Almeida:** O cara tá sentando na bola para ficar aberto, flexível.

### **01:23:11** {#01:23:11}

**Andre Felicissimo:** Faz parte, né? Tá fazendo um cadastro

**Sidnei Felipe Nunes Telles de Almeida:** 88 305\.

**Andre Felicissimo:** aí? Não,

**Sidnei Felipe Nunes Telles de Almeida:** Aham.

**Andre Felicissimo:** tava dando certo cadastro.

**Sidnei Felipe Nunes Telles de Almeida:** É, velho, meu celular zoou a telaar.

**Andre Felicissimo:** a tela.

**Sidnei Felipe Nunes Telles de Almeida:** Só não binário. Deu certo, hein,

**Andre Felicissimo:** Boa.

**Sidnei Felipe Nunes Telles de Almeida:** mano? Carreira fit, ó. É a academia do Manu, pô. Cadê?

**Andre Felicissimo:** Aí

**Sidnei Felipe Nunes Telles de Almeida:** Do lado de cá, 300 m da minha casa.

**Andre Felicissimo:** demorou,

**Sidnei Felipe Nunes Telles de Almeida:** Olha,

**Andre Felicissimo:** irmão.

**Sidnei Felipe Nunes Telles de Almeida:** tem fisioterapia também, mano.

**Andre Felicissimo:** Tem o meu aqui. Nunca joga isso não,

**Sidnei Felipe Nunes Telles de Almeida:** Tem,

**Andre Felicissimo:** que eu tô pagando maior bico na minha.

**Sidnei Felipe Nunes Telles de Almeida:** ó, clínica Juja, fisioterapia e pilates.

**Andre Felicissimo:** Ah, mas deve ser só o pilates, viu?

### **01:25:35** {#01:25:35}

**Andre Felicissimo:** O quê? Fisioterapia.

**Sidnei Felipe Nunes Telles de Almeida:** Modalidades. Pilates. Ah, pilates. Mais aulas.

**Andre Felicissimo:** Hum.

**Sidnei Felipe Nunes Telles de Almeida:** É.

**Andre Felicissimo:** Fisioterapia é clara.

**Sidnei Felipe Nunes Telles de Almeida:** Mas você não tem plano pela

**Andre Felicissimo:** O quê?

**Sidnei Felipe Nunes Telles de Almeida:** empresa?

**Andre Felicissimo:** Do quê? De fisioterapia.

**Sidnei Felipe Nunes Telles de Almeida:** Convênio.

**Andre Felicissimo:** Não tô

**Sidnei Felipe Nunes Telles de Almeida:** Convênio de saúde. Pô, mano, pesquisa,

**Andre Felicissimo:** rodando

**Sidnei Felipe Nunes Telles de Almeida:** pesquisa aí o plano Santa Saúde.

**Andre Felicissimo:** mais popular.

**Sidnei Felipe Nunes Telles de Almeida:** Ó, tipo assim, ó. Eu pego, ó, é para mim e minhas duas filhas, eu faço pela minha empresa, dá 430 por mês, mano.

**Andre Felicissimo:** É

**Sidnei Felipe Nunes Telles de Almeida:** É barato, pô.

**Andre Felicissimo:** barato,

**Sidnei Felipe Nunes Telles de Almeida:** E dá para usar para tudo. É, passa só de só de terapia delas é R$ 2.000 por mês que eles cobrem, que já compensa de de psicólogo e outras

### **01:26:25** {#01:26:25}

**Andre Felicissimo:** c\*\*\*\*\*\*.

**Sidnei Felipe Nunes Telles de Almeida:** terapias lá.

**Andre Felicissimo:** Uhum.

**Sidnei Felipe Nunes Telles de Almeida:** Tá ligado? Então,

**Andre Felicissimo:** Eu vou dar uma olhada e deixa eu falar futuramente eu acho

**Sidnei Felipe Nunes Telles de Almeida:** vale a pena para c\*\*\*\*\*\*.

**Andre Felicissimo:** que eu eh preciso de nota, viu? De da gente vai até bater os impostos da empresa. Você acha que você consegue emitir?

**Sidnei Felipe Nunes Telles de Almeida:** Consigo, mas aí você vai ter que começar a mandar no meu Pix do da minha conta da empresa.

**Andre Felicissimo:** Ah, da empresa. Sim, sim, sim.

**Sidnei Felipe Nunes Telles de Almeida:** Eu te mando. Eu tenho que eu tenho conta já de empresa também.

**Andre Felicissimo:** Mas você já emitiu nota de serviço?

**Sidnei Felipe Nunes Telles de Almeida:** Não permiti, mas não deve ser segredo. Eu pergun eu pergunto para

**Andre Felicissimo:** Se ela emite automaticamente no joga no N.

**Sidnei Felipe Nunes Telles de Almeida:** É, pô,

**Andre Felicissimo:** Demorou. Mais pra frente agora.

**Sidnei Felipe Nunes Telles de Almeida:** quanto quanto menos coisa eu precisar

**Andre Felicissimo:** Não é problema.

**Sidnei Felipe Nunes Telles de Almeida:** fazer.

### **01:27:19** {#01:27:19}

**Andre Felicissimo:** Eu vou programar para fazer a conta do mais um.

**Sidnei Felipe Nunes Telles de Almeida:** Mano, eu fiz um vídeo daqueles de 8 horas pro YouTube que você falou.

**Andre Felicissimo:** Do quê?

**Sidnei Felipe Nunes Telles de Almeida:** Eu eu fiz um vídeo de 8 horas pro YouTube,

**Andre Felicissimo:** Do quê? 8

**Sidnei Felipe Nunes Telles de Almeida:** só que é só que não é do jeito que você tá

**Andre Felicissimo:** horas.

**Sidnei Felipe Nunes Telles de Almeida:** imaginando, é aqueles vídeos de afirmações positivas, tá ligado? Daí, tipo,

**Andre Felicissimo:** Aham.

**Sidnei Felipe Nunes Telles de Almeida:** eu mandei a Gemin fazer, eu nem usei nada seu, eu usei só, tipo assim,

**Andre Felicissimo:** Угу.

**Sidnei Felipe Nunes Telles de Almeida:** eu mandei o Gemini fazer tipo 30 frases de afirmações positivas, tipo assim, ó, o universo, o universo conspira a meu favor, sabe? Tipo,

**Andre Felicissimo:** Aham.

**Sidnei Felipe Nunes Telles de Almeida:** coisas boas vindo na minha direção, essas coisas assim.

**Andre Felicissimo:** E 8 horas.

**Sidnei Felipe Nunes Telles de Almeida:** E aí eu fiz a música.

**Andre Felicissimo:** Isso

**Sidnei Felipe Nunes Telles de Almeida:** Isso aí eu fiz um script aqui em Python que ele repete tipo a música e o bagulho durante 8 horas e e ele renderizou,

### **01:28:18** {#01:28:18}

**Andre Felicissimo:** e subiu e deu alguma

**Sidnei Felipe Nunes Telles de Almeida:** mano. Hã,

**Andre Felicissimo:** visualização,

**Sidnei Felipe Nunes Telles de Almeida:** 20 visualizações, velho.

**Andre Felicissimo:** c\*\*\*\*\*\*.

**Sidnei Felipe Nunes Telles de Almeida:** Aí eu peguei um outro aqui que ele,

**Andre Felicissimo:** Bom,

**Sidnei Felipe Nunes Telles de Almeida:** tipo, ele entrou numa API e pegou tipo uns vídeos de natureza, tá ligado? Uns vídeos gratuitos de natureza assim,

**Andre Felicissimo:** para relaxar.

**Sidnei Felipe Nunes Telles de Almeida:** fundo do mar, tá ligado? E e aí uma música que eu gerei no próprio Giná é assim, tipo, ah, gerar uma música,

**Andre Felicissimo:** Ага.

**Sidnei Felipe Nunes Telles de Almeida:** tá ligado, de relaxamento e tal. E publiquei aqui, mano. Vamos ver o que que dá, porque, pô, 8 horas é tem anúncio para c\*\*\*\*\*\*, não é?

**Andre Felicissimo:** Mas faz sentido, vai.

**Sidnei Felipe Nunes Telles de Almeida:** Não.

**Andre Felicissimo:** Eu acho que vídeo longo é é um coisa que a gente tem que ter atenção também mais pra frente que a

**Sidnei Felipe Nunes Telles de Almeida:** É porque eu tipo assim,

### **01:29:04**

**Andre Felicissimo:** gente não acho que nem é vídeo longo em si,

**Sidnei Felipe Nunes Telles de Almeida:** eu vi uma aqui, ó. Mina, a mina fez

**Andre Felicissimo:** mas o formato do vídeo, né, que é aquele vídeo que aparece na na

**Sidnei Felipe Nunes Telles de Almeida:** o vídeo aqui, ó, tipo, fica tipo 8 horas repetindo as mesmas 30 frases e

**Andre Felicissimo:** tela.

**Sidnei Felipe Nunes Telles de Almeida:** tá com 60.000 visualizações, velho. 15 milhão e meio de inscritos no canal.

**Andre Felicissimo:** c\*\*\*\*\*\*, desses vídeos m\*\*\*\*.

**Sidnei Felipe Nunes Telles de Almeida:** É uns vídeos tipo paraa pessoa é reprogramação neurológica não é tão m\*\*\*\*,

**Andre Felicissimo:** Uhum.

**Sidnei Felipe Nunes Telles de Almeida:** mano. Tipo assim,

**Andre Felicissimo:** Não, não tô falando vídeo com pouco trabalho de ser

**Sidnei Felipe Nunes Telles de Almeida:** eh, é porque é uma parada boa,

**Andre Felicissimo:** feito.

**Sidnei Felipe Nunes Telles de Almeida:** na verdade, na verdade, isso é uma boa maneira de curar depressão, sabia?

**Andre Felicissimo:** Uhum.

**Sidnei Felipe Nunes Telles de Almeida:** Que é reprogramação neurolinguística.

**Andre Felicissimo:** Sim.

**Sidnei Felipe Nunes Telles de Almeida:** A maioria, tipo,

### **01:29:52**

**Andre Felicissimo:** É. Eh, como chama?

**Sidnei Felipe Nunes Telles de Almeida:** a maioria das pessoas que tá em depressão é porque o subconsciente dela acredita

**Andre Felicissimo:** PNL, não é?

**Sidnei Felipe Nunes Telles de Almeida:** que ela é um m\*\*\*\*, tá ligado?

**Andre Felicissimo:** o ambiente,

**Sidnei Felipe Nunes Telles de Almeida:** No subconsciente ela é um lixo.

**Andre Felicissimo:** né?

**Sidnei Felipe Nunes Telles de Almeida:** E aí, mano, o cérebro, né, vai fazer aquilo se tornar verdade, né? Tá ligado?

**Andre Felicissimo:** Total.

**Sidnei Felipe Nunes Telles de Almeida:** Então é interessante essas reprogramação neurolinguística quando você tipo acredita que a parada que você merece, né?

**Andre Felicissimo:** Você você agora só tem uma pergunta.

**Sidnei Felipe Nunes Telles de Almeida:** Uma coisa de fato.

**Andre Felicissimo:** Você viu o vídeo todo?

**Sidnei Felipe Nunes Telles de Almeida:** Hã,

**Andre Felicissimo:** Você viu o vídeo todo?

**Sidnei Felipe Nunes Telles de Almeida:** eu vi, eu pô, eu fui dormir e deixei enrolando.

**Andre Felicissimo:** Hã,

**Sidnei Felipe Nunes Telles de Almeida:** Aham. É maió bom, pô. É maió bom.

**Andre Felicissimo:** bom. É,

**Sidnei Felipe Nunes Telles de Almeida:** Maió bom.

### **01:30:35**

**Andre Felicissimo:** minha mãe, minha mãe, ela fez um curso de inglês que era assim que você escutava inglês dormindo.

**Sidnei Felipe Nunes Telles de Almeida:** Ah, mas aí é

**Andre Felicissimo:** Não aprendeu,

**Sidnei Felipe Nunes Telles de Almeida:** f\*\*\*.

**Andre Felicissimo:** não aprendeu, não funcionou. Vai demorar, irmão.

**Sidnei Felipe Nunes Telles de Almeida:** Ô,

**Andre Felicissimo:** Vou parar de

**Sidnei Felipe Nunes Telles de Almeida:** ô, você chegou a fazer aquelas vendas de afiliado,

**Andre Felicissimo:** fome.

**Sidnei Felipe Nunes Telles de Almeida:** mano, nos Estados Unidos? Já fez tipo em loja da Amazon, essas paradas?

**Andre Felicissimo:** Mas afiliado tem tudo agora, viu? Não é só eu nunca fiz afiliado, mas é tem tudo. Mercado Livre, TikTok é basicamente afiliado, né?

**Sidnei Felipe Nunes Telles de Almeida:** É,

**Andre Felicissimo:** É basicamente.

**Sidnei Felipe Nunes Telles de Almeida:** pode crer.

**Andre Felicissimo:** Mas agora Mercado Livre tem todos os sitesão tendo. Shopee tem.

**Sidnei Felipe Nunes Telles de Almeida:** Mas o TikTok, como assim é afiliado? Sendo que você entrega o

**Andre Felicissimo:** É, o produto é meu, mas o a pessoa que que gerou a venda,

### **01:31:24** {#01:31:24}

**Sidnei Felipe Nunes Telles de Almeida:** produto?

**Andre Felicissimo:** teoricamente, né?

**Sidnei Felipe Nunes Telles de Almeida:** É o TikTok.

**Andre Felicissimo:** O vídeo da é o vídeo da pessoa que gerou a venda.

**Sidnei Felipe Nunes Telles de Almeida:** Meu Deus, que loucura é essa que o cara o cara fazese modular, mano. Nossa, velho.

**Andre Felicissimo:** Nem sei o que que é isso.

**Sidnei Felipe Nunes Telles de Almeida:** Aí vou te mostrar.

**Andre Felicissimo:** Enfim, tive que pesquisar agora, né?

**Sidnei Felipe Nunes Telles de Almeida:** Síntese modular. É isso aqui, ó. Eh, aqueles sistemas antigos de síntese de som.

**Andre Felicissimo:** Vem, vem. Para que que ele faz essa p\*\*\*\*? Tá para

**Sidnei Felipe Nunes Telles de Almeida:** Ah, autismo, né,

**Andre Felicissimo:** dormir,

**Sidnei Felipe Nunes Telles de Almeida:** mano? Autismo.

**Andre Felicissimo:** c\*\*\*\*\*\*. 97.000 Vi que

**Sidnei Felipe Nunes Telles de Almeida:** Problema

**Andre Felicissimo:** maluquice.

**Sidnei Felipe Nunes Telles de Almeida:** é difícil para c\*\*\*\*\*\* isso aí, velho. Dá para perceber,

**Andre Felicissimo:** Dá e complexo.

**Sidnei Felipe Nunes Telles de Almeida:** né?

**Andre Felicissimo:** É. Falou Sid. Vou arrangar aqui. Falou.

**Sidnei Felipe Nunes Telles de Almeida:** Oi.

**Andre Felicissimo:** Vou tomar um banho e deitar.

**Sidnei Felipe Nunes Telles de Almeida:** Demorou, mano. Eh,

**Andre Felicissimo:** Mas a gente faz uma reunião 4 horas.

**Sidnei Felipe Nunes Telles de Almeida:** a gente vai se falando.

**Andre Felicissimo:** Pode ser demorar.

**Sidnei Felipe Nunes Telles de Almeida:** Pode ser.

**Andre Felicissimo:** Então,

**Sidnei Felipe Nunes Telles de Almeida:** falou,

**Andre Felicissimo:** falô,

**Sidnei Felipe Nunes Telles de Almeida:** abraço.

**Andre Felicissimo:** um abraço.

### **A transcrição foi encerrada após 01:33:01**

*Esta transcrição editável foi gerada por computador e pode conter erros. As pessoas também podem alterar o texto depois que ele for criado.*