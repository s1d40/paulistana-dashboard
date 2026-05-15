# Guia de Configuração: Suporte a Hashtags no n8n

Para que o Arquiteto consiga definir e salvar as hashtags corretamente na plataforma, siga este passo a passo rápido:

## Passo 1: Atualizar o Banco de Dados (Supabase)
O seu painel já entende o campo `hashtags`, mas precisamos garantir que o banco de dados tem essa coluna.
1. Abra o painel do seu Supabase (`wolygamyyjgpoqsfefye.supabase.co`).
2. Vá no **SQL Editor**.
3. Copie o conteúdo do arquivo `add_hashtags_to_posts.sql` (ou simplesmente copie o código abaixo) e execute:
   ```sql
   ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hashtags TEXT;
   ```

## Passo 2: Atualizar a Ferramenta no n8n
Atualmente, a ferramenta (Tool Node) do n8n chamada `Definir_Metadados_Post` só espera e salva `titulo`, `tema` e `captions`.
1. Abra o fluxo (Workflow) do **Arquiteto** no seu n8n.
2. Procure pelo Tool Node correspondente a `Definir_Metadados_Post`.
3. **Na descrição/schema da ferramenta:**
   - Adicione o parâmetro `hashtags` do tipo `string`.
   - Coloque uma descrição clara, como: *"Hashtags estratégicas geradas para a rede social específica"*.
4. **No nó da Supabase (ou Postgres) logo após a ferramenta:**
   - Encontre a parte onde ele faz o `UPDATE` na tabela `posts` baseando-se no `id_post`.
   - Adicione a coluna `hashtags` para ser atualizada com o valor que chegou pelo schema da ferramenta.

## Pronto!
Feito isso, toda vez que o Arquiteto chamar a ferramenta `Definir_Metadados_Post(id_post, titulo, tema, captions, hashtags)`, a informação fluirá do chat direto para o banco, e seu Cockpit de Produção mostrará as hashtags prontas para uso.
