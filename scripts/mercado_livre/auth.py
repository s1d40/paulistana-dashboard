import time
import json
import requests
from urllib.parse import urlencode
from config import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, TOKEN_FILE

# ─── ESCOPOS ──────────────────────────────────────────────────────────────────
# Adicione aqui todos os seus escopos, incluindo ads.read e ads.write
SCOPES = [
    "https://api.mercadolibre.com/oauth/scopes/read:listings",
    "https://api.mercadolibre.com/oauth/scopes/write:listings",
    "https://api.mercadolibre.com/oauth/scopes/ads.read",
    "https://api.mercadolibre.com/oauth/scopes/ads.write"
]

def get_authorization_url():
    """
    Retorna a URL que o usuário deve acessar para autorizar sua aplicação
    com TODOS os escopos definidos em SCOPES.
    """
    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        # O Mercado Livre espera escopos separados por espaço:
        "scope": " ".join([scope.split("/")[-1] for scope in SCOPES])
    }
    return "https://auth.mercadolivre.com/authorization?" + urlencode(params)

def save_tokens(data):
    with open(TOKEN_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_tokens():
    try:
        with open(TOKEN_FILE, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None

def exchange_code_for_token(code):
    """
    Troca o código de autorização por access_token e refresh_token.
    """
    resp = requests.post("https://api.mercadolibre.com/oauth/token", data={
        "grant_type":    "authorization_code",
        "client_id":     CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code":          code,
        "redirect_uri":  REDIRECT_URI
    })
    print(f"[DEBUG] Status: {resp.status_code}")
    print(f"[DEBUG] Response body: {resp.text}")
    resp.raise_for_status()

    data = resp.json()
    data["expires_at"] = time.time() + data["expires_in"]
    save_tokens(data)
    print("Tokens salvos com sucesso.")

def get_access_token():
    """
    Retorna um access_token válido, refrescando-o se necessário.
    """
    tokens = load_tokens()
    if tokens and tokens.get("expires_at", 0) > time.time():
        return tokens["access_token"]

    if tokens and "refresh_token" in tokens:
        resp = requests.post("https://api.mercadolibre.com/oauth/token", data={
            "grant_type":    "refresh_token",
            "client_id":     CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "refresh_token": tokens["refresh_token"]
        })
        resp.raise_for_status()
        new = resp.json()
        new["expires_at"] = time.time() + new["expires_in"]
        save_tokens(new)
        return new["access_token"]

    raise RuntimeError("Nenhum token válido. Rode get_authorization_url() → obtenha o code → "
                       "chame exchange_code_for_token(code).")
