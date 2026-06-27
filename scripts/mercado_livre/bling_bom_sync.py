# -*- coding: utf-8 -*-
"""
Coleta estruturas (composição/kit) de produtos no Bling (API v3), gravando em LOTE.
- Reutiliza tokens do SQLite (bling_tokens.db) como no seu script de pedidos
- Considera apenas PRODUTOS ATIVOS
- Descobre produtos com composição e busca suas estruturas
- Cria também uma terceira tabela com PRODUTOS ATIVOS SEM COMPOSIÇÃO
- Apaga e recria (ou zera tabelas) do banco bling_bom.db a cada execução
- Escreve em BULK (uma transação única) usando executemany

Tabelas:
    estrutura(
        produto_pai_id, produto_pai_codigo, produto_pai_nome,
        lancamento_estoque, tipo_estoque, dados_json, updated_at
    )
    estrutura_componentes(
        produto_pai_id, componente_produto_id, componente_codigo, componente_nome, quantidade
    )
    produtos_sem_estrutura(
        produto_id, codigo, nome, situacao, formato, dados_json, updated_at
    )
"""

import os
import json
import time
import base64
import sqlite3
import requests
from datetime import datetime

from supabase_client import supabase

# ---------------------------------------------------------
# Config
# ---------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TOKENS_DB_PATH   = os.path.join(BASE_DIR, "bling_tokens.db")   # já existe no seu projeto
BOM_DB_PATH      = os.path.join(BASE_DIR, "bling_bom.db")      # será recriado/zerado a cada execução

CLIENT_ID        = "18197aab08ad11ae5291f07f55d2ae5c55997256"
CLIENT_SECRET    = "d02ef2ec089b639a98778dbb476afa92c8b4aa906546c717f2c85c533164"

BASE_API         = "https://www.bling.com.br/Api/v3"
TOKEN_URL        = f"{BASE_API}/oauth/token"
API_PRODUTOS     = f"{BASE_API}/produtos"
PAGE_LIMIT       = 100
RATE_LIMIT_S     = 0.35  # ~3 req/s

session = requests.Session()

# Estado de token (carregado do SQLite)
CODE = None
ACCESS_TOKEN = None
REFRESH_TOKEN = None

# Cache de códigos para reduzir chamadas extras
CODIGO_CACHE = {}  # {id_produto: (codigo, nome)}


