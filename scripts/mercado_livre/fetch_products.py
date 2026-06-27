"""Ferramentas para sincronizar anúncios do Mercado Livre com um banco local e
preencher uma planilha Google Sheets.

Esta versão foi otimizada para reduzir o tempo total de execução mantendo o
limite de até ~3 requisições por segundo imposto pela API. As principais
melhorias são:

* **Uso do endpoint em lote `/items`**  Busca até 20 anúncios por requisição,
  diminuindo drasticamente a quantidade de chamadas necessárias para carregar
  os detalhes de todos os itens.
* **Rate limiter inteligente**  Em vez de aguardar um tempo fixo após cada
  requisição, aguarda apenas o necessário para respeitar o intervalo mínimo
  entre chamadas. Assim aproveitamos o tempo gasto durante a própria requisição
  e evitamos esperas desnecessárias.

O restante do fluxo (limpeza do banco, agrupamento por SKU e escrita da planilha)
permanece compatível com a versão original.
"""

from __future__ import annotations

import json
import time
from collections.abc import Iterable, Iterator
from typing import Any, Dict, List

import gspread
import requests
from google.oauth2.service_account import Credentials

from auth import get_access_token
from db import get_connection, init_db


API_BASE = "https://api.mercadolibre.com"
PAGE_SIZE = 50
RATE_LIMIT = 0.34  # ~3 requisições/segundo
ITEMS_BATCH_SIZE = 20  # limite documentado para o endpoint /items?ids=


# ————————— Configuração da aba Google Sheets ——————————————————
CRED_FILE = r"C:\\Users\\André\\Desktop\\ApiMercadoLivre\\ads-meracdo-livre-49fa61b55da6.json"
SHEET_NAME = "Integração Andre"
WORKSHEET_SEM_CATALOGO = "SEM-CATALOGO"
WORKSHEET_PRODUTOS_ML = "PRODUTOS ML"
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]


class RateLimiter:
    """Garante intervalo mínimo entre requisições."""

    def __init__(self, min_interval: float) -> None:
        self.min_interval = min_interval
        self._last_call = 0.0

    def wait(self) -> None:
        now = time.perf_counter()
        elapsed = now - self._last_call
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self._last_call = time.perf_counter()


def batched(iterable: Iterable[Any], size: int) -> Iterator[List[Any]]:
    """Quebra um iterável em blocos com tamanho máximo ``size``."""

    batch: List[Any] = []
    for item in iterable:
        batch.append(item)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:
        yield batch


def extrair_sku(prod_data: Dict[str, Any]) -> str | None:
    # 1) tenta no nível do item
    sku = prod_data.get("seller_custom_field")
    if sku:
        return sku
    for attr in prod_data.get("attributes") or []:
        if attr.get("id") == "SELLER_SKU":
            # valor do SKU normalmente vem em value_name
            return attr.get("value_name") or attr.get("value_id")

    # 2) fallback: tenta no nível das variações
    for var in prod_data.get("variations") or []:
        # primeiro pelo atributo SELLER_SKU da variação
        for vattr in var.get("attributes") or []:
            if vattr.get("id") == "SELLER_SKU":
                return vattr.get("value_name") or vattr.get("value_id")
        # depois pelo seller_custom_field da variação
        v_sku = var.get("seller_custom_field")
        if v_sku:
            return v_sku

    return None


def get_my_user_id(session: requests.Session, headers: Dict[str, str], limiter: RateLimiter) -> int:
    limiter.wait()
    resp = session.get(f"{API_BASE}/users/me", headers=headers)
    resp.raise_for_status()
    return resp.json()["id"]


def fetch_all_item_ids(session: requests.Session, headers: Dict[str, str], limiter: RateLimiter, user_id: int) -> List[str]:
    print("🔄 Carregando IDs...")
    offset, all_ids = 0, []
    while True:
        limiter.wait()
        resp = session.get(
            f"{API_BASE}/users/{user_id}/items/search",
            headers=headers,
            params={"limit": PAGE_SIZE, "offset": offset},
        )
        resp.raise_for_status()
        batch = resp.json().get("results", [])
        if not batch:
            break
        all_ids.extend(batch)
        offset += PAGE_SIZE
    print(f"🔍 Total de IDs: {len(all_ids)}")
    return all_ids


