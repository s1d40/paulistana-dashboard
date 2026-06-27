# TERMOS DE USO E POLÍTICA DE PRIVACIDADE
## Plataforma Paulistana Content Studio

**Versão:** 1.0  
**Data de vigência:** 01 de Julho de 2026  
**Última atualização:** 26 de Junho de 2026

---

> [!CAUTION]
> **AVISO LEGAL:** Este documento é uma minuta técnica elaborada para fins de planejamento. Antes de publicar e utilizar estes Termos de Uso com clientes reais, é obrigatório que um advogado especialista em Direito Digital e LGPD (Lei Geral de Proteção de Dados) revise e valide o conteúdo. A equipe da Paulistana Content Studio não se responsabiliza por decisões tomadas sem a devida assessoria jurídica.

---

## 1. IDENTIFICAÇÃO DAS PARTES

**CONTRATADA (Prestadora de Serviços):**
- Razão Social: [Razão Social da Empresa]
- CNPJ: [CNPJ]
- Endereço: [Endereço Completo]
- E-mail para contato: contato@paulistanaemporio.com.br
- Denominada neste documento como **"Paulistana Content Studio"** ou **"Plataforma"**.

**CONTRATANTE (Cliente):**
- Pessoa física ou jurídica que aceita os presentes termos ao realizar o cadastro e/ou utilizar os serviços da Plataforma.
- Denominada neste documento como **"Cliente"** ou **"Usuário"**.

---

## 2. OBJETO DO CONTRATO

A **Paulistana Content Studio** é uma plataforma de tecnologia voltada para vendedores do Mercado Livre que oferece os seguintes serviços:

2.1. **Criação Automatizada de Conteúdo:** Geração automática de vídeos para redes sociais (Instagram, TikTok, YouTube Shorts) com base no catálogo de produtos do Cliente no Mercado Livre, incluindo roteiro, narração por voz sintética, composição de imagens e legendas.

2.2. **Inteligência Competitiva (Market Intelligence):** Monitoramento de concorrentes, análise de preços, ranking de vendedores e identificação de oportunidades de mercado dentro das categorias em que o Cliente opera.

2.3. **Análise de Performance de Anúncios:** Coleta e apresentação de dados de desempenho dos anúncios do próprio Cliente no Mercado Livre, incluindo métricas de visitas, impressões, taxas de conversão e tendências históricas.

2.4. **Lista de Vigia (Watchlist):** Monitoramento diário automatizado de anúncios de concorrentes selecionados pelo Cliente, com alertas de variação de preço e posicionamento.

---

## 3. AUTORIZAÇÃO DE ACESSO À CONTA DO MERCADO LIVRE

**Esta é a cláusula mais relevante. Leia com atenção.**

3.1. Para a prestação dos serviços descritos neste contrato, o Cliente autoriza expressamente a **Paulistana Content Studio** a acessar sua conta no Mercado Livre por meio do protocolo de autenticação seguro **OAuth 2.0**, conforme disponibilizado pela API oficial do Mercado Livre.

3.2. **O acesso é concedido pelo próprio Cliente** através do fluxo de conexão disponível na Plataforma, sendo redirecionado para a página oficial do Mercado Livre para autenticação. A Paulistana Content Studio **jamais solicitará** a senha do Mercado Livre do Cliente diretamente.

3.3. **Escopo do acesso autorizado:**

| Tipo de Dado | Finalidade | Obrigatório? |
|---|---|---|
| Listagem de anúncios ativos do Cliente | Identificar produtos para gerar conteúdo | ✅ Sim |
| Títulos, descrições e imagens dos anúncios | Base para geração de vídeos e textos | ✅ Sim |
| Métricas de visitas e vendas dos anúncios | Análise de performance | ✅ Sim |
| Histórico de preços do próprio Cliente | Sugestão de precificação competitiva | ✅ Sim |
| Dados públicos de concorrentes (via API pública ML) | Inteligência competitiva e Watchlist | ✅ Sim |
| Dados financeiros detalhados de pedidos | Não coletado | ❌ Não |
| Dados pessoais de compradores do Cliente | Não coletado | ❌ Não |

