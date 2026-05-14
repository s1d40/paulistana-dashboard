#!/bin/bash

N8N_WEBHOOK="https://n8n.sfaisolutions.com/webhook/3a3f27a3-75a4-4b48-b961-945eda83539d"
MOCK_UUID="0c4a8956-1d2f-4bdf-b134-3ddea1a9275f"
TOKEN="Bearer RqsEZoRFwm6zW8Rs"

ARCHITECT_DNA="# AI COCREATOR: MASTER ARCHITECT (DNA)

## 1. SUA MISSÃO SUPREMA
Você é o Arquiteto Estratégico. Seu trabalho é conversar com o usuário para CONFIGURAR os cards do Cockpit.

## 2. REGRAS DE OURO
- DADO OBRIGATÓRIO: Toda chamada de ferramenta DEVE incluir o active_preset_id dentro de ai_params.

## 3. FERRAMENTAS
Use 'Worker_Supabase_Presets' para mudar o cockpit."

COCKPIT_STATE="# BANCADA DE TRABALHO (ESTRATÉGIA)
---
## DIRETRIZES DE PRODUÇÃO ATUAIS:
### CARD: PERSONA E MISSÃO (ID: persona)
CONTEÚDO: (Vazio)
### CARD: ESTÉTICA VISUAL (ID: estetica)
CONTEÚDO: Prompts 100% em inglês."

FULL_SYSTEM="$ARCHITECT_DNA\n\n[DADOS TÉCNICOS OBRIGATÓRIOS]\nID DO PRESET ATUAL: $MOCK_UUID\n\n$COCKPIT_STATE"

run_test() {
    local scenario_name=$1
    local user_msg=$2
    
    echo -e "\n\033[1;34m>>> EXECUTANDO: $scenario_name\033[0m"
    
    # Criar payload JSON limpo usando Python para evitar erros de escape do shell
    python3 -c "
import json, sys
payload = {
    'message': sys.argv[1],
    'history': [],
    'session_id': 'test-curl',
    'id_post': 'test-curl-post',
    'model': 'models/gemini-3.1-pro-preview',
    'system_message': sys.argv[2],
    'agent_config': {
        'active_preset_id': '$MOCK_UUID',
        'architect_model': 'models/gemini-3.1-pro-preview'
    },
    'system_context': {
        'active_preset_id': '$MOCK_UUID',
        'track': 'video',
        'instructions': '[SISTEMA: Você é o Arquiteto. ID do Preset: $MOCK_UUID]'
    }
}
print(json.dumps(payload))
" "$user_msg" "$FULL_SYSTEM" > temp_payload.json

    curl -s -X POST "$N8N_WEBHOOK" \
    -H "Content-Type: application/json" \
    -H "Authorization: $TOKEN" \
    -d @temp_payload.json | python3 -m json.tool | head -n 50
    
    rm temp_payload.json
}

# Cenários
run_test "TESTE 1: UPDATE PERSONA" "Ajuste a persona para um mestre cervejeiro artesanal, tom educativo e apaixonado."
run_test "TESTE 2: UPDATE ESTÉTICA" "Quero uma estética de pub rústico, luz de velas, close-ups de espuma de cerveja gelada, slow motion."
run_test "TESTE 3: RENAME PRESET" "Gostei da direção. Renomeie este projeto para 'Mestres do Malte'."
