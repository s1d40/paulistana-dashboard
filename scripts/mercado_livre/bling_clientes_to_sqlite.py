# -*- coding: utf-8 -*-
"""ETL para sincronizar contatos do Bling com SQLite/PowerBI.

Primeira execução: baixa todo o catálogo (aprox. 30 mil contatos) e salva em
clientes.db.
Execuções subsequentes: consulta a base local e interrompe a paginação assim
que todas as páginas retornarem apenas IDs já conhecidos, evitando duplicatas.
"""
import json
import os
import sqlite3
import time
from typing import Any, Callable, Dict, Iterable, List, Optional, Set, Tuple

import requests
from requests.auth import HTTPBasicAuth

# ---------------------------------------------------------
# Config
# ---------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# DBs locais (mesma pasta do script)
TOKENS_DB_PATH = os.path.join(BASE_DIR, "bling_tokens.db")  # tokens do Bling
CLIENTES_DB_PATH = os.path.join(BASE_DIR, "clientes.db")  # destino dos clientes
PBIDS_PATH = os.path.join(BASE_DIR, "PowerBI_Clientes_SQLite.pbids")

# Credenciais (para REFRESH TOKEN via Basic Auth)
CLIENT_ID = "18197aab08ad11ae5291f07f55d2ae5c55997256"
CLIENT_SECRET = "d02ef2ec089b639a98778dbb476afa92c8b4aa906546c717f2c85c533164"

# API
BASE_API = "https://www.bling.com.br/Api/v3"
TOKEN_URL = f"{BASE_API}/oauth/token"
API_CONTATOS = f"{BASE_API}/contatos"

PAGE_LIMIT = 100
RATE_LIMIT_S = 0.35  # ~3 req/s
MAX_PAGES = 1_000_000  # guarda-chuva de segurança

# HTTP Session global
session = requests.Session()
session.headers.update({"Accept": "application/json"})

_LAST_REQUEST_TS = 0.0


def _respect_rate_limit():
    global _LAST_REQUEST_TS
    if RATE_LIMIT_S <= 0:
        return
    now = time.time()
    elapsed = now - _LAST_REQUEST_TS
    if elapsed < RATE_LIMIT_S:
        time.sleep(RATE_LIMIT_S - elapsed)
    _LAST_REQUEST_TS = time.time()

# ---------------------------------------------------------
# Token helpers (flexíveis ao esquema do seu bling_tokens.db)
# ---------------------------------------------------------
POSSIBLE_TABLES = ["oauth_tokens", "tokens", "bling_tokens"]
POSSIBLE_PROVIDER_COLS = ["provider", "provedor", "origem", "fonte"]
POSSIBLE_ACCESS_COLS = ["access_token", "token", "access"]
POSSIBLE_REFRESH_COLS = ["refresh_token", "refresh"]
POSSIBLE_EXPIRES_COLS = ["expires_at", "expiry", "expires", "expira_em", "valid_until"]


def _table_exists(conn: sqlite3.Connection, table: str) -> bool:
    cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (table,))
    return cur.fetchone() is not None


def _columns(conn: sqlite3.Connection, table: str) -> List[str]:
    cur = conn.execute(f"PRAGMA table_info({table});")
    return [row[1] for row in cur.fetchall()]


def _select_row_by_provider(
    conn: sqlite3.Connection, table: str, provider_col: Optional[str]
) -> Optional[sqlite3.Row]:
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
            access_col = next((c for c in POSSIBLE_ACCESS_COLS if c in cols), None)
            refresh_col = next((c for c in POSSIBLE_REFRESH_COLS if c in cols), None)
            expires_col = next((c for c in POSSIBLE_EXPIRES_COLS if c in cols), None)
            if not access_col:
                continue
            row = _select_row_by_provider(conn, table, provider_col)
            if not row:
                continue
            access_token = row[access_col] if access_col in row.keys() else None
            refresh_token = row[refresh_col] if refresh_col and refresh_col in row.keys() else None
            expires_at = 0
            if expires_col and expires_col in row.keys() and row[expires_col]:
                try:
                    expires_at = int(row[expires_col])
                except Exception:
                    expires_at = 0
            if access_token:
                return access_token, refresh_token, expires_at
    return None


