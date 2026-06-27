from __future__ import annotations

import base64
import json
import os
import sqlite3
import time
import webbrowser
from typing import Iterable, List, Sequence, Set, Tuple

import requests
from flask import Flask, jsonify, redirect, request

# ---------------------------------------------------------------------------
# Configurações gerais & endpoints
# ---------------------------------------------------------------------------
TOKENS_DB_PATH = "bling_tokens.db"
PRODUTOS_DB_PATH = "bling_produtos.db"

# Banco utilizado pelo fluxo OAuth do apibling.py.
OAUTH_DB_PATH = os.getenv("BLING_OAUTH_DB_PATH", os.path.abspath(TOKENS_DB_PATH))

CLIENT_ID = "18197aab08ad11ae5291f07f55d2ae5c55997256"
CLIENT_SECRET = "d02ef2ec089b639a98778dbb476afa92c8b4aa906546c717f2c85c533164"
REDIRECT_URI = os.getenv("BLING_REDIRECT_URI", "http://localhost:5000/callback")
STATE = os.getenv("BLING_OAUTH_STATE", "andrebom123")

BASE_API = "https://api.bling.com.br/Api/v3"
AUTH_BASE_URL = "https://www.bling.com.br/Api/v3/oauth/authorize"
TOKEN_URL = f"{BASE_API}/oauth/token"
API_PRODUTOS = f"{BASE_API}/produtos"

PAGE_LIMIT = 100
RATE_LIMIT_S = 0.35  # ~3 req/s

session = requests.Session()

CODE: str | None = None
ACCESS_TOKEN: str | None = None
REFRESH_TOKEN: str | None = None

app = Flask(__name__)


# ---------------------------------------------------------------------------
# Utilidades OAuth – banco compartilhado com apibling.py
# ---------------------------------------------------------------------------
def _oauth_db_path() -> str:
    return os.path.abspath(OAUTH_DB_PATH)


def ensure_oauth_db() -> None:
    """Garante as tabelas ``oauth_apps`` e ``oauth_tokens``."""

    path = _oauth_db_path()
    directory = os.path.dirname(path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)

    with sqlite3.connect(path) as con:
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


def save_oauth_app() -> None:
    with sqlite3.connect(_oauth_db_path()) as con:
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
            ("bling", CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, STATE),
        )


def save_oauth_tokens(access_token: str, refresh_token: str, expires_in: int | str | None) -> None:
    exp = int(time.time()) + int(expires_in or 3600) - 30
    with sqlite3.connect(_oauth_db_path()) as con:
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


def load_oauth_tokens() -> dict | None:
    with sqlite3.connect(_oauth_db_path()) as con:
        row = con.execute(
            """
            SELECT access_token, refresh_token, expires_at
            FROM oauth_tokens WHERE provider='bling' LIMIT 1
            """
        ).fetchone()
    if not row:
        return None
    return {"access_token": row[0], "refresh_token": row[1], "expires_at": row[2]}


def clear_oauth_tokens() -> None:
    with sqlite3.connect(_oauth_db_path()) as con:
        con.execute("DELETE FROM oauth_tokens WHERE provider='bling'")


