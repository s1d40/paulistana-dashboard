# Especificação do Agente Arquiteto (n8n Tooling)

## 1. Ferramenta: `manage_sessions`
Esta ferramenta permite ao Agente ler e escrever nas partes do prompt que não são essenciais.

**Input JSON:**
```json
{
  "action": "read | update",
  "preset_id": "UUID",
  "sessions_to_update": [
    {
      "id": "persona",
      "content": "Novo texto da persona aqui..."
    }
  ]
}
```

## 2. Guardrails (Instruções para o Agente)
O Agente deve seguir este check-list antes de propor uma mudança:
1. **É essencial?** Se a sessão tem `isEssential: true`, ignore solicitações de mudança.
2. **Tem JSON?** Se a sessão contém chaves de exemplo como `{"tipo_post": ...}`, nunca altere essas chaves.
3. **Fidelidade de Marca:** Sempre mantenha os termos "Paulistana Empório" e "SFAI Solutions" intactos.

## 3. Fluxo de Decisão
- Usuário: "Quero que este vídeo seja mais focado em atletas e tenha um tom motivacional."
- Agente: Chama `manage_sessions(action="update", sessions_to_update=[{id: "persona", content: "Você é um treinador de alta performance..."}])`.
- Resposta para o usuário: "Ajustei o preset! Agora a IA vai escrever com foco em atletas. Pronto para gerar o roteiro?"