def _is_expired(expires_at: int) -> bool:
    return (not expires_at) or (time.time() >= expires_at)


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
    new_refresh = tok.get("refresh_token", refresh_token)
    try:
        expires_in = int(tok.get("expires_in", 3600))
    except Exception:
        expires_in = 3600
    if not access_token:
        raise RuntimeError(f"Resposta de token inválida: {tok}")

    _save_tokens_standard(access_token, new_refresh, expires_in)
    return access_token


def get_access_token() -> str:
    """Obtém um access_token válido, renovando se necessário."""

    loaded = _load_tokens_from_db()
    if loaded:
        access_token, refresh_token, expires_at = loaded
        if access_token and not _is_expired(expires_at):
            return access_token
        if refresh_token:
            return _refresh_with_refresh_token(refresh_token)
        if access_token:
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
        _respect_rate_limit()
        resp = session.get(url, headers=headers, params=params, timeout=60)
        if resp.status_code == 401:
            loaded = _load_tokens_from_db()
            if loaded and loaded[1]:
                _refresh_with_refresh_token(loaded[1])
                headers["Authorization"] = f"Bearer {get_access_token()}"
                _respect_rate_limit()
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
        except Exception as exc:
            raise RuntimeError(f"Resposta não JSON de {url}: {resp.text[:300]}") from exc
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


def fetch_contato_detail(contato_id: int) -> Dict[str, Any]:
    url = f"{API_CONTATOS}/{contato_id}"
    payload = bling_get(url, params={})
    items = extract_items(payload)
    for item in items:
        if isinstance(item, dict):
            return item
    if isinstance(payload, dict):
        data = payload.get("data")
        if isinstance(data, dict):
            for key in ("contato", "item", "content", "dados", "data"):
                value = data.get(key)
                if isinstance(value, dict):
                    return value
            return data
        if isinstance(data, list):
            for entry in data:
                if isinstance(entry, dict):
                    return entry
        for key in ("contato", "item", "content", "dados"):
            if key in payload and isinstance(payload[key], dict):
                return payload[key]
    raise RuntimeError(f"Não foi possível extrair detalhes do contato {contato_id}: {payload}")


# ---------------------------------------------------------
# Normalização
# ---------------------------------------------------------
def flatten_contato(raw: Dict[str, Any], completo: bool) -> Tuple:
    contato_id = raw.get("id")
    nome = raw.get("nome") or raw.get("razaoSocial") or raw.get("fantasia")
    tipo_pessoa = raw.get("tipoPessoa") or raw.get("tipo")
    cpf_cnpj = raw.get("cpfCnpj") or raw.get("cpf") or raw.get("cnpj")
    ie_rg = raw.get("ieRg") or raw.get("inscricaoEstadual") or raw.get("rg")

    email = raw.get("email")
    telefone = raw.get("telefone")
    celular = raw.get("celular")

    end = raw.get("endereco", {}) or {}
    endereco = end.get("endereco") or end.get("logradouro")
    numero = end.get("numero")
    complemento = end.get("complemento")
    bairro = end.get("bairro")
    cidade = end.get("cidade")
    uf = end.get("uf")
    cep = end.get("cep")
    pais = end.get("pais")

    data_inclusao = raw.get("dataInclusao") or raw.get("dataCriacao") or raw.get("criacao")
    data_alteracao = raw.get("dataAlteracao") or raw.get("atualizadoEm") or raw.get("alteracao")

    situacao = raw.get("situacao")
    contribuinte = raw.get("contribuinte")

    dados_json = json.dumps(raw, ensure_ascii=False)
    dados_completos = 1 if completo else 0

    return (
        contato_id,
        nome,
        tipo_pessoa,
        cpf_cnpj,
        ie_rg,
        email,
        telefone,
        celular,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        cep,
        pais,
        data_inclusao,
        data_alteracao,
        situacao,
        contribuinte,
        dados_json,
        dados_completos,
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
                dados_json TEXT NOT NULL,
                dados_completos INTEGER DEFAULT 0
            );
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);")
        cur = conn.execute("PRAGMA table_info(clientes);")
        existing_cols = {row[1] for row in cur.fetchall()}
        if "dados_completos" not in existing_cols:
            conn.execute("ALTER TABLE clientes ADD COLUMN dados_completos INTEGER DEFAULT 0;")


