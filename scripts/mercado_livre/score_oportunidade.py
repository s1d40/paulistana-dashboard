import re
import pandas as pd
import numpy as np

# =========================
# Helpers de parsing BR
# =========================
def parse_brl(x):
    """Converte 'R$ 186.000,00' -> 186000.0"""
    if pd.isna(x):
        return np.nan
    s = str(x).strip()
    s = s.replace("R$", "").replace("\xa0", " ").strip()
    s = s.replace(".", "").replace(",", ".")
    s = re.sub(r"[^0-9\.\-]", "", s)
    return float(s) if s else np.nan

def parse_int(x):
    """Converte texto numérico em int (ex: '7.100' ou '7100')"""
    if pd.isna(x):
        return np.nan
    s = str(x).strip()
    s = s.replace(".", "").replace(",", "")
    s = re.sub(r"[^\d\-]", "", s)
    return int(s) if s else np.nan

def yn(x):
    """Converte Sim/Não em boolean"""
    if pd.isna(x):
        return False
    s = str(x).strip().lower()
    return s in ["sim", "s", "true", "1", "yes", "y"]

def log1p_safe(x):
    return np.log1p(np.maximum(x, 0))

def norm_percentile(series, low_q=0.10, high_q=0.90):
    """Normaliza para 0..1 usando quantis (robusto a outliers)."""
    s = series.astype(float).copy()
    if not np.isfinite(s).any():
        return pd.Series(np.zeros(len(s)), index=series.index)

    lo = np.nanquantile(s, low_q)
    hi = np.nanquantile(s, high_q)
    if hi - lo < 1e-9:
        return pd.Series(np.zeros(len(s)), index=series.index)
    return ((s - lo) / (hi - lo)).clip(0, 1)

# =========================
# Scoring
# =========================
def score_row(r):
    """
    Nota final 0..10:
    - Base (demanda) 0..8.5
    - Bônus não estar no FULL +1.8 (forte)
    - Penalidade catálogo -0.6 (mais competição)
    - Bônus maturidade +0.4 (>=180 dias)
    - Bônus não ter FLEX +0.2 (alavanca)
    - Exposição premium +0.2 (se aparecer no texto)
    """
    demand = (
        0.40 * r["n_vendas_hist"] +
        0.25 * r["n_vendas_periodo"] +
        0.25 * r["n_unid_hist"] +
        0.10 * r["n_unid_periodo"]
    )  # 0..1

    bonus_not_full = 1.8 if (not r["is_full"]) else 0.0
    penalty_catalog = -0.6 if r["is_catalogo"] else 0.0

    days = r["dias_pub"] if np.isfinite(r["dias_pub"]) else 0
    bonus_maturidade = 0.4 if days >= 180 else 0.0

    bonus_not_flex = 0.2 if (not r["is_flex"]) else 0.0

    expo = str(r.get("exposicao", "")).strip().lower()
    bonus_expo = 0.2 if "premium" in expo else 0.0

    base_points = 8.5 * demand
    score = base_points + bonus_not_full + penalty_catalog + bonus_maturidade + bonus_not_flex + bonus_expo
    score = float(np.clip(score, 0, 10))
    return score

def calcular_notas(arquivo_entrada, aba=None, arquivo_saida="oportunidades_scored.xlsx"):
    """
    Lê Excel, calcula nota e salva novo Excel com a coluna 'Nota_Oportunidade_0a10'
    - Se aba=None: lê todas as abas (dict) e pega a primeira automaticamente.
    - Se aba='NomeDaAba': lê só aquela aba.
    """

    # ---- Lê a planilha
    obj = pd.read_excel(arquivo_entrada, sheet_name=aba)

    # Se veio dict (quando sheet_name=None), pega a primeira aba
    if isinstance(obj, dict):
        primeira_aba = next(iter(obj.keys()))
        df = obj[primeira_aba]
        print(f"[INFO] aba=None => Lendo a primeira aba automaticamente: {primeira_aba}")
    else:
        df = obj
        print("[INFO] Lendo uma aba específica (ou padrão).")

    # ---- Ajuste de nomes de coluna (altere aqui se o seu Excel tiver nomes diferentes)
    colmap = {
        "Vendas em históricas": "vendas_hist",
        "Vendas em $": "vendas_periodo",
        "Unidades vendidas históricas": "unid_hist",
        "Unidades vendidas": "unid_periodo",
        "Dias publicados": "dias_pub",
        "Exposição": "exposicao",
        "Catálogo": "catalogo",
        "FLEX": "flex",
        "FULL": "full",
        "Título": "titulo",
        "Categoria final": "categoria",
        "Último preço": "preco",
    }

    df = df.rename(columns={k: v for k, v in colmap.items() if k in df.columns})

    # ---- Debug: mostra colunas encontradas
    print("[INFO] Colunas detectadas:", list(df.columns))

    # ---- Converte para números
    df["vendas_hist_num"] = df["vendas_hist"].apply(parse_brl) if "vendas_hist" in df else 0
    df["vendas_periodo_num"] = df["vendas_periodo"].apply(parse_brl) if "vendas_periodo" in df else 0
    df["unid_hist_num"] = df["unid_hist"].apply(parse_int) if "unid_hist" in df else 0
    df["unid_periodo_num"] = df["unid_periodo"].apply(parse_int) if "unid_periodo" in df else 0
    df["dias_pub"] = df["dias_pub"].apply(parse_int) if "dias_pub" in df else 0

    # ---- Flags
    df["is_full"] = df["full"].apply(yn) if "full" in df else False
    df["is_flex"] = df["flex"].apply(yn) if "flex" in df else False
    df["is_catalogo"] = df["catalogo"].apply(yn) if "catalogo" in df else False

    # ---- Log para reduzir distorção
    df["lh_vendas_hist"] = log1p_safe(pd.to_numeric(df["vendas_hist_num"], errors="coerce").fillna(0))
    df["lh_vendas_periodo"] = log1p_safe(pd.to_numeric(df["vendas_periodo_num"], errors="coerce").fillna(0))
    df["lh_unid_hist"] = log1p_safe(pd.to_numeric(df["unid_hist_num"], errors="coerce").fillna(0))
    df["lh_unid_periodo"] = log1p_safe(pd.to_numeric(df["unid_periodo_num"], errors="coerce").fillna(0))

    # ---- Normalização 0..1
    df["n_vendas_hist"] = norm_percentile(df["lh_vendas_hist"])
    df["n_vendas_periodo"] = norm_percentile(df["lh_vendas_periodo"])
    df["n_unid_hist"] = norm_percentile(df["lh_unid_hist"])
    df["n_unid_periodo"] = norm_percentile(df["lh_unid_periodo"])

    # ---- Nota final (vai virar a ÚLTIMA coluna)
    df["Nota_Oportunidade_0a10"] = df.apply(score_row, axis=1).round(2)

    # ---- Opcional: ordenar do maior para o menor score
    df = df.sort_values("Nota_Oportunidade_0a10", ascending=False)

    # ---- Salva
    df.to_excel(arquivo_saida, index=False)
    print(f"[OK] Arquivo gerado: {arquivo_saida}")

# =========================
# Execução
# =========================
if __name__ == "__main__":
    arquivo = r"C:\Users\André\Desktop\analise\chá.xlsx"

    # Se quiser fixar uma aba específica, coloque o nome exato:
    # aba = "Planilha1"
    aba = None  # deixa None para pegar a primeira aba automaticamente

    saida = r"C:\Users\André\Desktop\oportunidades_scored.xlsx"

    calcular_notas(arquivo, aba=aba, arquivo_saida=saida)
