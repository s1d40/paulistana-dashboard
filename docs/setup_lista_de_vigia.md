# Guia de Configuração: Lista de Vigia e Gráficos de Ranking
**O Passo a Passo para ligar o Motor de Monitoramento Diário do Mercado Livre**

Para que o botão verde "Vigiar Concorrentes" pare de dar o "Alerta de Simulação" e os "Gráficos de Ranking" comecem a ser desenhados com dados reais todos os dias, você precisa conectar as três pontas do nosso sistema: o **Supabase** (Banco de Dados), o **Painel Next.js** (Frontend) e o **n8n** (O Robô Diário).

Siga os passos abaixo:

---

## Passo 1: Criar as Tabelas no Supabase
Precisamos de duas tabelas. Uma para guardar **quem** estamos vigiando, e outra para guardar o **histórico** de preços diários deles.

1. Acesse seu painel do Supabase.
2. Vá em **SQL Editor** e rode o seguinte código:

```sql
-- Tabela 1: Lista de quem estamos monitorando
CREATE TABLE ml_watchlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE, -- O ID do ML, ex: MLB12345
  category_id TEXT,
  title TEXT,
  thumbnail TEXT,
  permalink TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabela 2: Onde o n8n vai gravar o preço todo dia (Histórico)
CREATE TABLE ml_competitor_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id TEXT NOT NULL,
  category_id TEXT,
  title TEXT,
  thumbnail TEXT,
  permalink TEXT,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rank INTEGER,
  price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

---

## Passo 2: Ligar o Botão do Painel no Banco de Dados
Agora que o banco existe, o botão da interface tem que salvar os concorrentes lá.
*Eu, Antigravity, farei isso para você no código fonte (Next.js) assim que você me der autorização!*

O que o meu código vai fazer:
- Ao invés de um `alert()`, o botão "Vigiar Concorrentes" vai enviar os IDs marcados para a tabela `ml_watchlist` usando nossa conexão do Supabase.

---

## Passo 3: Criar o Robô Diário no n8n
Essa é a parte onde a mágica acontece sozinha enquanto vocês dormem.

Você vai criar um **Novo Workflow no n8n** com os seguintes nós (nodes):

1. **Trigger (Schedule Trigger):**
   - Configurado para rodar `Every Day` (Todo dia) às `00:00`.
   
2. **Supabase (Read):**
   - Operação: `Get Many`.
   - Tabela: `ml_watchlist`.
   - *O que ele faz: Puxa a lista de todos os produtos que o André mandou vigiar.*

3. **Code (Agrupar IDs):**
   - Como o Mercado Livre deixa consultar no máximo 20 itens de uma vez, adicione um nó de "Code" e cole exatamente o seguinte código JavaScript para juntar os IDs retornados pelo Supabase:
   
   ```javascript
   // Pega todos os itens (linhas) que o Supabase retornou
   const items = $input.all();
   
   // Vamos separar em pacotes de no máximo 20 IDs (limite da API do ML)
   const BATCH_SIZE = 20;
   let batches = [];
   
   // Extrair apenas os "product_id" (ex: MLB12345) de dentro do json do n8n
   const allIds = items.map(item => item.json.product_id).filter(id => id);
   
   // Se a tabela estiver vazia, encerra a execução
   if (allIds.length === 0) return [];
   
   // Fatiar a lista em pacotes de 20 em 20
   for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
     const lote = allIds.slice(i, i + BATCH_SIZE);
     // Transformar ["MLB1", "MLB2"] em "MLB1,MLB2"
     const ids_agrupados = lote.join(',');
     
     // Criar o item de saída pro próximo nó do n8n ler
     batches.push({
       json: {
         ids_agrupados: ids_agrupados,
         quantidade_no_lote: lote.length
       }
     });
   }
   
   // O n8n agora vai rodar os próximos passos UMA VEZ para cada pacote!
   return batches;
   ```

4. **HTTP Request (Consultar Mercado Livre):**
   - Method: `GET`
   - URL: `https://api.mercadolibre.com/items?ids={{$json.ids_agrupados}}`
   - Headers: 
     - Name: `Authorization`
     - Value: `Bearer APP_USR-3458412211001437-060914-5482e0e56855a399e6e2d4b73b60e147-428354884`
   - *(Aviso para o futuro: Esse token que eu colei acima é válido por 6 horas pra você poder testar o fluxo hoje e mostrar pro André. Pro robô rodar sozinho todos os dias para sempre, depois teremos que plugar o n8n no nosso script renovador de tokens Python!)*

5. **Item Lists / Split In Batches:**
   - Para separar a resposta do ML em itens individuais.

6. **Supabase (Insert):**
   - Operação: `Insert`.
   - Tabela: `ml_competitor_history`.
   - Mapeamento:
     - `product_id`: `={{$json.body.id}}`
     - `price`: `={{$json.body.price}}`
     - `snapshot_date`: `={{$now.format('yyyy-MM-dd')}}`
   - *O que ele faz: Salva a "foto" do preço de hoje no banco.*

---

## Resumo do Fluxo na Prática:
1. O André marca 5 concorrentes de Castanha e clica em **Vigiar Concorrentes**.
2. O Painel Next.js salva esses 5 caras na tabela `ml_watchlist`.
3. Todo dia à meia-noite, o seu n8n acorda, olha a tabela `ml_watchlist`, consulta o preço deles atualizado na API do ML, e salva na tabela `ml_competitor_history`.
4. O André abre a aba **"Gráficos de Ranking"**, e a mágica acontece: o nosso painel Next.js puxa os dados do `ml_competitor_history` e plota o gráfico de linhas perfeito, com as altas e quedas de preço de cada um!

**O que fazer agora?**
Se quiser, rode aquele script SQL no Supabase agora mesmo. Assim que rodar, me avise que eu já escrevo e publico a API que liga o botão verde no banco de dados!