def load_existing_clientes_state() -> Tuple[Dict[int, bool], Set[int]]:
    """Retorna o status de contatos já persistidos e quais precisam de detalhes."""

    if not os.path.exists(CLIENTES_DB_PATH):
        return {}, set()

    try:
        with sqlite3.connect(CLIENTES_DB_PATH) as conn:
            cur = conn.execute("SELECT id, COALESCE(dados_completos, 0) FROM clientes;")
            existentes: Dict[int, bool] = {}
            pendentes: Set[int] = set()
            for raw_id, completo in cur.fetchall():
                if raw_id is None:
                    continue
                try:
                    cid = int(raw_id)
                except (TypeError, ValueError):
                    continue
                is_completo = bool(completo)
                existentes[cid] = is_completo
                if not is_completo:
                    pendentes.add(cid)
            return existentes, pendentes
    except sqlite3.DatabaseError:
        return {}, set()


def load_existing_ids() -> Set[int]:
    existentes, _ = load_existing_clientes_state()
    return set(existentes.keys())


def bulk_upsert_clientes(rows: Iterable[Tuple[Any, ...]]):
    rows = list(rows)
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
                data_inclusao, data_alteracao, situacao, contribuinte, dados_json, dados_completos
            )
            VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?
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
                dados_json=excluded.dados_json,
                dados_completos=MAX(clientes.dados_completos, excluded.dados_completos);
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
                "name": "Clientes (SQLite via ODBC)",
            }
        ],
    }
    with open(PBIDS_PATH, "w", encoding="utf-8") as f:
        json.dump(pbids, f, ensure_ascii=False, indent=2)
    print(f"[OK] PBIDS criado em: {PBIDS_PATH}")


# ---------------------------------------------------------
# ETL principal — com DEDUP e PARADA SEGURA
# ---------------------------------------------------------
def _extract_page_info(payload: Any) -> Tuple[Optional[int], Optional[int], Optional[bool]]:
    """Tenta identificar paginação declarada no payload."""

    if not isinstance(payload, dict):
        return None, None, None

    candidates = [
        payload.get("page"),
        payload.get("pagina"),
        payload.get("paging"),
        payload.get("pagination"),
        payload.get("meta", {}).get("page") if isinstance(payload.get("meta"), dict) else None,
    ]

    for info in candidates:
        if not isinstance(info, dict):
            continue
        number_keys = ("number", "pagina", "page", "current", "pageNumber")
        total_keys = ("totalPages", "total_paginas", "total", "pages")
        next_keys = ("hasNext", "hasNextPage", "next", "possuiProxima")

        number = next((info.get(k) for k in number_keys if info.get(k) is not None), None)
        total = next((info.get(k) for k in total_keys if info.get(k) is not None), None)
        has_next = next((info.get(k) for k in next_keys if info.get(k) is not None), None)

        def _to_int(value: Any) -> Optional[int]:
            try:
                return int(value)
            except (TypeError, ValueError):
                return None

        number_int = _to_int(number)
        total_int = _to_int(total)
        if isinstance(has_next, str):
            has_next = has_next.lower() not in {"false", "0", "no", "nao", "não"}
        elif isinstance(has_next, (int, float)):
            has_next = bool(has_next)
        elif has_next not in (True, False):
            has_next = None

        if number_int is not None or total_int is not None or has_next is not None:
            return number_int, total_int, has_next

    return None, None, None


