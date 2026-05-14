#!/bin/bash

# =========================================================================
# SCRIPT DE TESTE DE INTEGRAÇÃO FINAL - 3 FERRAMENTAS
# =========================================================================

N8N_WEBHOOK="https://n8n.sfaisolutions.com/webhook/3a3f27a3-75a4-4b48-b961-945eda83539d"
TEST_POST_ID="f999d27b-5677-4618-a809-269ccff06a9d"
TOKEN="Bearer RqsEZoRFwm6zW8Rs"

# 1. PEGAR O SYSTEM MESSAGE ATUALIZADO DO ARQUIVO
SYSTEM_MESSAGE=$(cat dashboard/ARCHITECT_SYSTEM_MESSAGE.md)
INSTRUCTIONS="[ESPECIFICAÇÕES OBRIGATÓRIAS] ID DA CONFIGURAÇÃO (PK): $TEST_POST_ID"

run_agent_test() {
    local scenario_name=$1
    local user_msg=$2
    
    echo -e "\n\033[1;34m>>> EXECUTANDO: $scenario_name\033[0m"
    echo -e "\033[1;32mMENSAGEM DO USUÁRIO:\033[0m \"$user_msg\""
    
    # Criar payload JSON via Python para segurança de caracteres
    python3 -c "
import json, sys
payload = {
    'message': sys.argv[1],
    'history': [],
    'session_id': '$TEST_POST_ID',
    'id_post': '$TEST_POST_ID',
    'model': 'models/gemini-3.1-pro-preview',
    'system_message': sys.argv[2] + '\n\n' + sys.argv[3],
    'agent_config': {
        'active_preset_id': '$TEST_POST_ID',
        'architect_model': 'models/gemini-3.1-pro-preview'
    },
    'system_context': {
        'active_preset_id': '$TEST_POST_ID',
        'track': 'video'
    }
}
print(json.dumps(payload))
" "$user_msg" "$SYSTEM_MESSAGE" "$INSTRUCTIONS" > final_payload.json

    # Disparar request
    curl -s -X POST "$N8N_WEBHOOK" \
    -H "Content-Type: application/json" \
    -H "Authorization: $TOKEN" \
    -d @final_payload.json | python3 -m json.tool | grep -E "output|message" | head -n 20
    
    rm final_payload.json
}

# --- CENÁRIOS DE TESTE ---

# Teste 1: Atualização de Card (Persona)
run_agent_test "TESTE 1: ATUALIZAR PERSONA (Ferramenta: Atualizar_Card)" "Ajuste a persona para um Diretor de Neuromarketing clínico, focado em gatilhos mentais de escassez."

# Teste 2: Ajuste Global (Modelo e Temp)
run_agent_test "TESTE 2: PARAMETROS GLOBAIS (Ferramenta: Ajustar_Parametros_Globais)" "Mude o modelo de produção para o claude-sonnet-4-6 e coloque a temperatura em 0.9 para ser mais criativo."

echo -e "\n\033[1;33m--- TESTE CONCLUÍDO ---\033[0m"
echo "Aguarde 2 segundos e rodaremos o validador de banco de dados..."
sleep 3
