#!/usr/bin/env python3
"""
Script para fazer as chamadas de teste de API exigidas pelo Meta App Review.
Executa chamadas reais para cada permissão pendente.

Permissões:
1. instagram_manage_engagement - Curtir/responder comentários
2. pages_manage_engagement - Gerenciar engajamento de páginas
3. instagram_business_manage_insights - Métricas do Instagram
4. instagram_business_content_publish - Publicar conteúdo
"""

import os
import json
import hmac
import hashlib
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('/home/sid/cocreator-n8n/dashboard/.env.local', override=True)

db = create_client(
    os.environ['NEXT_PUBLIC_SUPABASE_URL'],
    os.environ['SUPABASE_SERVICE_ROLE_KEY']
)

# Buscar conta
res = db.table('contas').select('*').execute()
conta = next(c for c in res.data if c.get('facebook_access_token'))

# Credenciais do App
APP_SECRET = os.environ.get('FACEBOOK_APP_SECRET', '')

IG_ID = conta['conta_id_instagram']
FB_PAGE_ID = conta.get('conta_id_facebook', '')
FB_TOKEN = conta.get('facebook_access_token', '')
IG_TOKEN = conta.get('ig_access_token', '')

# Determinar qual fluxo usar:
if FB_TOKEN:
    API = 'https://graph.facebook.com'
    TOKEN = FB_TOKEN
    AUTH_TYPE = 'Facebook Login'
else:
    API = 'https://graph.instagram.com'
    TOKEN = IG_TOKEN
    AUTH_TYPE = 'Instagram Business Login'

API_VERSION = 'v21.0'

# Gerar appsecret_proof (HMAC-SHA256 do token com o App Secret)
# A Meta exige isso para contabilizar chamadas server-side no App Review
APPSECRET_PROOF = hmac.new(
    APP_SECRET.encode('utf-8'),
    msg=TOKEN.encode('utf-8'),
    digestmod=hashlib.sha256
).hexdigest() if APP_SECRET else ''

# Wrapper para injetar appsecret_proof automaticamente em TODAS as chamadas
_original_get = requests.get
_original_post = requests.post

def _inject_proof(params):
    """Injeta appsecret_proof em params que contêm access_token."""
    if params and 'access_token' in params and APPSECRET_PROOF:
        params['appsecret_proof'] = APPSECRET_PROOF
    return params

def patched_get(url, params=None, **kwargs):
    return _original_get(url, params=_inject_proof(params or {}), **kwargs)

def patched_post(url, params=None, **kwargs):
    return _original_post(url, params=_inject_proof(params or {}), **kwargs)

requests.get = patched_get
requests.post = patched_post

print("=" * 70)
print("🔑 META APP REVIEW - CHAMADAS DE TESTE DE API")
print("=" * 70)
print(f"Conta: @{conta.get('ig_username', 'N/A')}")
print(f"IG ID: {IG_ID}")
print(f"FB Page ID: {FB_PAGE_ID}")
print(f"Auth: {AUTH_TYPE}")
print(f"API: {API}")
print(f"App Secret Proof: {'✅ ' + APPSECRET_PROOF[:12] + '...' if APPSECRET_PROOF else '❌ MISSING'}")
print("=" * 70)

results = {}

# =========================================================================
# 1. instagram_business_basic (pré-requisito)
# =========================================================================
print("\n📋 1. instagram_business_basic - Perfil básico")
# Via Facebook Login: /me não funciona — usar /{IG_ID} diretamente
r = requests.get(f"{API}/{API_VERSION}/{IG_ID}", params={
    'fields': 'id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography',
    'access_token': TOKEN
})
data = r.json()
print(f"   Status: {r.status_code}")
print(f"   Response: {json.dumps(data, indent=2)[:300]}")
results['instagram_business_basic'] = r.status_code == 200

# =========================================================================
# 2. instagram_business_manage_insights - Métricas
# =========================================================================
print("\n📊 2. instagram_business_manage_insights - Métricas do perfil")