def fetch_all_clientes(
    existing_state: Optional[Dict[int, bool]] = None,
    pending_detail_ids: Optional[Set[int]] = None,
    flush_callback: Optional[Callable[[List[Tuple[Dict[str, Any], bool]]], None]] = None,
) -> List[Tuple[Dict[str, Any], bool]]:
    print("[INFO] Iniciando download de clientes do Bling...")
    page = 1
    existing_state = existing_state or {}
    existing_ids = set(existing_state.keys())
    pending_detail_ids = set(pending_detail_ids or set())
    seen_ids: Set[int] = set(existing_ids)
    detalhes: List[Tuple[Dict[str, Any], bool]] = []
    consecutive_no_new = 0
    last_page_signature: Optional[Tuple[int, ...]] = None
    repeated_signature_count = 0
    max_no_new_pages = 3 if existing_ids else 30
    use_offset = False

    novos_total = 0
    atualizados_total = 0
    novos_sem_detalhe = 0
    detail_failures: Set[int] = set()
    attempted_existing_detail: Set[int] = set()
    detail_attempted_ids: Set[int] = set()

    def _append_detail(entry: Dict[str, Any], completo: bool):
        detalhes.append((entry, completo))
        if flush_callback and len(detalhes) >= 100:
            flush_batch = detalhes.copy()
            detalhes.clear()
            flush_callback(flush_batch)

    while page <= MAX_PAGES:
        params = {
            "page": page,
            "pagina": page,
            "limit": PAGE_LIMIT,
            "limite": PAGE_LIMIT,
        }
        if use_offset:
            offset = (page - 1) * PAGE_LIMIT
            params.update({"offset": offset, "inicio": offset})

        payload = bling_get(API_CONTATOS, params=params)
        items = extract_items(payload)

        if not items:
            print(f"[INFO] Página {page} vazia. Fim da paginação.")
            break

        novos_na_pagina = 0
        ja_conhecidos = 0
        ids_na_pagina: List[int] = []
        for it in items:
            if not isinstance(it, dict):
                continue
            cid = it.get("id")
            if cid is None:
                continue
            try:
                cid_int = int(cid)
            except (TypeError, ValueError):
                continue

            ids_na_pagina.append(cid_int)
            is_known = cid_int in existing_ids

            if cid_int in seen_ids:
                ja_conhecidos += 1
            else:
                seen_ids.add(cid_int)
                if is_known:
                    ja_conhecidos += 1
                else:
                    novos_na_pagina += 1

            needs_detail = (not is_known) or (cid_int in pending_detail_ids)
            if not needs_detail or cid_int in detail_attempted_ids:
                continue

            try:
                detail = fetch_contato_detail(cid_int)
            except RuntimeError as exc:
                print(f"[WARN] Falha ao obter detalhes do contato {cid_int}: {exc}")
                detail_failures.add(cid_int)
                detail_attempted_ids.add(cid_int)
                if is_known:
                    attempted_existing_detail.add(cid_int)
                else:
                    _append_detail(it, False)
                    novos_sem_detalhe += 1
                continue

            _append_detail(detail, True)
            detail_attempted_ids.add(cid_int)
            if is_known:
                atualizados_total += 1
                pending_detail_ids.discard(cid_int)
                attempted_existing_detail.add(cid_int)
            else:
                novos_total += 1

        print(
            f"[INFO] Página {page} → recebidos {len(items)}, novos {novos_na_pagina}, "
            f"já conhecidos {ja_conhecidos} (total únicos: {len(seen_ids)})."
        )

        if novos_na_pagina == 0:
            consecutive_no_new += 1
            signature = tuple(sorted(ids_na_pagina)) if ids_na_pagina else tuple()
            if signature == last_page_signature:
                repeated_signature_count += 1
            else:
                last_page_signature = signature
                repeated_signature_count = 1
        else:
            consecutive_no_new = 0
            last_page_signature = None
            repeated_signature_count = 0

        if repeated_signature_count >= 3 and novos_na_pagina == 0:
            if not use_offset:
                use_offset = True
                repeated_signature_count = 0
                last_page_signature = None
                print(
                    "[INFO] API retornou a mesma combinação de IDs repetidamente. "
                    "Alternando para paginação via offset para continuar a busca."
                )
            else:
                print(
                    "[WARN] Mesma combinação de IDs recebida repetidamente mesmo com offset; "
                    "encerrando para evitar loop infinito."
                )
                break

        page_number, total_pages, has_next = _extract_page_info(payload)
        if total_pages is not None and page_number is not None and page_number >= total_pages:
            print("[INFO] Página declarada como última pelo payload; encerrando paginação.")
            break
        if has_next is False:
            print("[INFO] Payload indicou que não há mais páginas.")
            break

        if consecutive_no_new >= max_no_new_pages:
            print(
                "[INFO] Número máximo de páginas sem novidades atingido; assumindo fim da paginação."
            )
            break

        if len(items) < PAGE_LIMIT and novos_na_pagina == 0 and has_next is None:
            print("[INFO] Página incompleta recebida e sem sinalização de novas páginas; encerrando.")
            break

        page += 1

    remaining_pending = pending_detail_ids - attempted_existing_detail
    if remaining_pending:
        print(
            f"[INFO] Buscando detalhes pendentes para {len(remaining_pending)} contatos já armazenados sem dados completos..."
        )
        for cid in sorted(remaining_pending):
            try:
                detail = fetch_contato_detail(cid)
            except RuntimeError as exc:
                print(f"[WARN] Falha ao obter detalhes do contato {cid}: {exc}")
                detail_failures.add(cid)
                continue
            _append_detail(detail, True)
            detail_attempted_ids.add(cid)
            attempted_existing_detail.add(cid)
            atualizados_total += 1
            pending_detail_ids.discard(cid)

    if flush_callback and detalhes:
        flush_batch = detalhes.copy()
        detalhes.clear()
        flush_callback(flush_batch)

    if novos_total:
        print(f"[OK] Total de novos contatos detalhados nesta execução: {novos_total}.")
    if novos_sem_detalhe:
        print(
            f"[WARN] Não foi possível obter detalhes completos para {novos_sem_detalhe} novos contatos; "
            "eles permanecerão marcados para complementação futura."
        )
    if not novos_total and not novos_sem_detalhe:
        print("[OK] Nenhum contato novo identificado no Bling.")

    if atualizados_total:
        print(f"[OK] Contatos existentes atualizados com detalhes completos: {atualizados_total}.")

    existing_failures = len(detail_failures.intersection(existing_ids))
    if existing_failures:
        print(
            f"[WARN] Não foi possível detalhar {existing_failures} contatos já existentes nesta execução; "
            "uma nova tentativa será feita nas próximas execuções."
        )

    restantes = len(pending_detail_ids)
    if restantes:
        print(f"[INFO] Permanecem {restantes} contatos existentes aguardando dados completos.")

    return detalhes


