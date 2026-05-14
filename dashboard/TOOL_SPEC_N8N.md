# Especificação Técnica da Ferramenta para o n8n AI Agent

Este documento contém os textos exatos para preencher a configuração da ferramenta no nó "AI Agent".

## 1. Nome da Ferramenta
`Worker_Supabase_Presets`

## 2. Descrição (Description - O que o Agente lê)
**IMPORTANTE:** Copie o texto abaixo para o campo "Description" da ferramenta no n8n.

> Esta é a ferramenta central de persistência de presets. Use-a para salvar qualquer alteração feita no cockpit.
> 
> ### Quando usar:
> - Se o usuário pedir para mudar o tom, persona, narração ou qualquer instrução: use 'update_session'.
> - Se o usuário pedir para mudar o modelo (gpt-5.4, claude-sonnet-4-6, models/gemini-3.1-pro-preview), temperatura ou prompt de comando: use 'update_settings'.
> - Se o usuário disser "Gostei, salve como uma nova estratégia/preset": use 'save_as_new'.
> 
> ### Esquema de Entrada (JSON):
> {
>   "action": "update_session | update_settings | save_as_new",
>   "name": "OBRIGATÓRIO para save_as_new: Nome comercial curto",
>   "description": "OBRIGATÓRIO para save_as_new: Explicação técnica",
>   "session_id": "OBRIGATÓRIO para update_session: ID da sessão (ex: 'persona')",
>   "new_content": "OBRIGATÓRIO para update_session: O novo texto completo",
>   "model": "Opcional para update_settings: gpt-5.4, claude-sonnet-4-6 ou models/gemini-3.1-pro-preview",
>   "temperature": 0.7, (Opcional para update_settings)
> }

---

## 3. Guia de Preenchimento dos Metadados (Para sua organização)

Aqui estão as definições para os campos que você mencionou:

*   **Version:** `1.0 (Workflow-Worker Architecture)`
*   **Endpoint Workflow:** `[TOOL] Worker_Supabase_Presets`
*   **Contract:** "O Agente deve fornecer o `action` correto e o `active_preset_id`. Para atualizações de sessão, `session_id` e `new_content` são mandatórios. Para snapshots, o `array` completo de sessões deve ser enviado."
*   **Example Call (Update):**
    ```json
    {
      "action": "update_session",
      "active_preset_id": "...",
      "session_id": "persona",
      "new_content": "Você é um mestre cervejeiro..."
    }
    ```
*   **Example Call (Save New):**
    ```json
    {
      "action": "save_as_new",
      "active_preset_id": "...",
      "name": "Estratégia Verão",
      "description": "Focada em refrescância",
      "current_sessions": [ ... ]
    }
    ```

---

## 4. O Nó de Código (A ponte para o Workflow)
No nó de código da ferramenta dentro do AI Agent, você deve usar este script minimalista:

```javascript
// Apenas repassa a intenção do Agente para o Workflow Executor
const response = await $workflow.execute('[TOOL] Worker_Supabase_Presets', $json);
return response;
```