def fetch_items_details(
    session: requests.Session,
    headers: Dict[str, str],
    limiter: RateLimiter,
    all_ids: List[str],
) -> Dict[str, Dict[str, Any]]:
    print("🔄 Buscando detalhes de cada item (requisições em lote)...")
    detalhes: Dict[str, Dict[str, Any]] = {}
    for batch_num, id_batch in enumerate(batched(all_ids, ITEMS_BATCH_SIZE), start=1):
        limiter.wait()
        resp = session.get(
            f"{API_BASE}/items",
            headers=headers,
            params={
                "ids": ",".join(id_batch),
                "include_attributes": "all",
            },
        )
        resp.raise_for_status()
        data = resp.json()
        for item in data:
            body = item.get("body") or {}
            item_id = body.get("id")
            if item_id:
                detalhes[item_id] = body
        print(f"  [lote {batch_num}] {len(id_batch)} itens carregados")
    return detalhes


def _get_spreadsheet() -> gspread.Spreadsheet:
    creds = Credentials.from_service_account_file(CRED_FILE, scopes=SCOPES)
    gc = gspread.authorize(creds)
    return gc.open(SHEET_NAME)


def _get_or_create_worksheet(spreadsheet: gspread.Spreadsheet, title: str, *, rows: int, cols: int) -> gspread.Worksheet:
    try:
        return spreadsheet.worksheet(title)
    except gspread.exceptions.WorksheetNotFound:
        return spreadsheet.add_worksheet(title=title, rows=rows, cols=cols)


def write_sem_catalogo(conn: Any, spreadsheet: gspread.Spreadsheet) -> None:
    """Seleciona apenas os registros cujo SKU aparece uma única vez."""

    cur = conn.cursor()
    cur.execute(
        """
      SELECT dados_json
      FROM produtos
      WHERE sku IN (
        SELECT sku
        FROM produtos
        GROUP BY sku
        HAVING COUNT(*) = 1
      )
      ORDER BY sku
    """
    )
    rows = cur.fetchall()

    header = ["Título", "Status"]
    output = [header]
    for (dados_json,) in rows:
        prod = json.loads(dados_json)
        status = "Ativo" if prod.get("status") == "active" else "Inativo"
        output.append([prod.get("title"), status])

    ws = _get_or_create_worksheet(
        spreadsheet,
        WORKSHEET_SEM_CATALOGO,
        rows=max(len(output) + 10, 100),
        cols=len(header),
    )
    ws.clear()
    ws.update("A1", output)
    print(f"[DONE] Aba '{WORKSHEET_SEM_CATALOGO}' atualizada com {len(output) - 1} produtos únicos.")