def main():
    ensure_clientes_db()
    existentes_state, pendentes = load_existing_clientes_state()
    existentes_ids = set(existentes_state.keys())
    if existentes_ids:
        print(f"[INFO] IDs já armazenados: {len(existentes_ids)}.")
        if pendentes:
            print(
                f"[INFO] Contatos aguardando complementação de dados detalhados: {len(pendentes)}."
            )
        print("[INFO] Buscando novidades e atualizando cadastros existentes...")
    else:
        print("[INFO] Nenhum ID prévio encontrado — primeira execução deve carregar todo o catálogo.")

    total_upserts = 0

    def flush_and_store(batch: List[Tuple[Dict[str, Any], bool]]):
        nonlocal total_upserts
        if not batch:
            return
        rows = [flatten_contato(raw, completo) for raw, completo in batch]
        print(f"[INFO] Gravando lote de {len(rows)} registros em clientes.db...")
        bulk_upsert_clientes(rows)
        print("[OK] Lote armazenado com sucesso.")
        total_upserts += len(rows)

    clientes_processados = fetch_all_clientes(
        existing_state=existentes_state,
        pending_detail_ids=pendentes,
        flush_callback=flush_and_store,
    )
    if clientes_processados:
        flush_and_store(clientes_processados)

    if total_upserts:
        print(
            f"[OK] Banco atualizado com {total_upserts} registros processados: {CLIENTES_DB_PATH}"
        )
    else:
        print("[OK] Nenhuma alteração aplicada ao banco — já estava em dia.")
    write_pbids()
    print("[OK] Concluído. Abra o .pbids no Power BI Desktop.")


if __name__ == "__main__":
    main()