3.4. O **token de acesso** (chave de autorização) fornecido pelo Mercado Livre é armazenado de forma **criptografada com algoritmo AES-256** nos servidores da Plataforma. Nunca é armazenado em texto legível.

3.5. O Cliente pode **revogar este acesso a qualquer momento** diretamente no painel de "Aplicativos Autorizados" da sua conta no Mercado Livre, ou entrando em contato com o suporte da Paulistana Content Studio. A revogação encerra imediatamente a coleta de novos dados, sem prejuízo dos dados já coletados e dos serviços em andamento.

---

## 4. USO DOS DADOS COLETADOS

4.1. **Uso individual (exclusivo do Cliente):** Os dados específicos da conta do Cliente (seus anúncios, suas métricas, sua lista de vigia) são utilizados exclusivamente para prestar os serviços contratados a ele. Nenhum dado identificado do Cliente é compartilhado com outros clientes da Plataforma.

4.2. **Uso agregado e anonimizado (Inteligência de Mercado Coletiva):** A Plataforma poderá utilizar dados estatísticos agregados e anonimizados — que não permitam a identificação de nenhum Cliente individual — para construir indicadores de mercado, como:
   - Médias de preço por categoria de produto.
   - Taxas de conversão médias do setor.
   - Tendências de demanda por tipo de produto.
   
   Esses indicadores enriquecem os relatórios de inteligência competitiva disponibilizados a todos os Clientes da Plataforma, de forma que **nenhum dado individual identificado seja exposto**.

4.3. A Paulistana Content Studio **não vende, não aluga, não cede e não comercializa** dados pessoais ou dados de negócio identificados de seus Clientes a terceiros, sob qualquer hipótese.

4.4. Os dados poderão ser utilizados para melhoria dos próprios serviços da Plataforma, incluindo treinamento de modelos de inteligência artificial proprietários para geração de conteúdo mais relevante, sempre de forma anonimizada.

---

## 5. SEGURANÇA DAS INFORMAÇÕES

5.1. A Plataforma adota as seguintes medidas de segurança técnica e organizacional:
   - **Criptografia em trânsito:** Toda comunicação entre o Cliente e a Plataforma utiliza protocolo HTTPS/TLS 1.3.
   - **Criptografia em repouso:** Tokens de acesso e informações sensíveis são criptografados com AES-256 antes de serem armazenados no banco de dados.
   - **Acesso por privilégio mínimo:** Sistemas internos acessam apenas os dados estritamente necessários para sua função específica.
   - **Logs de auditoria:** Todos os acessos a dados sensíveis são registrados com data, hora e sistema de origem.
   - **Sem persistência de segredos:** Tokens descriptografados existem apenas na memória RAM do servidor durante o período de uso e nunca são gravados em arquivos de log ou banco de dados em texto puro.

5.2. Em caso de incidente de segurança que possa afetar os dados do Cliente, a Plataforma se compromete a notificá-lo em até **72 horas** após a confirmação do incidente, conforme exigido pela Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).

---

## 6. CONFORMIDADE COM A LGPD

6.1. A Paulistana Content Studio atua como **Operadora de Dados**, conforme definido pela Lei Geral de Proteção de Dados (LGPD), processando dados sob instrução e autorização do Cliente, que é o **Controlador de Dados** de sua própria operação no Mercado Livre.

6.2. A base legal para o tratamento de dados é o **consentimento expresso do Cliente** (Art. 7º, I da LGPD) formalizado neste instrumento, e a **execução de contrato** (Art. 7º, V da LGPD) para prestação dos serviços contratados.

