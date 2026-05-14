import requests
import json

SUPABASE_URL = 'https://wolygamyyjgpoqsfefye.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbHlnYW15eWpncG9xc2ZlZnllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM1NTQ0OSwiZXhwIjoyMDkzOTMxNDQ5fQ.lrjXQbm_y6DkSA_2CsFsoFbdWoKZGpHUAvGGSEd79bY'

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

id_post = '45395b09-0d78-4e1f-8a21-0f8ceab136d8'

# Fetch current content
res = requests.get(f"{SUPABASE_URL}/rest/v1/posts?id_post=eq.{id_post}", headers=headers)
if res.status_code == 200 and res.json():
    post = res.json()[0]
    script = json.loads(post['roteiro_gerado'])
    script['tipo_post'] = 'video' # Force correct type
    
    # Update back
    update_res = requests.patch(
        f"{SUPABASE_URL}/rest/v1/posts?id_post=eq.{id_post}",
        headers=headers,
        data=json.dumps({'roteiro_gerado': json.dumps(script)})
    )
    if update_res.status_code in [200, 204]:
        print(f"✅ Post {id_post} atualizado para 'video' com sucesso!")
    else:
        print(f"❌ Erro ao atualizar: {update_res.text}")
else:
    print("Post não encontrado ou erro na busca.")
