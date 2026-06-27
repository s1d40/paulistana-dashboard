# Guia de Criação Manual: Workflow de Agendamento Automático (n8n)

Devido ao problema na importação de arquivos JSON, siga o passo a passo abaixo para construir o "Motor de Agendamento" manualmente no n8n.

## 1. Nó Gatilho: Schedule Trigger
- **Nome do Nó:** Cron (A cada 15 min)
- **Tipo:** `Schedule Trigger`
- **Configuração:** 
  - Adicione uma regra (`Add Rule`).
  - Em **Interval**, coloque `15` e selecione **Minutes**.

---

## 2. Nó de Banco de Dados: Buscar Posts
- **Nome do Nó:** Buscar Posts Agendados
- **Tipo:** `PostgreSQL`
- **Conecte a partir de:** Saída do nó Schedule Trigger.
- **Configuração:**
  - **Credential:** Selecione a credencial do seu Supabase.
  - **Operation:** `Execute Query`
  - **Query:**
    ```sql
    SELECT id_post, id_conta 
    FROM posts 
    WHERE status_agendamento = 'agendado' 
    AND data_agendamento <= NOW();
    ```

---

## 3. Nó Lógico: IF
- **Nome do Nó:** Existem posts?
- **Tipo:** `If`
- **Conecte a partir de:** Saída do nó PostgreSQL (Buscar Posts).
- **Configuração:**
  - **Conditions:** Boolean.
  - **Value 1:** Mude para *Expression* e cole: `={{ $json.id_post ? true : false }}`
  - **Value 2:** Mantenha `true`.
  *(Isso evita que o fluxo continue se a query não retornar nenhum post).*

---

## 4. Nó de Loop: Split In Batches
- **Nome do Nó:** Loop de Posts
- **Tipo:** `Split In Batches` (ou `Loop` nas versões mais recentes do n8n)
- **Conecte a partir de:** Saída **True** do nó If.
- **Configuração:**
  - **Batch Size:** `1`

---

## 5. Nó de Ação: Execute Workflow
- **Nome do Nó:** Publicar nas 3 Redes
- **Tipo:** `Execute Workflow`
- **Conecte a partir de:** Saída do nó Loop.
- **Configuração:**
  - **Workflow ID:** Selecione o seu workflow existente que faz a postagem nas redes sociais.
  - **Mode:** `Run Once for Each Item` (ou `each`).
  *(Ao usar este nó, o ID do post atual no loop será passado para o sub-workflow, onde a lógica de postagem ocorrerá).*

---

## 6. Nó de Banco de Dados: Atualizar Status
- **Nome do Nó:** Atualizar Status para Publicado
- **Tipo:** `PostgreSQL`
- **Conecte a partir de:** Saída do nó Execute Workflow.
- **E para fechar o Loop:** Conecte a saída deste nó de volta para a entrada do nó **Loop de Posts**.
- **Configuração:**
  - **Credential:** Selecione a credencial do seu Supabase.
  - **Operation:** `Execute Query`
  - **Query:**
    ```sql
    UPDATE posts 
    SET status_agendamento = 'publicado' 
    WHERE id_post = $1;
    ```
  - Abra as opções adicionais (`Add Option`) e selecione **Query Parameters**.
  - No campo de parâmetros, coloque como expressão: `={{ $json.id_post }}`

---

## Resumo Visual da Conexão dos Nós:
1. `Schedule Trigger` ➡️ `PostgreSQL (Buscar)`
2. `PostgreSQL (Buscar)` ➡️ `IF`
3. `IF (Caminho TRUE)` ➡️ `Loop`
4. `Loop` ➡️ `Execute Workflow`
5. `Execute Workflow` ➡️ `PostgreSQL (Atualizar)`
6. `PostgreSQL (Atualizar)` ➡️ Retorna para a entrada do `Loop`.