6.3. **Direitos do Titular dos Dados (Cliente):**
   - Confirmar a existência de tratamento de seus dados.
   - Acessar seus dados mantidos pela Plataforma.
   - Solicitar a correção de dados incompletos ou desatualizados.
   - Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.
   - Solicitar a portabilidade dos dados a outro fornecedor.
   - Revogar o consentimento a qualquer momento.

Para exercer esses direitos, entre em contato pelo e-mail: **privacidade@paulistanaemporio.com.br**

6.4. **Encarregado de Proteção de Dados (DPO):** [Nome do DPO ou "A ser designado"].

---

## 7. CONFORMIDADE COM OS TERMOS DO MERCADO LIVRE

7.1. O uso da API do Mercado Livre pela Paulistana Content Studio é realizado em conformidade com os [Termos e Condições de Uso da API do Mercado Livre](https://developers.mercadolivre.com.br/es_ar/terminos-y-condiciones), e o Cliente declara ciência de que o uso dos serviços da Plataforma não deve violar os próprios Termos de Uso do Mercado Livre aos quais o Cliente está sujeito como vendedor.

7.2. A Plataforma não realiza scraping (extração não autorizada) de dados do Mercado Livre. Toda coleta é feita exclusivamente por meio da API oficial, com autenticação e dentro dos limites de requisição (rate limits) estabelecidos pelo Mercado Livre.

---

## 8. LIMITAÇÃO DE RESPONSABILIDADE

8.1. A **Paulistana Content Studio** não se responsabiliza por:
   - Indisponibilidade ou mudanças na API do Mercado Livre que afetem a coleta de dados.
   - Imprecisões nos dados fornecidos diretamente pela API do Mercado Livre.
   - Decisões comerciais tomadas pelo Cliente com base nas análises e relatórios gerados pela Plataforma.
   - Variações de performance de anúncios decorrentes da aplicação ou não dos conteúdos gerados.

8.2. A Plataforma oferece os dados de inteligência competitiva **como ferramenta de apoio à decisão**, não como garantia de resultados comerciais.

---

## 9. VIGÊNCIA E RESCISÃO

9.1. Estes Termos vigem por prazo indeterminado, a partir da data de aceite pelo Cliente.

9.2. O Cliente pode rescindir o contrato a qualquer momento, através do cancelamento da conta na Plataforma, o que implica automaticamente a revogação das autorizações de acesso e a solicitação de exclusão dos dados, conforme Art. 16 da LGPD, observados os prazos legais de guarda.

9.3. A Paulistana Content Studio pode rescindir o contrato em caso de violação destes Termos, com notificação prévia de 15 (quinze) dias, exceto em casos de violação grave, onde a rescisão imediata se aplica.

---

## 10. ATUALIZAÇÕES DESTES TERMOS

10.1. Estes Termos podem ser atualizados periodicamente. O Cliente será notificado com antecedência mínima de **30 dias** antes da entrada em vigor de qualquer alteração material.

10.2. O uso continuado da Plataforma após a entrada em vigor das alterações constitui aceite dos novos termos.

---

## 11. FORO E LEI APLICÁVEL

11.1. Estes Termos são regidos pela legislação brasileira.

11.2. Fica eleito o foro da comarca de [Cidade/Estado] para dirimir quaisquer controvérsias decorrentes deste instrumento, com renúncia a qualquer outro, por mais privilegiado que seja.

---

## 12. ACEITE

Ao clicar em **"Aceito os Termos de Uso"** ou ao utilizar qualquer funcionalidade da Plataforma Paulistana Content Studio, o Usuário declara que:

- Leu e compreendeu integralmente os presentes Termos de Uso e Política de Privacidade.
- Está de acordo com todas as cláusulas, em especial com a autorização de acesso à sua conta no Mercado Livre (Cláusula 3).
- Tem capacidade jurídica para celebrar este contrato (é maior de 18 anos ou responsável legal por empresa).

---

*Paulistana Content Studio — Todos os direitos reservados.*  
*Para dúvidas: contato@paulistanaemporio.com.br*