def write_produtos_ml(conn: Any, spreadsheet: gspread.Spreadsheet) -> None:
    """Exporta todos os produtos sincronizados para a aba 'PRODUTOS ML'."""

    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, sku, title, price, currency_id, category_id,
               sold_quantity, available_quantity, condition, thumbnail,
               permalink, dados_json
        FROM produtos
        ORDER BY sku
        """
    )
    rows = cur.fetchall()

    header = [
        "ID",
        "SKU",
        "Título",
        "Status",
        "Preço",
        "Moeda",
        "Qtd. Disponível",
        "Qtd. Vendida",
        "Categoria",
        "Condição",
        "Thumbnail",
        "Link",
    ]

    output = [header]
    for (
        prod_id,
        sku,
        title,
        price,
        currency_id,
        category_id,
        sold_quantity,
        available_quantity,
        condition,
        thumbnail,
        permalink,
        dados_json,
    ) in rows:
        status = ""
        parsed: Dict[str, Any] = {}
        if dados_json:
            try:
                parsed = json.loads(dados_json)
            except json.JSONDecodeError:
                parsed = {}
        if parsed:
            status = parsed.get("status", "")
            price = price if price is not None else parsed.get("price")
            currency_id = currency_id or parsed.get("currency_id")
            available_quantity = available_quantity if available_quantity is not None else parsed.get("available_quantity")
            sold_quantity = sold_quantity if sold_quantity is not None else parsed.get("sold_quantity")
            category_id = category_id or parsed.get("category_id")
            condition = condition or parsed.get("condition")
            permalink = permalink or parsed.get("permalink")
            thumbnail = thumbnail or parsed.get("thumbnail")
            if not sku:
                sku = extrair_sku(parsed)
        output.append(
            [
                prod_id,
                sku or "",
                title or "",
                status,
                price if price is not None else "",
                currency_id or "",
                available_quantity if available_quantity is not None else "",
                sold_quantity if sold_quantity is not None else "",
                category_id or "",
                condition or "",
                thumbnail or "",
                permalink or "",
            ]
        )

    ws = _get_or_create_worksheet(
        spreadsheet,
        WORKSHEET_PRODUTOS_ML,
        rows=max(len(output) + 10, 100),
        cols=len(header),
    )
    ws.batch_clear(["A:L"])
    ws.update("A1", output)
    print(f"[DONE] Aba '{WORKSHEET_PRODUTOS_ML}' atualizada com {len(output) - 1} produtos.")


def main() -> None:
    # 1) inicializa e limpa o banco
    init_db()
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM produtos;")
    cur.execute("DELETE FROM taxas;")
    conn.commit()
    print("🧹 Banco limpo.")

    # 2) configura sessão, token e rate limiter
    token = get_access_token()
    session = requests.Session()
    headers = {"Authorization": f"Bearer {token}"}
    limiter = RateLimiter(RATE_LIMIT)

    # 3) obtém user_id
    user_id = get_my_user_id(session, headers, limiter)
    print(f"✅ Autenticado como usuário: {user_id}")

    # 4) carrega todos os IDs
    all_ids = fetch_all_item_ids(session, headers, limiter, user_id)

    # 5) busca detalhes em lotes (com atributos completos)
    detalhes = fetch_items_details(session, headers, limiter, all_ids)

    # 6) agrupa por SKU ou título
    print("🧠 Agrupando...")
    grupos: Dict[str, List[str]] = {}
    for item_id, data in detalhes.items():
        chave = extrair_sku(data) or data.get("title")
        if not chave:
            continue
        grupos.setdefault(chave, []).append(item_id)

    # 7) insere/atualiza produtos e taxas
    print("💾 Inserindo no banco...")
    total = 0
    for chave, ids in grupos.items():
        escolhido = next((i for i in ids if detalhes[i].get("inventory_id")), ids[0])
        prod = detalhes[escolhido]
        cur.execute(
            """
            INSERT INTO produtos (
                id, sku, title, price, currency_id, category_id,
                sold_quantity, available_quantity, condition, thumbnail,
                permalink, dados_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                sku=excluded.sku,
                title=excluded.title,
                price=excluded.price,
                sold_quantity=excluded.sold_quantity,
                available_quantity=excluded.available_quantity,
                dados_json=excluded.dados_json;
        """,
            (
                prod["id"],
                extrair_sku(prod),
                prod.get("title"),
                prod.get("price"),
                prod.get("currency_id"),
                prod.get("category_id"),
                prod.get("sold_quantity"),
                prod.get("available_quantity"),
                prod.get("condition"),
                prod.get("thumbnail"),
                prod.get("permalink"),
                json.dumps(prod, ensure_ascii=False),
            ),
        )

        limiter.wait()
        fees_resp = session.get(f"{API_BASE}/items/{escolhido}/fees", headers=headers)
        if fees_resp.ok:
            for fee in fees_resp.json().get("fees", []):
                cur.execute(
                    """
                    INSERT INTO taxas (item_id, tipo, amount, dados_json)
                    VALUES (?, ?, ?, ?)
                """,
                    (
                        escolhido,
                        fee.get("type"),
                        fee.get("amount"),
                        json.dumps(fee, ensure_ascii=False),
                    ),
                )
        total += 1

    conn.commit()
    print(f"\n✅ Sincronizado: {total} produtos únicos salvos.")

    spreadsheet = _get_spreadsheet()

    # 8) atualiza a aba de produtos completa
    write_produtos_ml(conn, spreadsheet)

    # 9) atualiza os nomes e status dos produtos não repetidos na aba SEM-CATALOGO
    write_sem_catalogo(conn, spreadsheet)

    conn.close()


if __name__ == "__main__":
    main()