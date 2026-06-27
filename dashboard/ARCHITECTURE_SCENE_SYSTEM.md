# Arquitetura de Produção de Cenas (UUID `id_cena` Base)

Este documento descreve a arquitetura atualizada (Maio 2026) do sistema de geração de vídeos, focada no fluxo de dados entre o Frontend (Dashboard), os Workers de Automação (n8n) e o Banco de Dados (Supabase).

## Problema Anterior
Nas versões anteriores, as cenas eram identificadas no banco de dados pela combinação de `id_post` + `numero_cena`. O banco possuía uma chave única forçando que não houvesse duas cenas número "1" para o mesmo post. 

**Problemas gerados:**
1. **Reordenação e Exclusão:** Se o usuário movesse a Cena 1 para a posição 5, o `numero_cena` no Frontend mudava. Ao tentar regerar ou re-salvar, os assets antigos (áudios e imagens que ainda estavam com o `numero_cena` = 1) ficavam órfãos ou causavam violações de chave primária (`duplicate key value violates unique constraint`).
2. **Ciclo de Vida Indefinido:** O n8n gerava os UUIDs das linhas *apenas no final* da execução do workflow de geração. Assim, o frontend não tinha como rastrear de forma unívoca o asset gerado para associar com precisão ao seu estado local na UI.

---

## Solução Adotada: Frontend como "Dono" da Identidade (Source of Truth)

Foi implementada uma arquitetura baseada em **Identificadores Únicos Estáveis** (`id_cena`), gerados precocemente pelo Frontend. 

### 1. Nascimento da Cena (Frontend)
Qualquer cena nasce de duas formas no painel (`video-studio.tsx`):
1. **Pelo Agente de IA (Roteiro):** Ao parsear o JSON retornado pelo Agente, o Frontend itera no array de cenas. Se uma cena não possui `id_cena`, o Frontend imediatamente injeta um gerado via `crypto.randomUUID()`.
2. **Pelo Usuário (Botão `+`):** Ao inserir uma nova cena manualmente na timeline, a função `insertScene` já cria um objeto de cena contendo um `id_cena` novo e limpo.

> O **JSON salvo na tabela `posts`** (onde fica o roteiro) é a **Fonte da Verdade**. A coluna `numero` serve *apenas para ordenação visual na UI*, e não mais como identificador relacional absoluto.

### 2. O Fluxo de Geração (Payloads Webhook)
Quando o usuário aciona os botões de "Gerar Imagem", "Gerar Áudio" ou "Gerar Vídeo", o Frontend dispara webhooks para o n8n. 
O Zustand Store (`production-queue.ts`) foi atualizado para **sempre injetar o `id_cena` no payload**:

```json
{
  "action": "render_scene",
  "id_post": "uuid-do-post",
  "id_cena": "uuid-da-cena-estavel", 
  "numero_cena": 5,
  "video_url": "...",
  // ...
}
```

### 3. Persistência de Dados (n8n -> Supabase)
Os workers do n8n não criam mais IDs arbitrários para as entidades relacionais das cenas. Eles respeitam o `id_cena` enviado pelo Payload e utilizam o comando SQL `UPSERT` (Update or Insert) mapeando este UUID nas tabelas secundárias.

#### Estrutura Atualizada do Banco de Dados:
1. **Tabela `imagens`:**
   - Possui a nova coluna `id_cena UUID`. 
   - O n8n insere relacionando a imagem gerada a este `id_cena`.
2. **Tabela `audios`:**
   - Possui a nova coluna `id_cena UUID`.
   - O n8n insere relacionando o áudio gerado a este `id_cena`.
3. **Tabela `videos_cenas` (A mais importante):**
   - A constraint limitadora `UNIQUE(id_post, numero_cena)` foi **removida**.
   - A coluna primária `id` agora é **Mapeada diretamente para o `id_cena`** fornecido pelo frontend.
   - O nó do n8n realiza um `UPSERT` utilizando a chave de conflito `id`.

### Resiliência e Comportamento Prático (O "Refazer")
Graças ao uso do `UPSERT` baseado no `id_cena`, o sistema se tornou imune a duplicações ao acionar a funcionalidade de "Refazer" (Re-roll).

**Exemplo Prático:**
1. A cena "X" (`id_cena: 123`) foi gerada.
2. O usuário move a cena da posição 2 para a posição 4. O `numero_cena` muda no array do frontend, mas o `id_cena` continua sendo `123`.
3. O usuário pede para **Refazer** o vídeo desta cena.
4. O n8n processa e faz o UPSERT no Supabase passando `id = 123` e `numero_cena = 4`.
5. Como o registro `123` já existe na tabela `videos_cenas`, o Supabase não cria uma nova linha. Ele **apenas atualiza** o link do vídeo e conserta o `numero_cena` antigo (2) para o novo (4).

Isso garante que o banco de dados esteja sempre sincronizado com o script em JSON, sem lixo, sem registros órfãos e sem travamentos por violação de regras de chave.
