import os
import base64
import json
import sqlite3
import time
import webbrowser
from datetime import date

import requests
from flask import Flask, jsonify, redirect, request
from requests import exceptions as req_exc

from supabase_client import supabase


TOKENS_DB_PATH = "bling_tokens.db"
PEDIDOS_DB_PATH = "bling_pedidos.db"
IDS_PENDENTES_PATH = "ids_pendentes.json"

OAUTH_DB_PATH = r"C:\\Users\\André\\Desktop\\ApiMercadoLivre\\bling_tokens.db"

CLIENT_ID = "18197aab08ad11ae5291f07f55d2ae5c55997256"
CLIENT_SECRET = "d02ef2ec089b639a98778dbb476afa92c8b4aa906546c717f2c85c533164"
REDIRECT_URI = "http://localhost:5000/callback"

AUTH_URL = (
    "https://www.bling.com.br/Api/v3/oauth/authorize"
    f"?response_type=code&client_id={CLIENT_ID}"
    f"&redirect_uri={REDIRECT_URI}&state=andrebom123"
)
TOKEN_URL = "https://api.bling.com.br/Api/v3/oauth/token"

API_PEDIDOS_LIST = "https://api.bling.com.br/Api/v3/pedidos/vendas"
API_PEDIDOS_DETALHE = "https://api.bling.com.br/Api/v3/pedidos/vendas/"

RATE_LIMIT = 0.35
API_RETRIES = 3
API_RETRY_BACKOFF = 2

session = requests.Session()

CODE = None
ACCESS_TOKEN = None
REFRESH_TOKEN = None

app = Flask(__name__)


def ensure_oauth_db():
    dirname = os.path.dirname(OAUTH_DB_PATH)
    if dirname:
        os.makedirs(dirname, exist_ok=True)
    with sqlite3.connect(OAUTH_DB_PATH) as con:
        cur = con.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS oauth_apps (
                provider TEXT PRIMARY KEY,
                client_id TEXT NOT NULL,
                client_secret TEXT NOT NULL,
                redirect_uri TEXT NOT NULL,
                state TEXT
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS oauth_tokens (
                provider TEXT PRIMARY KEY,
                access_token TEXT NOT NULL,
                refresh_token TEXT NOT NULL,
                expires_at INTEGER NOT NULL
            )
            """
        )


def save_oauth_app():
    with sqlite3.connect(OAUTH_DB_PATH) as con:
        con.execute(
            """
            INSERT INTO oauth_apps(provider, client_id, client_secret, redirect_uri, state)
            VALUES(?,?,?,?,?)
            ON CONFLICT(provider) DO UPDATE SET
              client_id=excluded.client_id,
              client_secret=excluded.client_secret,
              redirect_uri=excluded.redirect_uri,
              state=excluded.state
            """,
            ("bling", CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, "andrebom123"),
        )


def save_oauth_tokens(access_token: str, refresh_token: str, expires_in: int):
    exp = int(time.time()) + int(expires_in or 3600) - 30
    with sqlite3.connect(OAUTH_DB_PATH) as con:
        con.execute(
            """
            INSERT INTO oauth_tokens(provider, access_token, refresh_token, expires_at)
            VALUES(?,?,?,?)
            ON CONFLICT(provider) DO UPDATE SET
              access_token=excluded.access_token,
              refresh_token=excluded.refresh_token,
              expires_at=excluded.expires_at
            """,
            ("bling", access_token, refresh_token, exp),
        )


def load_oauth_tokens():
    with sqlite3.connect(OAUTH_DB_PATH) as con:
        row = con.execute(
            """
            SELECT access_token, refresh_token, expires_at
            FROM oauth_tokens WHERE provider='bling' LIMIT 1
            """
        ).fetchone()
    if not row:
        return None
    return {"access_token": row[0], "refresh_token": row[1], "expires_at": row[2]}


def clear_oauth_tokens():
    with sqlite3.connect(OAUTH_DB_PATH) as con:
        con.execute("DELETE FROM oauth_tokens WHERE provider='bling'")


def migrate_tokens_from_pedidos_db():
    if not os.path.exists(PEDIDOS_DB_PATH):
        return

    try:
        with sqlite3.connect(PEDIDOS_DB_PATH) as src:
            cur = src.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='tokens'"
            )
            if not cur.fetchone():
                return

            row = src.execute(
                "SELECT code, access_token, refresh_token FROM tokens LIMIT 1"
            ).fetchone()

            if row:
                with sqlite3.connect(TOKENS_DB_PATH) as dst:
                    dst.execute(
                        """
                        CREATE TABLE IF NOT EXISTS tokens (
                            id INTEGER PRIMARY KEY,
                            code TEXT,
                            access_token TEXT,
                            refresh_token TEXT
                        )
                        """
                    )
                    dst.execute(
                        """
                        INSERT OR REPLACE INTO tokens (id, code, access_token, refresh_token)
                        VALUES (1, ?, ?, ?)
                        """,
                        row,
                    )

            src.execute("DROP TABLE IF EXISTS tokens")
    except sqlite3.Error:
        pass


def init_token_db():
    with sqlite3.connect(TOKENS_DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tokens (
                id INTEGER PRIMARY KEY,
                code TEXT,
                access_token TEXT,
                refresh_token TEXT
            )
            """
        )
    migrate_tokens_from_pedidos_db()