# ---------------------------------------------------------------------------
# Tokens locais (bling_tokens.db)
# ---------------------------------------------------------------------------
def init_token_db() -> None:
    with sqlite3.connect(TOKENS_DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tokens (
                id INTEGER PRIMARY KEY,
                code TEXT,
                access_token TEXT,
                refresh_token TEXT,
                redirect_uri TEXT
            )
            """
        )


def carregar_tokens() -> None:
    global CODE, ACCESS_TOKEN, REFRESH_TOKEN, REDIRECT_URI

    with sqlite3.connect(TOKENS_DB_PATH) as conn:
        colunas = {info[1] for info in conn.execute("PRAGMA table_info(tokens)")}
        if "redirect_uri" not in colunas:
            conn.execute("ALTER TABLE tokens ADD COLUMN redirect_uri TEXT")
        row = conn.execute(
            "SELECT code, access_token, refresh_token, redirect_uri FROM tokens LIMIT 1"
        ).fetchone()

    if row:
        CODE, ACCESS_TOKEN, REFRESH_TOKEN, redirect_uri = row
        if redirect_uri:
            REDIRECT_URI = redirect_uri


def salvar_tokens(code: str | None, access_token: str | None, refresh_token: str | None) -> None:
    with sqlite3.connect(TOKENS_DB_PATH) as conn:
        conn.execute("DELETE FROM tokens")
        conn.execute(
            """
            INSERT INTO tokens (code, access_token, refresh_token, redirect_uri)
            VALUES (?, ?, ?, ?)
            """,
            (code, access_token, refresh_token, REDIRECT_URI),
        )


def clear_local_tokens() -> None:
    global CODE, ACCESS_TOKEN, REFRESH_TOKEN
    with sqlite3.connect(TOKENS_DB_PATH) as conn:
        conn.execute("DELETE FROM tokens")
    CODE = ACCESS_TOKEN = REFRESH_TOKEN = None


# ---------------------------------------------------------------------------
# Fluxo OAuth (renovação e obtenção de tokens)
# ---------------------------------------------------------------------------
def _now_unix() -> int:
    return int(time.time())


def build_auth_url() -> str:
    return (
        f"{AUTH_BASE_URL}?response_type=code&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}&state={STATE}"
    )


def _post_token(data: dict) -> requests.Response:
    auth = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    return session.post(
        TOKEN_URL,
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data=data,
        timeout=30,
    )


def _refresh_access_token_or_raise() -> None:
    global ACCESS_TOKEN, REFRESH_TOKEN

    if not REFRESH_TOKEN:
        raise RuntimeError("Sem refresh_token salvo. Acesse /auth para autorizar novamente.")

    resp = _post_token({"grant_type": "refresh_token", "refresh_token": REFRESH_TOKEN})
    if resp.ok:
        tk = resp.json()
        ACCESS_TOKEN = tk["access_token"]
        REFRESH_TOKEN = tk.get("refresh_token", REFRESH_TOKEN)
        salvar_tokens(CODE, ACCESS_TOKEN, REFRESH_TOKEN)
        save_oauth_tokens(ACCESS_TOKEN, REFRESH_TOKEN, tk.get("expires_in", 3600))
        return

    if "invalid_grant" in resp.text.lower():
        clear_local_tokens()
        clear_oauth_tokens()
        raise RuntimeError("Refresh falhou (invalid_grant). Reautorize em /auth?force=1.")

    raise RuntimeError(f"Falha ao renovar token: {resp.status_code} {resp.text}")


def get_access_token() -> str:
    global ACCESS_TOKEN, REFRESH_TOKEN

    carregar_tokens()

    cached = load_oauth_tokens()
    if cached:
        # Mantém as variáveis em memória sincronizadas com a tabela oauth_tokens.
        # Isso evita usar um token antigo salvo na tabela local tokens.
        ACCESS_TOKEN = cached["access_token"]
        REFRESH_TOKEN = cached["refresh_token"]

    if not ACCESS_TOKEN or not REFRESH_TOKEN:
        raise RuntimeError("Sem token carregado. Acesse /auth para autorizar.")

    if not cached:
        _refresh_access_token_or_raise()
        return ACCESS_TOKEN  # atualizado pela função

    expires_at = int(cached["expires_at"])
    if _now_unix() < expires_at - 30:
        return ACCESS_TOKEN  # token ainda válido

    _refresh_access_token_or_raise()
    return ACCESS_TOKEN


# ---------------------------------------------------------------------------
# Banco de produtos
# ---------------------------------------------------------------------------
def init_produtos_db() -> None:
    with sqlite3.connect(PRODUTOS_DB_PATH) as conn:
        c = conn.cursor()
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS produtos (
                id             INTEGER PRIMARY KEY,
                codigo         TEXT UNIQUE,
                nome           TEXT,
                preco          REAL,
                preco_custo    REAL,
                unidade        TEXT,
                tipo           TEXT,
                situacao       TEXT,
                descricaoCurta TEXT,
                pesoLiquido    REAL,
                pesoBruto      REAL,
                marca          TEXT,
                dados_json     TEXT,
                possuiComposicao TEXT
            )
            """
        )
        info = c.execute("PRAGMA table_info(produtos)").fetchall()
        colunas = {col[1] for col in info}
        if "possuiComposicao" not in colunas:
            c.execute("ALTER TABLE produtos ADD COLUMN possuiComposicao TEXT")
        c.execute("CREATE INDEX IF NOT EXISTS ix_prod_codigo ON produtos(codigo)")
        c.execute("CREATE INDEX IF NOT EXISTS ix_prod_situacao ON produtos(situacao)")
        conn.commit()


