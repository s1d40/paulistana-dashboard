import json
import sqlite3
from typing import Dict, List, Tuple

import gspread
from google.oauth2.service_account import Credentials

# —————————————— CONFIGURAÇÃO ——————————————
DB_PATH = r"C:\\Users\\André\\Desktop\\ApiMercadoLivre\\bling_produtos.db"
CRED_FILE = r"C:\\Users\\André\\Desktop\\ApiMercadoLivre\\ads-meracdo-livre-49fa61b55da6.json"
SPREADSHEET_ID = "1fLAuu19QRGzU8-LGjIIDNYmMNhICYYCisvowZHQ_m10"
WORKSHEET_SIMPLES = "PEDIDOS"
WORKSHEET_COMPOSTOS = "PRODUTOS FRACIONADOS"

SCOPES: List[str] = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

START_ROW = 5
CLEAR_END_ROW = 800
END_COLUMN = "K"


def main() -> None:
    """Exporta produtos simples e compostos da base SQLite para a planilha."""
    creds = Credentials.from_service_account_file(CRED_FILE, scopes=SCOPES)
    gc = gspread.authorize(creds)
    sh = gc.open_by_key(SPREADSHEET_ID)

    print("Abas disponíveis:")
    for worksheet in sh.worksheets():
        print("  •", worksheet.title)

    ws_simples = _get_or_raise_worksheet(sh, WORKSHEET_SIMPLES)
    ws_compostos = _get_or_raise_worksheet(sh, WORKSHEET_COMPOSTOS)

    _clear_range(ws_simples)
    _clear_range(ws_compostos)

    produtos = _carregar_produtos()

    valores_simples: List[List[object]] = []
    valores_compostos: List[List[object]] = []

    for dados_json, indicador in produtos:
        try:
            produto = json.loads(dados_json)
        except json.JSONDecodeError:
            continue

        flag = _determinar_composicao(produto, indicador)
        linha = _montar_linha(produto)

        if flag == "N":
            valores_simples.append(linha)
        elif flag == "S":
            valores_compostos.append(linha)

    _gravar_valores(ws_simples, valores_simples, "produtos simples")
    _gravar_valores(ws_compostos, valores_compostos, "produtos com composição")


def _get_or_raise_worksheet(sh: gspread.Spreadsheet, title: str) -> gspread.Worksheet:
    try:
        return sh.worksheet(title)
    except gspread.WorksheetNotFound as exc:  # pragma: no cover - feedback útil
        raise RuntimeError(f"Aba '{title}' não encontrada na planilha.") from exc


def _clear_range(ws: gspread.Worksheet) -> None:
    ws.batch_clear([f"A{START_ROW}:{END_COLUMN}{CLEAR_END_ROW}"])
    print(f"Intervalo A{START_ROW}:{END_COLUMN}{CLEAR_END_ROW} da aba '{ws.title}' limpo.")


def _carregar_produtos() -> List[Tuple[str, object]]:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tabelas = [row[0] for row in cur.fetchall()]

    target_table = None
    target_columns: List[str] = []
    for tbl in tabelas:
        cur.execute(f'PRAGMA table_info("{tbl}");')
        cols = [col[1] for col in cur.fetchall()]
        if "dados_json" in cols:
            target_table = tbl
            target_columns = cols
            break

    if not target_table:
        conn.close()
        raise RuntimeError("Nenhuma tabela com coluna 'dados_json' encontrada em " + DB_PATH)

    if not target_columns:
        conn.close()
        raise RuntimeError(f"Não foi possível determinar as colunas da tabela '{target_table}'.")

    last_column_name = target_columns[-1]

    if last_column_name == "dados_json":
        conn.close()
        raise RuntimeError(
            "A última coluna da tabela é 'dados_json'; não foi possível identificar a coluna de tipo."
        )

    print(f"Usando tabela '{target_table}' e filtrando pela coluna '{last_column_name}'.")

    cur.execute(
        f'SELECT dados_json, "{last_column_name}" FROM "{target_table}";'
    )
    rows = cur.fetchall()
    conn.close()
    return rows


def _montar_linha(prod: Dict[str, object]) -> List[object]:
    nome = prod.get("nome", prod.get("descricao", ""))

    estoque_raw = prod.get("estoque", "")
    if isinstance(estoque_raw, dict):
        estoque = estoque_raw.get("saldoVirtualTotal", estoque_raw.get("saldo", ""))
    else:
        estoque = estoque_raw

    return [
        prod.get("id", ""),
        prod.get("codigo", ""),
        nome,
        prod.get("situacao", ""),
        prod.get("unidade", ""),
        prod.get("preco", ""),
        prod.get("precoCusto", prod.get("preco_custo", "")),
        (prod.get("categoria", {}) or {}).get("nome", ""),
        estoque,
        (prod.get("fornecedor", {}) or {}).get("nome", ""),
        prod.get("observacoes", ""),
    ]


def _gravar_valores(ws: gspread.Worksheet, valores: List[List[object]], descricao: str) -> None:
    if not valores:
        print(f"Nenhum {descricao} encontrado na aba '{ws.title}'.")
        return

    end_row = START_ROW + len(valores) - 1
    range_str = f"A{START_ROW}:{END_COLUMN}{end_row}"
    ws.update(range_name=range_str, values=valores)
    print(f"{len(valores)} linhas de {descricao} escritas em {range_str}.")


def _normalizar_flag(valor: object) -> str | None:
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


def _avaliar_dados_de_composicao(produto: Dict[str, object]) -> str | None:
    direto_produto = _normalizar_flag(produto.get("possuiComposicao"))
    if direto_produto:
        return direto_produto

    estrutura = produto.get("estrutura")
    if isinstance(estrutura, dict):
        tipo_estrutura = estrutura.get("tipo")
        if isinstance(tipo_estrutura, str):
            tipo_norm = tipo_estrutura.strip().upper()
            if tipo_norm == "PS":
                return "N"
            if tipo_norm == "PC":
                return "S"
        direto = _normalizar_flag(estrutura.get("possuiComposicao"))
        if direto:
            return direto
        indireto = _normalizar_flag(estrutura.get("possui_composicao"))
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


def _determinar_composicao(produto: Dict[str, object], indicador: object) -> str:
    flag = _normalizar_flag(indicador)
    if flag:
        return flag

    inferido = _avaliar_dados_de_composicao(produto)
    if inferido:
        return inferido

    return "S"


if __name__ == "__main__":
    main()