def init_pedidos_db():
    print("[Supabase] Tabela bling_pedidos já instanciada no banco em nuvem.")


def carregar_tokens():
    global CODE, ACCESS_TOKEN, REFRESH_TOKEN
    with sqlite3.connect(TOKENS_DB_PATH) as conn:
        row = conn.execute(
            "SELECT code, access_token, refresh_token FROM tokens LIMIT 1"
        ).fetchone()
    if row:
        CODE, ACCESS_TOKEN, REFRESH_TOKEN = row
    else:
        CODE = ACCESS_TOKEN = REFRESH_TOKEN = None


def salvar_tokens(code, access_token, refresh_token):
    with sqlite3.connect(TOKENS_DB_PATH) as conn:
        conn.execute("DELETE FROM tokens")
        conn.execute(
            "INSERT INTO tokens (code, access_token, refresh_token) VALUES (?, ?, ?)",
            (code, access_token, refresh_token),
        )


def clear_local_tokens():
    with sqlite3.connect(TOKENS_DB_PATH) as conn:
        conn.execute("DELETE FROM tokens")
    global CODE, ACCESS_TOKEN, REFRESH_TOKEN
    CODE = ACCESS_TOKEN = REFRESH_TOKEN = None


def _now_unix():
    return int(time.time())


def _refresh_access_token_or_raise():
    global ACCESS_TOKEN, REFRESH_TOKEN
    auth = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    resp = session.post(
        TOKEN_URL,
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={"grant_type": "refresh_token", "refresh_token": REFRESH_TOKEN},
        timeout=30,
    )
    if resp.ok:
        tk = resp.json()
        ACCESS_TOKEN = tk["access_token"]
        REFRESH_TOKEN = tk.get("refresh_token", REFRESH_TOKEN)
        salvar_tokens(CODE, ACCESS_TOKEN, REFRESH_TOKEN)
        save_oauth_tokens(ACCESS_TOKEN, REFRESH_TOKEN, int(tk.get("expires_in", 3600)))
        return

    txt = f"{resp.status_code} {resp.text}"
    if "invalid_grant" in resp.text:
        clear_local_tokens()
        clear_oauth_tokens()
        raise RuntimeError("Refresh falhou (invalid_grant). Reautorize em /auth?force=1.")
    raise RuntimeError(f"Falha ao renovar token: {txt}")


def get_access_token():
    carregar_tokens()
    if not ACCESS_TOKEN or not REFRESH_TOKEN:
        raise RuntimeError("Sem token carregado. Acesse /auth para autorizar.")

    ot = load_oauth_tokens()
    if not ot:
        _refresh_access_token_or_raise()
        return ACCESS_TOKEN

    expires_at = int(ot["expires_at"])
    if _now_unix() < (expires_at - 30):
        return ACCESS_TOKEN

    _refresh_access_token_or_raise()
    return ACCESS_TOKEN