# 2a. Insights do perfil — métricas time_series (reach)
r = requests.get(f"{API}/{API_VERSION}/{IG_ID}/insights", params={
    'metric': 'reach',
    'period': 'day',
    'access_token': TOKEN
})
data = r.json()
print(f"   2a. Profile Insights (reach/day) - Status: {r.status_code}")
print(f"   Response: {json.dumps(data, indent=2)[:300]}")

# 2a2. Insights total_value (accounts_engaged, profile_views)
r_total = requests.get(f"{API}/{API_VERSION}/{IG_ID}/insights", params={
    'metric': 'accounts_engaged,profile_views',
    'period': 'day',
    'metric_type': 'total_value',
    'access_token': TOKEN
})
data_total = r_total.json()
print(f"   2a2. Profile Insights (total_value) - Status: {r_total.status_code}")
print(f"   Response: {json.dumps(data_total, indent=2)[:300]}")

# 2b. Insights de mídia (post específico)
print("   2b. Buscando último post para insights...")
media_r = requests.get(f"{API}/{API_VERSION}/{IG_ID}/media", params={
    'fields': 'id,caption,media_type',
    'limit': 1,
    'access_token': TOKEN
})
media_data = media_r.json()
print(f"   Media list Status: {media_r.status_code}")
print(f"   Media Response: {json.dumps(media_data, indent=2)[:200]}")
if media_data.get('data') and len(media_data['data']) > 0:
    media_id = media_data['data'][0]['id']
    print(f"   Media ID: {media_id}")
    
    r2 = requests.get(f"{API}/{API_VERSION}/{media_id}/insights", params={
        'metric': 'reach,likes,comments,shares,saved',
        'access_token': TOKEN
    })
    print(f"   Media Insights - Status: {r2.status_code}")
    print(f"   Response: {json.dumps(r2.json(), indent=2)[:300]}")
    results['instagram_business_manage_insights'] = r.status_code == 200 or r_total.status_code == 200 or r2.status_code == 200
else:
    print("   ⚠️ Nenhum post encontrado para testar insights de mídia")
    results['instagram_business_manage_insights'] = r.status_code == 200 or r_total.status_code == 200

# =========================================================================
# 3. instagram_business_manage_comments / instagram_manage_engagement
# A Meta exige chamadas de ESCRITA (reply/like) — não apenas leitura!
# =========================================================================
print("\n💬 3. instagram_manage_engagement - Engajamento (Reply + Like)")

engagement_ok = False

# Buscar vários posts para encontrar um com comentários
print("   Buscando posts com comentários...")
all_media_r = requests.get(f"{API}/{API_VERSION}/{IG_ID}/media", params={
    'fields': 'id,caption,media_type,comments_count',
    'limit': 25,
    'access_token': TOKEN
})
all_media = all_media_r.json()
target_media_id = None
comment_data = None

if all_media.get('data'):
    for m in all_media['data']:
        cc = m.get('comments_count', 0)
        if cc > 0:
            print(f"   ✅ Post com {cc} comentário(s): {m['id']} ({m.get('caption', '')[:40]}...)")
            target_media_id = m['id']
            break
    if not target_media_id:
        print(f"   ⚠️ Nenhum dos {len(all_media['data'])} posts recentes tem comentários")

