import requests
import json
import os

# Configurações do Supabase
URL = 'https://wolygamyyjgpoqsfefye.supabase.co/rest/v1/content_presets?id=eq.f999d27b-5677-4618-a809-269ccff06a9d&select=sessions,config,updated_at'
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbHlnYW15eWpncG9xc2ZlZnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTU0NDksImV4cCI6MjA5MzkzMTQ0OX0.2ii3NOTLcyhCda-0mUa4XkbrJiooQHE4PqLvu5GYyKE"

HEADERS = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}'
}

def verify_db():
    print("\n🔍 VERIFICANDO BANCO DE DADOS (SUPABASE)...")
    try:
        response = requests.get(URL, headers=HEADERS)
        if response.status_code != 200:
            print(f"❌ Erro na consulta: {response.status_code}")
            print(response.text)
            return

        data = response.json()
        if not data:
            print("❌ Registro não encontrado.")
            return

        record = data[0]
        sessions = record.get('sessions', [])
        config = record.get('config', {})
        updated_at = record.get('updated_at')

        # 1. Verificar Persona
        persona = next((s for s in sessions if s.get('id') == 'persona'), {})
        persona_content = persona.get('content', '')

        print(f"\n📅 ÚLTIMA ATUALIZAÇÃO: {updated_at}")
        
        print("\n--- [RESULTADO PERSONA] ---")
        if "Neuromarketing" in persona_content:
            print(f"✅ SUCESSO: Persona contém Neuromarketing.")
            print(f"Conteúdo: {persona_content[:100]}...")
        else:
            print(f"❌ FALHA: Persona não foi atualizada. Conteúdo atual: '{persona_content}'")

        print("\n--- [RESULTADO CONFIGURAÇÕES] ---")
        model = config.get('model')
        temp = config.get('temperature')
        
        if model == "claude-sonnet-4-6":
            print(f"✅ SUCESSO: Modelo atualizado para {model}")
        else:
            print(f"❌ FALHA: Modelo é {model}")

        if float(temp) == 0.9:
            print(f"✅ SUCESSO: Temperatura atualizada para {temp}")
        else:
            print(f"❌ FALHA: Temperatura é {temp}")

    except Exception as e:
        print(f"💥 Erro no script de verificação: {e}")

if __name__ == "__main__":
    verify_db()