def _api_get(url, *, params=None, retries=API_RETRIES):
    backoff = API_RETRY_BACKOFF
    last_exc = None

    for attempt in range(1, retries + 1):
        token = get_access_token()
        headers = {"Authorization": f"Bearer {token}"}

        try:
            resp = session.get(url, params=params, headers=headers, timeout=30)
        except (req_exc.Timeout, req_exc.ConnectionError) as exc:  # pragma: no cover - network dependent
            last_exc = exc
            print(
                f"⚠️  Tentativa {attempt} para {url} falhou com erro de rede: {exc}.",
                "Repetindo..." if attempt < retries else "Sem novas tentativas.",
            )
        else:
            if resp.status_code == 401 and "invalid_token" in resp.text:
                try:
                    _refresh_access_token_or_raise()
                except RuntimeError:
                    raise
                if attempt < retries:
                    time.sleep(backoff)
                    backoff *= 2
                    continue
            return resp

        if attempt < retries:
            time.sleep(backoff)
            backoff *= 2

    if last_exc is not None:
        raise last_exc
    raise RuntimeError(f"Falha ao executar GET em {url}")


def buscar_pedidos():
    get_access_token()
    today = date.today().isoformat()

    try:
        res = supabase.table("bling_pedidos").select("data").order("data", desc=True).limit(1).execute()
        last_date = res.data[0]["data"][:10] if res.data else None
    except Exception:
        last_date = None

    data_inicial = last_date if last_date else "2025-07-22"

    params = {
        "dataInicial": data_inicial,
        "dataFinal": today,
        "limite": 100,
    }

    existentes = set()
    try:
        res_ex = supabase.table("bling_pedidos").select("numero").execute()
        existentes = {str(row["numero"]) for row in res_ex.data}
    except Exception:
        pass

    novos_ids = []
    page = 1

    while True:
        params["pagina"] = page
        try:
            resp = _api_get(API_PEDIDOS_LIST, params=params)
        except (req_exc.RequestException, RuntimeError) as exc:
            print(f"❌ Erro ao buscar página {page}: {exc}")
            break

        if not resp.ok:
            print(f"❌ Erro lista página {page}: {resp.status_code} {resp.text}")
            break

        payload = resp.json()
        pedidos = payload.get("data", []) if isinstance(payload, dict) else []
        if not pedidos:
            break

        for p in pedidos:
            num = p.get("numero")
            pid = p.get("id")
            if num and num not in existentes:
                existentes.add(num)
                novos_ids.append(pid)
        print(f"📋 Página {page}: {len(pedidos)} itens; novos acumulados → {len(novos_ids)}")

        page += 1
        time.sleep(RATE_LIMIT)

    with open(IDS_PENDENTES_PATH, "w", encoding="utf-8") as f:
        json.dump(novos_ids, f, ensure_ascii=False)

    buscar_detalhes_pedidos()


def buscar_detalhes_pedidos():
    get_access_token()
    if not os.path.exists(IDS_PENDENTES_PATH):
        return

    with open(IDS_PENDENTES_PATH, encoding="utf-8") as f:
        pendentes = json.load(f)

    ja_salvos = set()
    try:
        res_ex = supabase.table("bling_pedidos").select("id").execute()
        ja_salvos = {row["id"] for row in res_ex.data}
    except Exception:
        pass

    restantes = []
    for pid in pendentes:
        if pid in ja_salvos:
            continue

        try:
            resp = _api_get(f"{API_PEDIDOS_DETALHE}{pid}")
        except (req_exc.RequestException, RuntimeError) as exc:
            print(f"⚠️  Falha ao buscar detalhes do pedido {pid}: {exc}. Será tentado novamente mais tarde.")
            restantes.append(pid)
            time.sleep(RATE_LIMIT)
            continue

        if resp.ok:
            payload = resp.json()
            data = payload.get("data") if isinstance(payload, dict) else None
            if data:
                try:
                    supabase.table("bling_pedidos").upsert({
                        "id": data.get("id"),
                        "numero": str(data.get("numero")),
                        "data": data.get("data"),
                        "total": data.get("total"),
                        "dados_json": data
                    }).execute()
                    ja_salvos.add(pid)
                except Exception as e:
                    print("Erro ao salvar no Supabase:", e)
                    restantes.append(pid)
            else:
                restantes.append(pid)
        else:
            restantes.append(pid)

        time.sleep(RATE_LIMIT)

    if restantes:
        with open(IDS_PENDENTES_PATH, "w", encoding="utf-8") as f:
            json.dump(restantes, f, ensure_ascii=False)
    else:
        try:
            os.remove(IDS_PENDENTES_PATH)
        except FileNotFoundError:
            pass


