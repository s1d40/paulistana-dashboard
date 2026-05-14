# Especificação Técnica: Fábrica de Conteúdo (Orquestração via Frontend)

## 1. Visão Geral da Arquitetura
Nesta nova arquitetura, o **Frontend (Next.js Dashboard)** assume o papel de **Cérebro (Orquestrador)**. O n8n deixa de gerenciar esteiras complexas e passa a atuar exclusivamente como uma coleção de **Microsserviços/Workers Stateless**.

### O Fluxo de Trabalho:
1. **Frontend:** Gera UUID, reserva linha no Supabase e envia briefing para o Agente.
2. **Agente (Post_Init):** Registra o roteiro JSON no Supabase via n8n.
3. **Frontend (Assinante):** Detecta o novo roteiro, valida o tipo e inicia a **Fila de Produção Sequencial**.
4. **n8n (Workers):** Recebe comandos atômicos, executa a tarefa, faz upload para o GCS e retorna a URL final.

---

## 2. Especificação dos Workers n8n (Microsserviços)

### 2.1. Worker_Audio (TTS)
*   **Gatilho:** Webhook (POST)
*   **Input JSON:**
    ```json
    { 
      "id_post": "UUID", 
      "numero_cena": 1, 
      "texto_narrado": "...",
      "voice_settings": {
        "model_id": "eleven_multilingual_v2",
        "stability": 0.7,
        "similarity_boost": 0.75,
        "style": 0.15,
        "use_speaker_boost": true,
        "speed": 1.10
      }
    }
    ```
*   **Ações:**
    1. Enviar payload para ElevenLabs API respeitando os `voice_settings`.
    2. Upload do binário `.mp3` para GCS.
*   **Output:** `{ "status": "success", "gcs_url": "...", "numero_cena": 1 }`

### 2.2. Worker_Imagem (Unificado: IA & Slug)
*   **Gatilho:** Webhook (POST)
*   **Input JSON:**
    ```json
    {
      "id_post": "UUID",
      "numero_cena": 1,
      "usa_referencia": false,
      "replicate": {
        "model_url": "https://api.replicate.com/v1/models/google/nano-banana/predictions",
        "input": {
          "prompt": "...",
          "negative_prompt": "...",
          "aspect_ratio": "9:16",
          "output_format": "webp",
          "image_input": ["https://..."] 
        }
      },
      "slug_produto": "slug-opcional",
      "is_carrossel": false
    }
    ```
*   **Ações:**
    1. **Switch:** Se `replicate` estiver presente e `usa_referencia` for false, chama a URL em `model_url` enviando o objeto `input`.
    2. **Referência:** Se `usa_referencia` for true, copia o asset do GCS baseado no `slug_produto`.
    3. **Upload:** Salva o resultado final na pasta do post no GCS.
*   **Output:** `{ "status": "success", "gcs_url": "...", "numero_cena": 1 }`

### 2.4. Worker_Render_Cena (Individual)
*   **Gatilho:** Webhook (POST)
*   **Input JSON:**
    ```json
    { "id_post": "UUID", "numero_cena": 1, "audio_url": "...", "image_url": "...", "animacao": "zoom_in" }
    ```
*   **Ações:**
    1. Executar script Python (MoviePy) para unir 1 imagem e 1 áudio.
    2. Upload do `.mp4` para GCS: `posts/UUID/videos/cena_1.mp4`.
*   **Output:** `{ "status": "success", "gcs_url": "...", "numero_cena": 1 }`

### 2.5. Worker_Compilador_Final
*   **Gatilho:** Webhook (POST)
*   **Input JSON:**
    ```json
    { "id_post": "UUID", "video_urls": ["url1", "url2", ...], "background_music": "..." }
    ```
*   **Ações:**
    1. Executar FFMPEG para concatenar todos os clipes de cena.
    2. Aplicar trilha sonora de fundo.
    3. Upload do vídeo final para GCS: `posts/UUID/final_video.mp4`.
*   **Output:** `{ "status": "success", "video_final_url": "..." }`

### 2.6. Worker_Director (O Arquiteto de Inteligência)
*   **Gatilho:** Webhook (POST) do `/api/chat/director`.
*   **Papel:** Agente LangChain focado em co-criação de prompts e diretrizes de marca.
*   **Input JSON:**
    ```json
    {
      "message": "Ideia do usuário",
      "session_id": "UUID-DO-FRONTEND",
      "active_preset_id": "UUID",
      "track": "video | carrossel | blog",
      "current_sessions": [
        {"id": "persona", "content": "...", "isEssential": true},
        {"id": "briefing", "content": "...", "isEssential": false}
      ]
    }
    ```
*   **Ações do Agente:**
    1.  Analisar a mensagem do usuário.
    2.  Propor mudanças apenas nas sessões onde `isEssential: false`.
    3.  Usar a ferramenta `update_supabase_preset` para persistir as mudanças.
*   **Ferramentas (Tools):**
    1.  `update_supabase_preset`: Recebe `{ preset_id, session_id, new_content }` e executa um `Update` na coluna `sessions` da tabela `content_presets` no Supabase.
*   **Output:** Mensagem textual confirmando o ajuste (Ex: "Entendido! Acabei de atualizar a nossa persona para um tom mais motivacional. O que acha?").

### 2.7. Worker_Roteirista (Stateless Generator)
*   **Gatilho:** Webhook (POST) do Dashboard (Botão [GERAR ROTEIRO]).
*   **Papel:** Executor de LLM focado em output estruturado JSON.
*   **Input JSON:**
    ```json
    {
      "user_prompt": "Briefing final consolidado",
      "system_message": "String gigante com todas as sessões unificadas",
      "config": { "temperature": 0.7, "model": "gpt-5.4" }
    }
    ```
*   **Ação:** Executa uma única chamada ao LLM. Sem ferramentas.
*   **Output:** JSON de roteiro validado (Vídeo, Carrossel ou Blog).

---

## 3. Lógica do Orquestrador (Frontend)

O Dashboard deve implementar um gerenciador de fila (Zustand) que respeite o hardware limitado (cpx32):

1. **Estado da Fila:** `idle | processing | success | error`.
2. **Sequenciamento Estrito:**
   ```typescript
   for (const cena of cenas) {
     await workerAudio(cena);
     await workerImagem(cena);
     await workerRenderCena(cena);
     // Atualiza UI com progresso da cena X concluído
   }
   await workerCompiladorFinal(allCenas);
   ```
3. **Tratamento de Erro:** Se um worker falhar, o Dashboard permite o "Retry" apenas daquele worker específico, preservando o que já foi gerado.
4. **Handoff de Chat:** O Dashboard captura a resposta da "Tool" do n8n. Se for um JSON de roteiro, ele interrompe o chat, salva no Supabase e abre o `/editor/[id]`.

---

## 4. Estrutura de Pastas GCS (Padrão)
`gs://bucket-cocreator/posts/{id_post}/`
- `/audios/cena_{n}.mp3`
- `/imagens/cena_{n}.png`
- `/videos/cena_{n}.mp4`
- `final_video.mp4`