def apagar_todos_produtos() -> None:
    with sqlite3.connect(PRODUTOS_DB_PATH) as conn:
        conn.execute("DELETE FROM produtos")
        conn.commit()
    print("🧹 Tabela 'produtos' limpa.")


def inserir_em_lote(linhas: Sequence[Tuple]) -> None:
    if not linhas:
        print("⚠️  Nada para inserir.")
        return

    with sqlite3.connect(PRODUTOS_DB_PATH) as conn:
        c = conn.cursor()
        c.execute("PRAGMA journal_mode=WAL;")
        c.execute("PRAGMA synchronous=OFF;")
        c.execute("PRAGMA temp_store=MEMORY;")
        c.execute("PRAGMA cache_size=-50000;")
        c.executemany(
            """
            INSERT OR REPLACE INTO produtos (
                id, codigo, nome, preco, preco_custo, unidade, tipo, situacao,
                descricaoCurta, pesoLiquido, pesoBruto, marca, dados_json, possuiComposicao
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            linhas,
        )
        conn.commit()
    print(f"💾 Gravado em lote: {len(linhas)} linhas.")


def fnum(valor: object) -> float | None:
    try:
        return float(valor) if valor not in (None, "") else None
    except Exception:
        return None


def possui_composicao(produto: dict, simples_ids: Set[str], simples_codigos: Set[str]) -> str:
    """Retorna ``"S"`` quando o produto possui composição."""

    pid = produto.get("id")
    if pid is not None:
        pid_str = str(pid).strip()
        if pid_str and pid_str in simples_ids:
            return "N"

    codigo = produto.get("codigo")
    if codigo is not None:
        codigo_str = str(codigo).strip()
        if codigo_str and codigo_str in simples_codigos:
            return "N"

    avaliacao = _avaliar_dados_de_composicao(produto)
    if avaliacao:
        return avaliacao

    return "S"


def _avaliar_dados_de_composicao(produto: dict) -> str | None:
    """Inspeciona os campos do Bling para determinar composição."""

    def normalizar(valor: object) -> str | None:
        if isinstance(valor, str):
            texto = valor.strip().upper()
            if texto in {"S", "N"}:
                return texto
            if texto in {"SIM", "TRUE", "VERDADEIRO", "1"}:
                return "S"
            if texto in {"NAO", "NÃO", "FALSE", "FALSO", "0"}:
                return "N"
        elif isinstance(valor, bool):
            return "S" if valor else "N"
        elif isinstance(valor, (int, float)):
            return "S" if bool(valor) else "N"
        return None

    tipo = produto.get("tipo")
    if isinstance(tipo, str):
        tipo_normalizado = tipo.strip().upper()
        if tipo_normalizado == "PS":
            return "N"
        if tipo_normalizado == "PC":
            return "S"

    direto_produto = normalizar(produto.get("possuiComposicao"))
    if direto_produto:
        return direto_produto

    estrutura = produto.get("estrutura")
    if isinstance(estrutura, dict):
        tipo_estrutura = estrutura.get("tipo")
        if isinstance(tipo_estrutura, str):
            tipo_estrutura_norm = tipo_estrutura.strip().upper()
            if tipo_estrutura_norm == "PS":
                return "N"
            if tipo_estrutura_norm == "PC":
                return "S"
        direto = normalizar(estrutura.get("possuiComposicao"))
        if direto:
            return direto
        indireto = normalizar(estrutura.get("possui_composicao"))
        if indireto:
            return indireto
        componentes = estrutura.get("componentes") or estrutura.get("estruturaItens")
        if isinstance(componentes, (list, tuple, set)) and componentes:
            return "S"
        if isinstance(componentes, dict) and componentes:
            return "S"

    for chave in ("composicao", "componentes", "estruturaItens"):
        valor = produto.get(chave)
        if isinstance(valor, (list, tuple, set)) and valor:
            return "S"
        if isinstance(valor, dict) and valor:
            return "S"

    return None


# ---------------------------------------------------------------------------
# Coleta de produtos ativos
# ---------------------------------------------------------------------------
def coletar_produtos_ativos(token: str, parametros_extra: dict | None = None) -> List[dict]:
    ativos: List[dict] = []
    pagina = 1
    ids_ja_vistos: Set[str] = set()
    assinaturas_paginas: Set[Tuple[str, ...]] = set()

    while True:
        # A API v3 do Bling usa "pagina" neste endpoint.
        # Se usar "page", algumas respostas podem repetir sempre a primeira página.
        params = {"pagina": pagina, "limit": PAGE_LIMIT, "situacao": "A"}
        if parametros_extra:
            params.update(parametros_extra)

        headers = {"Authorization": f"Bearer {token}"}
        try:
            resp = session.get(API_PRODUTOS, headers=headers, params=params, timeout=60)
        except requests.RequestException as exc:
            raise RuntimeError(f"Erro ao consultar produtos (página {pagina}): {exc}") from exc

        if resp.status_code == 401:
            _refresh_access_token_or_raise()
            token = ACCESS_TOKEN or token
            continue  # refaz a mesma página com o token renovado

        if not resp.ok:
            raise RuntimeError(
                f"Erro ao listar produtos (página {pagina}): {resp.status_code} {resp.text}"
            )

        try:
            payload = resp.json()
        except ValueError as exc:
            raise RuntimeError(f"Resposta inválida ao listar produtos (página {pagina}).") from exc

        data = payload.get("data", []) if isinstance(payload, dict) else []
        if not data:
            print(f"📭 Página {pagina} vazia. Fim.")
            break

        ids_pagina: list[str] = []
        for produto in data:
            pid = produto.get("id")
            if pid is not None:
                ids_pagina.append(str(pid).strip())

        assinatura = tuple(ids_pagina)
        if assinatura and assinatura in assinaturas_paginas:
            print(
                f"⚠️  Página {pagina} repetiu os mesmos produtos de uma página anterior. "
                "Interrompendo para evitar duplicação infinita."
            )
            break
        if assinatura:
            assinaturas_paginas.add(assinatura)

        page_ativos: List[dict] = []
        novos_na_pagina = 0

        for produto in data:
            situacao = str(produto.get("situacao", "")).upper()
            if situacao not in ("A", "ATIVO"):
                continue

            pid = produto.get("id")
            chave = str(pid).strip() if pid is not None else ""

            # Se o produto tiver ID, evita contar o mesmo produto de novo.
            if chave:
                if chave in ids_ja_vistos:
                    continue
                ids_ja_vistos.add(chave)
                novos_na_pagina += 1

            page_ativos.append(produto)

        if not page_ativos and ids_pagina:
            print(
                f"⚠️  Página {pagina} não trouxe produtos ativos novos. "
                "Interrompendo para evitar repetir registros."
            )
            break

        ativos.extend(page_ativos)
        print(
            f"📄 Página {pagina}: total={len(data)} | "
            f"ativos novos={len(page_ativos)} | acumulado={len(ativos)}"
        )

        # Trava extra: se a página veio cheia de IDs já vistos, a paginação provavelmente travou.
        if ids_pagina and novos_na_pagina == 0:
            print("⚠️  Nenhum ID novo encontrado nesta página. Fim da coleta.")
            break

        pagina += 1
        time.sleep(RATE_LIMIT_S)

    return ativos


def coletar_identificadores_produtos_simples(token: str) -> tuple[Set[str], Set[str]]:
    produtos_simples = coletar_produtos_ativos(token, {"tipo": "PS"})
    ids: Set[str] = set()
    codigos: Set[str] = set()

    for produto in produtos_simples:
        pid = produto.get("id")
        if pid is not None:
            pid_str = str(pid).strip()
            if pid_str:
                ids.add(pid_str)

        codigo = produto.get("codigo")
        if codigo is not None:
            codigo_str = str(codigo).strip()
            if codigo_str:
                codigos.add(codigo_str)

    print(
        "🔍 Produtos simples (tipo=PS) capturados:"
        f" {len(ids)} identificadores e {len(codigos)} códigos."
    )
    return ids, codigos


def preparar_linhas(
    produtos: Iterable[dict],
    simples_ids: Set[str],
    simples_codigos: Set[str],
) -> List[Tuple]:
    linhas: List[Tuple] = []
    for p in produtos:
        linhas.append(
            (
                p.get("id"),
                p.get("codigo"),
                p.get("nome"),
                fnum(p.get("preco")),
                fnum(p.get("precoCusto") or p.get("precoCompra")),
                p.get("unidade"),
                p.get("tipo"),
                p.get("situacao"),
                p.get("descricaoCurta"),
                fnum(p.get("pesoLiquido")),
                fnum(p.get("pesoBruto")),
                p.get("marca"),
                json.dumps(p, ensure_ascii=False),
                possui_composicao(p, simples_ids, simples_codigos),
            )
        )
    return linhas


def executar_fluxo_produtos() -> int:
    token = get_access_token()
    produtos = coletar_produtos_ativos(token)
    simples_ids, simples_codigos = coletar_identificadores_produtos_simples(token)
    init_produtos_db()
    apagar_todos_produtos()
    linhas = preparar_linhas(produtos, simples_ids, simples_codigos)
    inserir_em_lote(linhas)
    return len(produtos)


# ---------------------------------------------------------------------------
# Flask – rotas de autorização
# ---------------------------------------------------------------------------
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
        return redirect(build_auth_url())

    carregar_tokens()
    cached = load_oauth_tokens()
    if ACCESS_TOKEN and cached and _now_unix() < int(cached["expires_at"]) - 30:
        return jsonify({"status": "ok", "detail": "Já autorizado. Use /run."})

    try:
        if ACCESS_TOKEN and REFRESH_TOKEN:
            _refresh_access_token_or_raise()
            return jsonify({"status": "ok", "detail": "Token renovado. Use /run."})
    except RuntimeError:
        pass

    return redirect(build_auth_url())


@app.route("/callback")
def callback():
    global CODE, ACCESS_TOKEN, REFRESH_TOKEN

    CODE = request.args.get("code")
    if not CODE:
        return "Erro: authorization code não recebido.", 400

    resp = _post_token(
        {
            "grant_type": "authorization_code",
            "code": CODE,
            "redirect_uri": REDIRECT_URI,
        }
    )
    if not resp.ok:
        return f"Erro ao obter token: {resp.status_code} {resp.text}", 400

    tk = resp.json()
    ACCESS_TOKEN = tk.get("access_token")
    REFRESH_TOKEN = tk.get("refresh_token", "")
    if not ACCESS_TOKEN or not REFRESH_TOKEN:
        return "Erro: resposta de token incompleta.", 400

    salvar_tokens(CODE, ACCESS_TOKEN, REFRESH_TOKEN)
    save_oauth_tokens(ACCESS_TOKEN, REFRESH_TOKEN, tk.get("expires_in", 3600))

    return jsonify({"status": "ok", "detail": "Autorizado. Execute /run ou reabra o script."})


@app.route("/run")
def run_pipeline():
    try:
        quantidade = executar_fluxo_produtos()
        return jsonify({"ok": True, "produtos": quantidade})
    except Exception as exc:  # noqa: BLE001 - queremos retornar o erro ao usuário
        return jsonify({"ok": False, "error": str(exc)}), 400


# ---------------------------------------------------------------------------
# Execução direta
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    ensure_oauth_db()
    save_oauth_app()
    init_token_db()
    init_produtos_db()
    carregar_tokens()

    try:
        quantidade = executar_fluxo_produtos()
        print("✅ Concluído.")
        print(f"   Produtos ativos importados: {quantidade}")
        print(f"   Banco: {os.path.abspath(PRODUTOS_DB_PATH)}")
        print("   Tabela: produtos (somente ativos)")
    except RuntimeError as exc:
        print("⚠️  Não foi possível usar o token automaticamente:", exc)
        print("➡️  Abrindo a tela de autorização. Após aceitar no Bling, execute /run.")
        try:
            webbrowser.open("http://localhost:5000/auth?force=1")
        except Exception:
            pass
        print("🚀 Flask rodando em http://localhost:5000")
        print("   1) /auth  → autorizar/renovar (abrirá automaticamente)")
        print("   2) /callback → retorno do Bling")
        print("   3) /run   → executar manual (opcional)")
        app.run(host="127.0.0.1", port=5000, debug=False)