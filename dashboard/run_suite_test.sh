#!/bin/bash

# =========================================================================
# BATERIA DE TESTES DE INTEGRAÇÃO FULL - 4 FERRAMENTAS
# =========================================================================

N8N_WEBHOOK="https://n8n.sfaisolutions.com/webhook/3a3f27a3-75a4-4b48-b961-945eda83539d"
TEST_POST_ID="f999d27b-5677-4618-a809-269ccff06a9d"
TOKEN="Bearer RqsEZoRFwm6zW8Rs"
SYSTEM_MESSAGE=$(cat dashboard/ARCHITECT_SYSTEM_MESSAGE.md)

run_test() {
    local name=$1
    local msg=$2
    echo -e "\n\033[1;34m>>> TESTANDO: $name\033[0m"
    
    python3 -c "
import json, sys
payload = {
    'message': sys.argv[1],
    'id_post': '$TEST_POST_ID',
    'model': 'models/gemini-3.1-pro-preview',
    'system_message': sys.argv[2] + '\n\n[DADOS DO SISTEMA]\nID DA CONFIGURAÇÃO (PK): $TEST_POST_ID',
    'agent_config': {'active_preset_id': '$TEST_POST_ID'},
    'system_context': {'active_preset_id': '$TEST_POST_ID', 'track': 'video'}
}
print(json.dumps(payload))
" "$msg" "$SYSTEM_MESSAGE" > test_payload.json

    curl -s -X POST "$N8N_WEBHOOK" -H "Content-Type: application/json" -H "Authorization: $TOKEN" -d @test_payload.json | python3 -m json.tool | grep -E "output|message"
    rm test_payload.json
}

# 1. Testar Adição de Sessão Customizada + Conteúdo
run_test "1. ADICIONAR CARD CUSTOM" "Crie um novo card chamado 'Gatilhos Emocionais' com o id 'gatilhos' e coloque lá que devemos usar Curiosidade e Urgência."

# 2. Testar Atualização de Parâmetros Globais
run_test "2. AJUSTAR MODELO/TEMP" "Mude o modelo para gpt-4o e coloque a temperatura em 0.3 para ser bem conservador."

# 3. Testar Remoção de Sessão (Opcional, para validar ferramenta 4)
# run_test "3. REMOVER CARD" "Remova o card de Gatilhos Emocionais, não vamos mais precisar dele."

echo -e "\n\033[1;33mBateria de testes finalizada. Aguardando persistência...\033[0m"
sleep 5
python3 dashboard/verify_persistence_full.py