@app.route("/")
def index():
    return jsonify(
        {
            "message": "API Bling pronta.",
            "links": {
                "auth": "/auth",
                "auth_force": "/auth?force=1",
                "callback_hint": "/callback?code=SEU_CODE_AQUI",
                "run": "/run",
            },
        }
    )


@app.route("/auth")
def auth_route():
    force = request.args.get("force")

    if force == "1":
        clear_local_tokens()
        clear_oauth_tokens()
        return redirect(AUTH_URL)

    carregar_tokens()
    ot = load_oauth_tokens()
    if ACCESS_TOKEN and ot and _now_unix() < int(ot["expires_at"]) - 30:
        return jsonify({"status": "ok", "detail": "Já autorizado. Use /run para executar o fluxo."})

    try:
        if ACCESS_TOKEN and REFRESH_TOKEN:
            _refresh_access_token_or_raise()
            return jsonify({"status": "ok", "detail": "Token renovado. Use /run para executar o fluxo."})
    except RuntimeError:
        pass

    return redirect(AUTH_URL)


@app.route("/callback")
def callback():
    global CODE, ACCESS_TOKEN, REFRESH_TOKEN
    CODE = request.args.get("code")
    if not CODE:
        return "Erro: authorization code não recebido.", 400

    auth = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    resp = session.post(
        TOKEN_URL,
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={"grant_type": "authorization_code", "code": CODE, "redirect_uri": REDIRECT_URI},
        timeout=30,
    )
    if not resp.ok:
        return f"Erro ao obter token: {resp.status_code} {resp.text}", 400

    tk = resp.json()
    ACCESS_TOKEN = tk["access_token"]
    REFRESH_TOKEN = tk.get("refresh_token", "")
    salvar_tokens(CODE, ACCESS_TOKEN, REFRESH_TOKEN)
    save_oauth_tokens(ACCESS_TOKEN, REFRESH_TOKEN, int(tk.get("expires_in", 3600)))

    return jsonify({"status": "ok", "detail": "Autorizado. Agora basta executar o script que ele roda sozinho."})


@app.route("/run")
def run_pipeline():
    try:
        _ = get_access_token()
        buscar_pedidos()
        return jsonify({"ok": True, "detail": "Fluxo concluído. Pedidos atualizados."})
    except Exception as e:  # pragma: no cover - just defensive
        return jsonify({"ok": False, "error": str(e)}), 400


if __name__ == "__main__":
    ensure_oauth_db()
    save_oauth_app()
    init_token_db()
    init_pedidos_db()
    carregar_tokens()

    try:
        token = get_access_token()
        print("✅ Token válido. Buscando pedidos direto (sem abrir navegador)...")
        buscar_pedidos()
        print("✅ Concluído. Você pode fechar o programa.")
    except RuntimeError as e:
        print("⚠️  Não foi possível usar o token:", e)
        print("➡️  Abrindo a tela de autorização. Após aceitar no Bling, este app fica pronto.")
        try:
            webbrowser.open("http://localhost:5000/auth?force=1")
        except Exception:  # pragma: no cover - depende do ambiente
            pass
        print("🚀 Flask rodando em http://localhost:5000")
        print("   1) /auth  → autorizar/renovar (abrirá automaticamente)")
        print("   2) /callback → retorno do Bling")
        print("   3) /run   → executar manual (opcional)")
        app.run(host="127.0.0.1", port=5000, debug=False)