if target_media_id:
    # 3a. Listar comentários desse post
    r = requests.get(f"{API}/{API_VERSION}/{target_media_id}/comments", params={
        'fields': 'id,text,username,timestamp,like_count',
        'access_token': TOKEN
    })
    data = r.json()
    print(f"   3a. List Comments - Status: {r.status_code}")
    print(f"   Response: {json.dumps(data, indent=2)[:300]}")
    
    if data.get('data') and len(data['data']) > 0:
        comment_id = data['data'][0]['id']
        print(f"   Alvo: comment_id={comment_id}")
        
        # 3b. REPLY to comment (POST /{comment-id}/replies) 
        # ESTA é a chamada que a Meta exige para instagram_manage_engagement
        print(f"   3b. Replying to comment {comment_id}...")
        r_reply = requests.post(f"{API}/{API_VERSION}/{comment_id}/replies", params={
            'message': '❤️',
            'access_token': TOKEN
        })
        reply_data = r_reply.json()
        print(f"   Reply Status: {r_reply.status_code}")
        print(f"   Reply Response: {json.dumps(reply_data, indent=2)[:300]}")
        if r_reply.status_code == 200 and reply_data.get('id'):
            print(f"   ✅ Reply criado com sucesso: {reply_data['id']}")
            engagement_ok = True
        else:
            print(f"   ⚠️ Reply falhou: {reply_data.get('error', {}).get('message', 'Unknown')}")
        
        # 3c. LIKE a comment (POST /{ig-user-id}/likes?comment_id=XXX)
        # Endpoint CORRETO da Instagram Graph API (NÃO é /{comment-id}/likes!)
        print(f"   3c. Liking comment {comment_id} via /{IG_ID}/likes...")
        r_like = requests.post(f"{API}/{API_VERSION}/{IG_ID}/likes", params={
            'comment_id': comment_id,
            'access_token': TOKEN
        })
        like_data = r_like.json()
        print(f"   Like Status: {r_like.status_code}")
        print(f"   Like Response: {json.dumps(like_data, indent=2)[:300]}")
        if r_like.status_code == 200:
            print(f"   ✅ Like registrado com sucesso!")
            engagement_ok = True
        else:
            print(f"   ⚠️ Like falhou: {like_data.get('error', {}).get('message', 'Unknown')}")
    else:
        print("   ⚠️ Nenhum comentário encontrado para testar engagement")
        print("   💡 Dica: Comente manualmente em um post e re-execute este script")
else:
    print("   ⚠️ Nenhum post encontrado")

results['instagram_manage_engagement'] = engagement_ok

# =========================================================================
# 4. instagram_business_content_publish - Publicação
# =========================================================================
print("\n📸 4. instagram_business_content_publish - Publicação")
print("   4a. Verificar limite de publicação...")
r = requests.get(f"{API}/{API_VERSION}/{IG_ID}/content_publishing_limit", params={
    'fields': 'quota_usage,config',
    'access_token': TOKEN
})
data = r.json()
print(f"   Status: {r.status_code}")
print(f"   Response: {json.dumps(data, indent=2)[:300]}")
results['instagram_business_content_publish'] = r.status_code == 200

# 4b. Criar container de teste (sem publicar)
print("   4b. Criar container de teste (REELS - sem publicar)...")
test_video_url = "https://storage.googleapis.com/cocreator_content/posts/f89d0276-604a-49bb-a1f5-631feacd5f8b/video_final.mp4"
r = requests.post(f"{API}/{API_VERSION}/{IG_ID}/media", params={
    'media_type': 'REELS',
    'video_url': test_video_url,
    'caption': 'API Test - Content Publishing Verification',
    'access_token': TOKEN
})
data = r.json()
print(f"   Status: {r.status_code}")
print(f"   Response: {json.dumps(data, indent=2)[:300]}")
if data.get('id'):
    print(f"   ✅ Container criado: {data['id']} (NÃO publicado)")

# =========================================================================
# 5. pages_manage_engagement (requer Facebook Page token)
# =========================================================================
print("\n📄 5. pages_manage_engagement")
if FB_TOKEN and FB_PAGE_ID:
    r = requests.get(f"https://graph.facebook.com/{API_VERSION}/{FB_PAGE_ID}", params={
        'fields': 'id,name,fan_count',
        'access_token': FB_TOKEN
    })
    print(f"   Status: {r.status_code}")
    print(f"   Response: {json.dumps(r.json(), indent=2)[:300]}")
    results['pages_manage_engagement'] = r.status_code == 200
else:
    print("   ⚠️ Sem Facebook Page token - essa permissão requer login via Facebook")
    print("   → Pode ser satisfeita com instagram_manage_engagement no Instagram Business Login")
    results['pages_manage_engagement'] = False

# =========================================================================
# RESUMO
# =========================================================================
print("\n" + "=" * 70)
print("📋 RESUMO DAS CHAMADAS DE TESTE")
print("=" * 70)
for perm, ok in results.items():
    status = "✅ OK" if ok else "❌ FALHOU"
    print(f"   {status} - {perm}")
print("=" * 70)
print("Feito! Agora volte ao Meta App Review e marque as chamadas como concluídas.")
