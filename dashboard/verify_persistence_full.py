import requests
import json

URL = 'https://wolygamyyjgpoqsfefye.supabase.co/rest/v1/content_presets?id=eq.f999d27b-5677-4618-a809-269ccff06a9d&select=sessions,config'
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbHlnYW15eWpncG9xc2ZlZnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTU0NDksImV4cCI6MjA5MzkzMTQ0OX0.2ii3NOTLcyhCda-0mUa4XkbrJiooQHE4PqLvu5GYyKE"

HEADERS = {'apikey': KEY, 'Authorization': f'Bearer {KEY}'}

def verify():
    print("\n🔍 INICIANDO VALIDAÇÃO BRUTA DO BANCO DE DADOS...")
    res = requests.get(URL, headers=HEADERS)
    if res.status_code != 200:
        print(f"❌ Erro API: {res.status_code}")
        return
    
    data = res.json()
    if not data:
        print("❌ Registro não encontrado.")
        return
    
    record = data[0]
    sessions = record.get('sessions', [])
    config = record.get('config', {})

    print("\n--- [VALIDAÇÃO: GERENCIAR SESSÕES CUSTOM] ---")
    gatilhos_card = next((s for s in sessions if s.get('id') == 'gatilhos'), None)
    if gatilhos_card:
        print(f"✅ SUCESSO: Card 'gatilhos' foi criado dinamicamente.")
        if "Curiosidade" in gatilhos_card.get('content', ''):
            print(f"✅ SUCESSO: Conteúdo do novo card foi preenchido corretamente.")
        else:
            print(f"❌ FALHA: Card existe mas está vazio ou com texto errado.")
    else:
        print(f"❌ FALHA: Card 'gatilhos' NÃO foi encontrado no banco.")

    print("\n--- [VALIDAÇÃO: PARÂMETROS GLOBAIS] ---")
    model = config.get('model')
    temp = config.get('temperature')
    if model == "gpt-4o" and float(temp) == 0.3:
        print(f"✅ SUCESSO: Modelo (gpt-4o) e Temp (0.3) gravados.")
    else:
        print(f"❌ FALHA: Configurações atuais: Modelo={model}, Temp={temp}")

if __name__ == "__main__":
    verify()
