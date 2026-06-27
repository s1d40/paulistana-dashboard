# -*- coding: utf-8 -*-
import os
import json
import time
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests
from requests.auth import HTTPBasicAuth

# ---------------------------------------------------------
# Config
# ---------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# DBs locais (mesma pasta do script)
TOKENS_DB_PATH   = os.path.join(BASE_DIR, "bling_tokens.db")   # tokens do Bling
CLIENTES_DB_PATH = os.path.join(BASE_DIR, "clientes.db")       # destino dos clientes
PBIDS_PATH       = os.path.join(BASE_DIR, "PowerBI_Clientes_SQLite.pbids")

# Credenciais (para REFRESH TOKEN via Basic Auth)
CLIENT_ID     = "18197aab08ad11ae5291f07f55d2ae5c55997256"
CLIENT_SECRET = "d02ef2ec089b639a98778dbb476afa92c8b4aa906546c717f2c85c533164"

# API
BASE_API     = "https://www.bling.com.br/Api/v3"
TOKEN_URL    = f"{BASE_API}/oauth/token"
API_CONTATOS = f"{BASE_API}/contatos"

PAGE_LIMIT   = 100
RATE_LIMIT_S = 0.35  # ~3 req/s

# HTTP Session global
session = requests.Session()
session.headers.update({"Accept": "application/json"})

# ---------------------------------------------------------
# Token helpers (flexíveis ao esquema do seu bling_tokens.db)
# ---------------------------------------------------------
POSSIBLE_TABLES        = ["oauth_tokens", "tokens", "bling_tokens"]
POSSIBLE_PROVIDER_COLS = ["provider", "provedor", "origem", "fonte"]
POSSIBLE_ACCESS_COLS   = ["access_token", "token", "access"]
POSSIBLE_REFRESH_COLS  = ["refresh_token", "refresh"]
POSSIBLE_EXPIRES_COLS  = ["expires_at", "expiry", "expires", "expira_em", "valid_until"]

def _table_exists(conn: sqlite3.Connection, table: str) -> bool:
    cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (table,))
    return cur.fetchone() is not None

def _columns(conn: sqlite3.Connection, table: str) -> List[str]:
    cur = conn.execute(f"PRAGMA table_info({table});")
    return [row[1] for row in cur.fetchall()]

def _select_row_by_provider(conn: sqlite3.Connection, table: str, provider_col: Optional[str]) -> Optional[sqlite3.Row]:
    conn.row_factory = sqlite3.Row
    if provider_col:
        for prov in ("bling", "bling_v3", "bling_api"):
            try:
                row = conn.execute(
                    f"SELECT * FROM {table} WHERE {provider_col} = ? ORDER BY ROWID DESC LIMIT 1;",
                    (prov,),
                ).fetchone()
                if row:
                    return row
            except Exception:
                pass
    # fallback: mais recente
    try:
        return conn.execute(f"SELECT * FROM {table} ORDER BY ROWID DESC LIMIT 1;").fetchone()
    except Exception:
        return None

def _load_tokens_from_db() -> Optional[Tuple[str, Optional[str], int]]:
    if not os.path.exists(TOKENS_DB_PATH):
        return None
    with sqlite3.connect(TOKENS_DB_PATH) as conn:
        for table in POSSIBLE_TABLES:
            if not _table_exists(conn, table):
                continue
            cols = {c.lower() for c in _columns(conn, table)}
            provider_col = next((c for c in POSSIBLE_PROVIDER_COLS if c in cols), None)
            access_col   = next((c for c in POSSIBLE_ACCESS_COLS   if c in cols), None)
            refresh_col  = next((c for c in POSSIBLE_REFRESH_COLS  if c in cols), None)
            expires_col  = next((c for c in POSSIBLE_EXPIRES_COLS  if c in cols), None)
            if not access_col:
                continue
            row = _select_row_by_provider(conn, table, provider_col)
            if not row:
                continue
            access_token  = row[access_col] if access_col in row.keys() else None
            refresh_token = row[refresh_col] if refresh_col and refresh_col in row.keys() else None
            expires_at    = 0
            if expires_col and expires_col in row.keys() and row[expires_col]:
                try:
                    expires_at = int(row[expires_col])
                except Exception:
                    expires_at = 0
            if access_token:
                return access_token, refresh_token, expires_at
    return None

def _is_expired(expires_at: int) -> bool:
    if not expires_at:
        return True
    return time.time() >= expires_at