# ---------------------------------------------------------
# Tokens (reuso do seu padrão em SQLite)
# ---------------------------------------------------------
def carregar_tokens():
    global CODE, ACCESS_TOKEN, REFRESH_TOKEN
    print("🔄 Carregando tokens do banco bling_tokens.db...")
    with sqlite3.connect(TOKENS_DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tokens (
                id INTEGER PRIMARY KEY,
                code TEXT,
                access_token TEXT,
                refresh_token TEXT
            )
        """)
        row = conn.execute("SELECT code, access_token, refresh_token FROM tokens LIMIT 1").fetchone()
    if row:
        CODE, ACCESS_TOKEN, REFRESH_TOKEN = row
        print("✅ Tokens carregados da base.")
    else:
        print("⚠️  Nenhum token encontrado na base (tokens).")


def salvar_tokens(code, access_token, refresh_token):
    print("💾 Salvando novos tokens no banco bling_tokens.db...")
    with sqlite3.connect(TOKENS_DB_PATH) as conn:
        conn.execute("DELETE FROM tokens")
        conn.execute(
            "INSERT INTO tokens (code, access_token, refresh_token) VALUES (?, ?, ?)",
            (code, access_token, refresh_token)
        )
    print("✅ Tokens salvos com sucesso.")


def refresh_access_token():
    """Renova o access_token usando o refresh_token do SQLite (mesma lógica do seu script)."""
    global ACCESS_TOKEN, REFRESH_TOKEN
    if not REFRESH_TOKEN:
        print("❌ Refresh token ausente. Autorize o app novamente.")
        return False

    print("🔐 Renovando access_token via refresh_token...")
    auth_b64 = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    resp = session.post(
        TOKEN_URL,
        headers={
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data={"grant_type": "refresh_token", "refresh_token": REFRESH_TOKEN},
        timeout=60
    )
    if resp.ok:
        tk = resp.json()
        ACCESS_TOKEN  = tk.get("access_token")
        REFRESH_TOKEN = tk.get("refresh_token", REFRESH_TOKEN)
        salvar_tokens(CODE, ACCESS_TOKEN, REFRESH_TOKEN)
        print("✅ Token renovado com sucesso.")
        return True

    print("❌ Falha ao renovar token:", resp.status_code, resp.text)
    return False


def get_access_token():
    carregar_tokens()
    if not ACCESS_TOKEN:
        raise RuntimeError("Token não carregado – rode o seu fluxo de autorização para gravar no bling_tokens.db.")
    if not refresh_access_token():
        raise RuntimeError("Não foi possível renovar o token. Rode o seu fluxo de autorização novamente.")
    print("🔐 Token OK.")
    return ACCESS_TOKEN


def auth_headers():
    return {"Authorization": f"Bearer {ACCESS_TOKEN}"}


# ---------------------------------------------------------
# Banco de destino (apaga e recria / zera tabelas)
# ---------------------------------------------------------
def recriar_banco():
    print("\n==============================")
    print("🧱 ETAPA 1: Usando banco Supabase em Nuvem")
    print("==============================")
    print("✅ Tabelas já prontas no Supabase.")


# ---------------------------------------------------------
# Utilidades de produto
# ---------------------------------------------------------
def get_produto_by_id(produto_id):
    """Retorna dict do produto (GET /produtos/{id})"""
    print(f"   🔍 Buscando detalhes do produto ID={produto_id} (GET /produtos/{{id}})...")
    url = f"{API_PRODUTOS}/{produto_id}"
    r = session.get(url, headers=auth_headers(), timeout=60)
    if r.status_code == 404:
        print(f"   ⚠️  Produto ID={produto_id} não encontrado (404).")
        return None
    r.raise_for_status()
    return r.json().get("data")


def get_codigo_nome_produto(produto_id):
    """Devolve (codigo, nome) com cache"""
    if produto_id in CODIGO_CACHE:
        return CODIGO_CACHE[produto_id]

    p = get_produto_by_id(produto_id)
    time.sleep(RATE_LIMIT_S)
    if not p:
        CODIGO_CACHE[produto_id] = (None, None)
        return (None, None)

    codigo = p.get("codigo")
    nome   = p.get("nome")
    CODIGO_CACHE[produto_id] = (codigo, nome)
    return (codigo, nome)


# ---------------------------------------------------------
# Listagens
# ---------------------------------------------------------
def listar_produtos_com_composicao_ativos():
    """
    1) Tenta usar ?tipo=E&situacao=A (Composições ativas) em /produtos.
    2) Se falhar ou vier vazio, busca tudo e filtra por:
       - situacao in ('A','Ativo')
       - formato in ('E','M')   # E=estrutura (kit), M=matriz/misto (mantido como no seu código)
    """
    print("\n==============================")
    print("📦 ETAPA 2: Listando produtos com composição ATIVOS")
    print("==============================")

    produtos = []

    # 1) Tentativa com ?tipo=E&situacao=A
    pagina = 1
    total  = 0
    usou_tipo = True
    while True:
        params = {"pagina": pagina, "limit": PAGE_LIMIT, "tipo": "E", "situacao": "A"}
        print(f"   🔄 (tipo=E, situacao=A) Página {pagina}...")
        r = session.get(API_PRODUTOS, headers=auth_headers(), params=params, timeout=60)
        if not r.ok:
            # Falhou? Vamos para o plano B (sem filtro server-side)
            print(f"   ⚠️  Erro ao listar com tipo=E (página {pagina}): {r.status_code} {r.text}")
            usou_tipo = False
            break

        data = r.json().get("data", [])
        if not data:
            print("   ℹ️  Sem mais registros para tipo=E.")
            break

        data = [p for p in data if str(p.get("situacao","")).upper() in ("A","ATIVO")]
        produtos.extend(data)
        total += len(data)
        print(f"   📄 Página {pagina}: {len(data)} composições ativas (acumulado={total})")
        pagina += 1
        time.sleep(RATE_LIMIT_S)

    if usou_tipo and produtos:
        print(f"✅ Total de produtos com composição (via tipo=E): {len(produtos)}")
        return produtos

    # 2) Plano B
    print("\nℹ️  Plano B: varrendo TODOS os produtos e filtrando por ATIVOS e formato 'E' (composição) ou 'M' (misto).")
    pagina = 1
    total_filtrados = 0
    while True:
        params = {"pagina": pagina, "limit": PAGE_LIMIT}
        print(f"   🔄 (ALL) Página {pagina}...")
        r = session.get(API_PRODUTOS, headers=auth_headers(), params=params, timeout=60)
        if not r.ok:
            print(f"   ❌ Erro ao listar produtos (página {pagina}): {r.status_code} {r.text}")
            break
        data = r.json().get("data", [])
        if not data:
            print("   ℹ️  Sem mais registros (ALL).")
            break

        comp_ativos = [
            p for p in data
            if str(p.get("situacao","")).upper() in ("A","ATIVO")
            and str(p.get("formato","")).upper() in ("E","M")
        ]
        produtos.extend(comp_ativos)
        total_filtrados += len(comp_ativos)
        print(f"   📄 Página {pagina}: {len(data)} produtos | composições ativas filtradas: {len(comp_ativos)} (acumulado={total_filtrados})")
        pagina += 1
        time.sleep(RATE_LIMIT_S)

    print(f"✅ Total de produtos com composição (Plano B): {len(produtos)}")
    return produtos


def listar_produtos_ativos():
    """Lista TODOS os produtos ativos (situacao=A) para gerar a tabela de 'sem composição'."""
    print("\n==============================")
    print("📦 ETAPA 3: Listando TODOS os produtos ATIVOS")
    print("==============================")

    ativos = []
    pagina = 1
    usou_filtro = True
    total = 0
    while True:
        params = {"pagina": pagina, "limit": PAGE_LIMIT, "situacao": "A"}
        print(f"   🔄 (situacao=A) Página {pagina}...")
        r = session.get(API_PRODUTOS, headers=auth_headers(), params=params, timeout=60)
        if not r.ok:
            print(f"   ⚠️  Erro ao listar com situacao=A (página {pagina}): {r.status_code} {r.text}")
            usou_filtro = False
            break
        data = r.json().get("data", [])
        if not data:
            print("   ℹ️  Sem mais registros (situacao=A).")
            break
        data = [p for p in data if str(p.get("situacao","")).upper() in ("A","ATIVO")]
        ativos.extend(data)
        total += len(data)
        print(f"   📄 Página {pagina}: {len(data)} ativos (acumulado={total})")
        pagina += 1
        time.sleep(RATE_LIMIT_S)

    if usou_filtro and ativos:
        print(f"✅ Total de produtos ATIVOS (server-side): {len(ativos)}")
        return ativos

    # Fallback: sem filtro server-side
    print("\nℹ️  Plano B (ativos): varrendo todos e filtrando por situacao=A/Ativo.")
    pagina = 1
    total = 0
    while True:
        params = {"pagina": pagina, "limit": PAGE_LIMIT}
        print(f"   🔄 (ALL) Página {pagina}...")
        r = session.get(API_PRODUTOS, headers=auth_headers(), params=params, timeout=60)
        if not r.ok:
            print(f"   ❌ Erro ao listar (ativos) página {pagina}: {r.status_code} {r.text}")
            break
        data = r.json().get("data", [])
        if not data:
            print("   ℹ️  Sem mais registros (ALL).")
            break
        data_ativos = [p for p in data if str(p.get("situacao","")).upper() in ("A","ATIVO")]
        ativos.extend(data_ativos)
        total += len(data_ativos)
        print(f"   📄 Página {pagina}: {len(data)} produtos | ativos filtrados: {len(data_ativos)} (acumulado={total})")
        pagina += 1
        time.sleep(RATE_LIMIT_S)

    print(f"✅ Total de produtos ATIVOS (Plano B): {len(ativos)}")
    return ativos


# ---------------------------------------------------------
# Estrutura por produto
# ---------------------------------------------------------
def obter_estrutura_produto(produto_id):
    """
    Tenta:
      1) GET /produtos/estruturas/{idProduto}
      2) fallback: GET /produtos/{idProduto}/estruturas
    Retorna dict com chaves: lancamentoEstoque, tipoEstoque, componentes (lista)
    """
    # Tentativa 1
    url1 = f"{BASE_API}/produtos/estruturas/{produto_id}"
    print(f"      → Tentando /produtos/estruturas/{produto_id} ...")
    r1 = session.get(url1, headers=auth_headers(), timeout=60)
    if r1.ok:
        print("        ✔ Estrutura encontrada pela rota 1")
        return r1.json().get("data")
    if r1.status_code not in (404, 400):
        print(f"        ⚠️  Resposta inesperada rota 1: {r1.status_code}")
        r1.raise_for_status()

    # Tentativa 2 (fallback) – **AQUI corrigimos a URL, removendo '}' extra**
    url2 = f"{API_PRODUTOS}/{produto_id}/estruturas"
    print(f"      → Tentando /produtos/{{id}}/estruturas para ID={produto_id} ...")
    r2 = session.get(url2, headers=auth_headers(), timeout=60)
    if r2.ok:
        print("        ✔ Estrutura encontrada pela rota 2")
        return r2.json().get("data")
    if r2.status_code == 404:
        # Sem estrutura cadastrada
        print("        ⚠️  Produto sem estrutura cadastrada (404).")
        return None
    print(f"        ⚠️  Resposta inesperada rota 2: {r2.status_code}")
    r2.raise_for_status()
    return None


# ---------------------------------------------------------
# Preparação das linhas (sem gravar ainda)
# ---------------------------------------------------------
def preparar_linhas(produto_pai, estrutura):
    """
    Recebe dicts do produto e da estrutura e devolve:
      - uma tupla para a tabela 'estrutura'
      - uma lista de tuplas para 'estrutura_componentes'
    """
    pai_id    = produto_pai.get("id")
    pai_codigo, pai_nome = produto_pai.get("codigo"), produto_pai.get("nome")

    lanc = estrutura.get("lancamentoEstoque") or estrutura.get("estrutura_lancamentoestoque")
    tipo = estrutura.get("tipoEstoque") or estrutura.get("estrutura_tipoestoque")

    row_estrutura = (
        pai_id, pai_codigo, pai_nome,
        lanc, tipo, json.dumps(estrutura, ensure_ascii=False),
        datetime.utcnow().isoformat()
    )

    comp_rows = []
    componentes = estrutura.get("componentes") or estrutura.get("itens") or []
    for comp in componentes:
        comp_prod = comp.get("produto") or {}
        comp_id   = comp_prod.get("id") or comp.get("produtoId") or comp.get("idProduto") or comp.get("id")
        qtd = (
            comp.get("quantidade") or
            comp.get("qtd") or
            comp.get("quant") or
            1
        )
        comp_codigo = None
        comp_nome   = None
        if isinstance(comp_prod, dict):
            comp_codigo = comp_prod.get("codigo") or comp_prod.get("sku")
            comp_nome   = comp_prod.get("nome")

        # Se faltar código/nome, tenta buscar pelo ID
        if comp_id and (comp_codigo is None or comp_nome is None):
            print(f"      🔎 Buscando código/nome do componente ID={comp_id} (cache ou API)...")
            c_cod, c_nome = get_codigo_nome_produto(comp_id)
            comp_codigo = comp_codigo or c_cod
            comp_nome   = comp_nome   or c_nome
            time.sleep(RATE_LIMIT_S)

        comp_rows.append((
            pai_id, comp_id, comp_codigo, comp_nome, float(qtd)
        ))

    return row_estrutura, comp_rows


def preparar_linha_sem_estrutura(produto):
    """Tuple para a tabela 'produtos_sem_estrutura'."""
    return (
        produto.get("id"),
        produto.get("codigo"),
        produto.get("nome"),
        produto.get("situacao"),
        produto.get("formato"),
        json.dumps(produto, ensure_ascii=False),
        datetime.utcnow().isoformat()
    )


# ---------------------------------------------------------
# Gravação em BULK (uma transação)
# ---------------------------------------------------------
def gravar_em_lote(linhas_estrutura, linhas_componentes, linhas_sem_estrutura):
    print("\n==============================")
    print("💾 ETAPA 6: Gravando em LOTE no Supabase")
    print("==============================")
    print(f"   → Linhas estrutura:             {len(linhas_estrutura)}")
    print(f"   → Linhas estrutura_componentes: {len(linhas_componentes)}")
    print(f"   → Linhas produtos_sem_estrutura:{len(linhas_sem_estrutura)}")

    if linhas_estrutura:
        print("   📝 Inserindo/atualizando tabela 'bling_estrutura'...")
        payload_est = [{"produto_pai_id": r[0], "produto_pai_codigo": r[1], "produto_pai_nome": r[2], "lancamento_estoque": r[3], "tipo_estoque": r[4], "dados_json": json.loads(r[5]), "updated_at": r[6]} for r in linhas_estrutura]
        supabase.table("bling_estrutura").upsert(payload_est).execute()

    if linhas_componentes:
        print("   📝 Inserindo/atualizando tabela 'bling_estrutura_componentes'...")
        payload_comp = [{"produto_pai_id": r[0], "componente_produto_id": r[1], "componente_codigo": r[2], "componente_nome": r[3], "quantidade": r[4]} for r in linhas_componentes]
        supabase.table("bling_estrutura_componentes").upsert(payload_comp).execute()

    if linhas_sem_estrutura:
        print("   📝 Inserindo/atualizando tabela 'bling_produtos_sem_estrutura'...")
        payload_sem = [{"produto_id": r[0], "codigo": r[1], "nome": r[2], "situacao": r[3], "formato": r[4], "dados_json": json.loads(r[5]), "updated_at": r[6]} for r in linhas_sem_estrutura]
        supabase.table("bling_produtos_sem_estrutura").upsert(payload_sem).execute()

    print("✅ Gravação em lote concluída.")


# ---------------------------------------------------------
# Main
# ---------------------------------------------------------
def main():
    print("======================================")
    print("🚀 INICIANDO COLETA DE ESTRUTURAS BLING")
    print("======================================\n")

    # 1) Token
    get_access_token()  # renova e carrega globais

    # 2) Banco (apaga e recria/zera)
    recriar_banco()

    # 3) Listas base
    produtos_ativos = listar_produtos_ativos()
    produtos_comp   = listar_produtos_com_composicao_ativos()
    print("\n==============================")
    print("📊 RESUMO DAS LISTAGENS")
    print("==============================")
    print(f"🧾 Produtos ATIVOS:                 {len(produtos_ativos)}")
    print(f"🧾 Produtos com composição ATIVOS:  {len(produtos_comp)}")

    # 4) Para cada produto com composição, obter estrutura e preparar linhas
    print("\n==============================")
    print("🏗️  ETAPA 4: Processando estruturas de produtos com composição")
    print("==============================")

    linhas_estrutura = []
    linhas_componentes = []
    salvos = 0
    sem_estrutura_encontrada = 0

    total_comp = len(produtos_comp) if produtos_comp else 0

    for idx, p in enumerate(produtos_comp, start=1):
        pid = p.get("id")
        pcod = p.get("codigo")
        progresso = (idx / total_comp * 100) if total_comp else 0
        print(f"\n🔎 [{idx}/{total_comp}] ({progresso:5.1f}%) Estrutura do produto ID={pid} (código={pcod}) ...")

        est = obter_estrutura_produto(pid)
        time.sleep(RATE_LIMIT_S)

        if not est:
            print("   ↳ ⚠️  Sem estrutura (ou não encontrada).")
            sem_estrutura_encontrada += 1
            continue

        row_est, rows_comp = preparar_linhas(p, est)
        linhas_estrutura.append(row_est)
        linhas_componentes.extend(rows_comp)
        salvos += 1
        print(f"   ↳ ✔ Estrutura preparada para bulk (componentes: {len(rows_comp)})")

    # 5) Preparar a terceira tabela: ATIVOS sem composição
    print("\n==============================")
    print("🧩 ETAPA 5: Identificando produtos ATIVOS sem composição")
    print("==============================")
    ids_composicao = {p.get("id") for p in produtos_comp}
    ativos_sem_comp = [p for p in produtos_ativos if p.get("id") not in ids_composicao]
    print(f"   → Produtos ATIVOS sem composição: {len(ativos_sem_comp)}")
    linhas_sem_estrutura = [preparar_linha_sem_estrutura(p) for p in ativos_sem_comp]

    # 6) Gravar TUDO de uma só vez
    gravar_em_lote(linhas_estrutura, linhas_componentes, linhas_sem_estrutura)

    print("\n======================================")
    print("✅ PROCESSO CONCLUÍDO - RESUMO FINAL")
    print("======================================")
    print(f"   Produtos ATIVOS:                   {len(produtos_ativos)}")
    print(f"   Com composição (ativos):           {len(produtos_comp)}")
    print(f"   Estruturas salvas:                 {salvos}")
    print(f"   Sem estrutura (endpoint):          {sem_estrutura_encontrada}  # somente entre os que tentamos estruturar")
    print(f"   ATIVOS sem composição (tabela 3):  {len(linhas_sem_estrutura)}")
    print(f"   Banco gerado:                      {BOM_DB_PATH}")
    print("\n🏁 Fim.\n")


if __name__ == "__main__":
    main()