def _save_tokens_standard(access_token: str, refresh_token: Optional[str], expires_in: int):
    """Padroniza e salva em oauth_tokens (cria se preciso) dentro de bling_tokens.db"""
    expires_at = int(time.time()) + int(expires_in) - 60
    with sqlite3.connect(TOKENS_DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS oauth_tokens (
                provider TEXT PRIMARY KEY,
                access_token TEXT,
                refresh_token TEXT,
                expires_at INTEGER
            );
            """
        )
        conn.execute(
            """
            INSERT INTO oauth_tokens (provider, access_token, refresh_token, expires_at)
            VALUES ('bling', ?, ?, ?)
            ON CONFLICT(provider) DO UPDATE SET
                access_token=excluded.access_token,
                refresh_token=COALESCE(excluded.refresh_token, oauth_tokens.refresh_token),
                expires_at=excluded.expires_at;
            """,
            (access_token, refresh_token, expires_at),
        )
        conn.commit()

def _refresh_with_refresh_token(refresh_token: str) -> str:
    """
    Renova o access_token usando refresh_token.
    IMPORTANTE: Bling requer CLIENT_ID/CLIENT_SECRET no HEADER Authorization (Basic),
    não no corpo -> usamos auth=HTTPBasicAuth(...).
    """
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    resp = session.post(
        TOKEN_URL,
        data=data,
        headers=headers,
        auth=HTTPBasicAuth(CLIENT_ID, CLIENT_SECRET),  # <<< essencial
        timeout=60,
    )

    if not resp.ok:
        try:
            payload = resp.json()
        except Exception:
            payload = {"raw": resp.text}
        raise RuntimeError(f"Falha ao renovar token ({resp.status_code}): {payload}")

    tok = resp.json()
    access_token = tok.get("access_token")
    new_refresh  = tok.get("refresh_token", refresh_token)
    try:
        expires_in = int(tok.get("expires_in", 3600))
    except Exception:
        expires_in = 3600

    if not access_token:
        raise RuntimeError(f"Resposta de token inválida: {tok}")

    _save_tokens_standard(access_token, new_refresh, expires_in)
    return access_token

def get_access_token() -> str:
    """
    1) Lê do bling_tokens.db (tabelas/colunas flexíveis).
    2) Se expirado e houver refresh_token -> renova via Basic Auth.
    3) Como fallback, tenta env var BLING_ACCESS_TOKEN.
    """
    loaded = _load_tokens_from_db()
    if loaded:
        access_token, refresh_token, expires_at = loaded
        if access_token and expires_at and not _is_expired(expires_at):
            return access_token
        if refresh_token:
            return _refresh_with_refresh_token(refresh_token)
        if access_token:
            # tenta assim mesmo; se 401, o bling_get tratará
            return access_token

    env_token = os.getenv("BLING_ACCESS_TOKEN")
    if env_token:
        return env_token

    raise RuntimeError(
        "Não encontrei token válido no 'bling_tokens.db'. "
        "Garanta que exista ao menos um access_token (ideal: com refresh_token e expires_at)."
    )

# ---------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------
def bling_get(url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    headers = {"Authorization": f"Bearer {get_access_token()}", "Accept": "application/json"}
    for attempt in range(5):
        resp = session.get(url, headers=headers, params=params, timeout=60)
        if resp.status_code == 401:
            # tenta um refresh (se houver) e refaz 1x
            loaded = _load_tokens_from_db()
            if loaded and loaded[1]:
                _refresh_with_refresh_token(loaded[1])
                headers["Authorization"] = f"Bearer {get_access_token()}"
                resp = session.get(url, headers=headers, params=params, timeout=60)
        if resp.status_code in (429,) or 500 <= resp.status_code < 600:
            wait = 1.5 * (attempt + 1)
            print(f"[WARN] HTTP {resp.status_code} — retry em {wait:.1f}s...")
            time.sleep(wait)
            continue
        if not resp.ok:
            try:
                payload = resp.json()
            except Exception:
                payload = {"raw": resp.text}
            raise RuntimeError(f"Erro {resp.status_code} ao chamar {url}: {payload}")
        try:
            return resp.json()
        except Exception:
            raise RuntimeError(f"Resposta não JSON de {url}: {resp.text[:300]}")
    raise RuntimeError(f"Falha após várias tentativas em {url}")

def extract_items(payload: Any) -> List[Dict[str, Any]]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        if "data" in payload:
            d = payload["data"]
            if isinstance(d, list):
                return d
            if isinstance(d, dict):
                for key in ("items", "content", "data", "contatos"):
                    if key in d and isinstance(d[key], list):
                        return d[key]
        for key in ("items", "content", "data", "contatos"):
            if key in payload and isinstance(payload[key], list):
                return payload[key]
    return []

# ---------------------------------------------------------
# Normalização
# ---------------------------------------------------------
def flatten_contato(raw: Dict[str, Any]) -> Tuple:
    contato_id  = raw.get("id")
    nome        = raw.get("nome") or raw.get("razaoSocial") or raw.get("fantasia")
    tipo_pessoa = raw.get("tipoPessoa") or raw.get("tipo")
    cpf_cnpj    = raw.get("cpfCnpj") or raw.get("cpf") or raw.get("cnpj")
    ie_rg       = raw.get("ieRg") or raw.get("inscricaoEstadual") or raw.get("rg")

    email    = raw.get("email")
    telefone = raw.get("telefone")
    celular  = raw.get("celular")

    end = raw.get("endereco", {}) or {}
    endereco     = end.get("endereco") or end.get("logradouro")
    numero       = end.get("numero")
    complemento  = end.get("complemento")
    bairro       = end.get("bairro")
    cidade       = end.get("cidade")
    uf           = end.get("uf")
    cep          = end.get("cep")
    pais         = end.get("pais")

    data_inclusao  = raw.get("dataInclusao") or raw.get("dataCriacao") or raw.get("criacao")
    data_alteracao = raw.get("dataAlteracao") or raw.get("atualizadoEm") or raw.get("alteracao")

    situacao     = raw.get("situacao")
    contribuinte = raw.get("contribuinte")

    dados_json = json.dumps(raw, ensure_ascii=False)

    return (
        contato_id, nome, tipo_pessoa, cpf_cnpj, ie_rg,
        email, telefone, celular,
        endereco, numero, complemento, bairro, cidade, uf, cep, pais,
        data_inclusao, data_alteracao, situacao, contribuinte,
        dados_json,
    )

# ---------------------------------------------------------
# Banco de dados (clientes.db) + UPSERT em lote
# ---------------------------------------------------------
def ensure_clientes_db():
    with sqlite3.connect(CLIENTES_DB_PATH) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY,
                nome TEXT,
                tipo_pessoa TEXT,
                cpf_cnpj TEXT,
                ie_rg TEXT,
                email TEXT,
                telefone TEXT,
                celular TEXT,
                endereco TEXT,
                numero TEXT,
                complemento TEXT,
                bairro TEXT,
                cidade TEXT,
                uf TEXT,
                cep TEXT,
                pais TEXT,
                data_inclusao TEXT,
                data_alteracao TEXT,
                situacao TEXT,
                contribuinte TEXT,
                dados_json TEXT NOT NULL
            );
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);")

def bulk_upsert_clientes(rows: List[Tuple]):
    if not rows:
        return
    with sqlite3.connect(CLIENTES_DB_PATH) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.executemany(
            """
            INSERT INTO clientes (
                id, nome, tipo_pessoa, cpf_cnpj, ie_rg,
                email, telefone, celular,
                endereco, numero, complemento, bairro, cidade, uf, cep, pais,
                data_inclusao, data_alteracao, situacao, contribuinte, dados_json
            )
            VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?
            )
            ON CONFLICT(id) DO UPDATE SET
                nome=excluded.nome,
                tipo_pessoa=excluded.tipo_pessoa,
                cpf_cnpj=excluded.cpf_cnpj,
                ie_rg=excluded.ie_rg,
                email=excluded.email,
                telefone=excluded.telefone,
                celular=excluded.celular,
                endereco=excluded.endereco,
                numero=excluded.numero,
                complemento=excluded.complemento,
                bairro=excluded.bairro,
                cidade=excluded.cidade,
                uf=excluded.uf,
                cep=excluded.cep,
                pais=excluded.pais,
                data_inclusao=COALESCE(excluded.data_inclusao, data_inclusao),
                data_alteracao=excluded.data_alteracao,
                situacao=excluded.situacao,
                contribuinte=excluded.contribuinte,
                dados_json=excluded.dados_json;
            """,
            rows,
        )
        conn.commit()

# ---------------------------------------------------------
# Power BI (.pbids) – ODBC SQLite
# ---------------------------------------------------------
def write_pbids():
    pbids = {
        "version": "0.1",
        "connections": [
            {
                "details": {
                    "protocol": "odbc",
                    "connectionString": f"Driver={{SQLite3 ODBC Driver}};Database={CLIENTES_DB_PATH};"
                },
                "name": "Clientes (SQLite via ODBC)"
            }
        ]
    }
    with open(PBIDS_PATH, "w", encoding="utf-8") as f:
        json.dump(pbids, f, ensure_ascii=False, indent=2)
    print(f"[OK] PBIDS criado em: {PBIDS_PATH}")

# ---------------------------------------------------------
# ETL principal
# ---------------------------------------------------------
def fetch_all_clientes() -> List[Dict[str, Any]]:
    print("[INFO] Iniciando download de clientes do Bling...")
    page = 1
    total = 0
    todos: List[Dict[str, Any]] = []
    while True:
        params = {"page": page, "limit": PAGE_LIMIT}
        payload = bling_get(API_CONTATOS, params=params)
        items = extract_items(payload)
        if not items:
            print(f"[INFO] Página {page} vazia. Fim da paginação.")
            break
        todos.extend(items)
        total += len(items)
        print(f"[INFO] Página {page} → {len(items)} clientes (acumulado: {total}).")
        page += 1
        time.sleep(RATE_LIMIT_S)
    print(f"[OK] Total de clientes baixados: {total}.")
    return todos

def main():
    ensure_clientes_db()
    clientes_raw = fetch_all_clientes()
    rows = [flatten_contato(c) for c in clientes_raw]
    print(f"[INFO] Gravando {len(rows)} registros em lote (UPSERT)...")
    bulk_upsert_clientes(rows)
    print(f"[OK] Banco pronto em: {CLIENTES_DB_PATH}")
    write_pbids()
    print("[OK] Concluído. Abra o .pbids no Power BI Desktop.")

if __name__ == "__main__":
    main()
