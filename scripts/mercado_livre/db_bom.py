# -*- coding: utf-8 -*-
"""
Esquema e helpers de DB para BOM do Bling.
Salva em: C:/Users/André/Desktop/ApiMercadoLivre/bling_bom.db
"""

import logging
import os
import sqlite3
from contextlib import contextmanager

# Configuração básica de logs para exibir etapas e ações executadas
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# Caminho do banco de destino
BASE_DIR = r"C:\Users\André\Desktop\ApiMercadoLivre"
DB_PATH = os.path.join(BASE_DIR, "bling_bom.db")

# DDL das tabelas
DDL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS estruturas (
    id               INTEGER PRIMARY KEY,      -- idProdutoEstrutura
    parent_codigo    TEXT NOT NULL,            -- código do produto pai (kit)
    parent_nome      TEXT,
    atualizado_em    TEXT                      -- ISO8601
);

CREATE TABLE IF NOT EXISTS composicao_bom (
    parent_codigo    TEXT NOT NULL,
    child_codigo     TEXT NOT NULL,
    child_nome       TEXT,
    qty_por_pai      REAL NOT NULL,
    estrutura_id     INTEGER,                  -- referência da estrutura
    atualizado_em    TEXT,                     -- ISO8601
    PRIMARY KEY (parent_codigo, child_codigo),
    FOREIGN KEY (estrutura_id) REFERENCES estruturas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_bom_parent ON composicao_bom(parent_codigo);
CREATE INDEX IF NOT EXISTS ix_bom_child  ON composicao_bom(child_codigo);
"""


@contextmanager
def conn():
    logger.info("Garantindo diretório do banco: %s", BASE_DIR)
    os.makedirs(BASE_DIR, exist_ok=True)
    logger.info("Abrindo conexão com SQLite: %s", DB_PATH)
    c = sqlite3.connect(DB_PATH)
    try:
        yield c
    finally:
        logger.info("Fechando conexão com SQLite")
        c.close()


def init_db():
    """Cria/garante o esquema do banco de BOM."""
    logger.info("Inicializando banco e garantindo esquema")
    with conn() as c:
        logger.info("Executando script DDL")
        c.executescript(DDL)
        logger.info("Confirmando DDL (commit)")
        c.commit()


def upsert_estrutura(id_estrutura, parent_codigo, parent_nome):
    """Insere/atualiza a linha da estrutura (pai)."""
    logger.info(
        "Upsert da estrutura: id=%s, parent_codigo=%s, parent_nome=%s",
        id_estrutura,
        parent_codigo,
        parent_nome,
    )
    with conn() as c:
        c.execute(
            """
        INSERT INTO estruturas(id, parent_codigo, parent_nome, atualizado_em)
        VALUES(?, ?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
            parent_codigo=excluded.parent_codigo,
            parent_nome=excluded.parent_nome,
            atualizado_em=excluded.atualizado_em
        """,
            (int(id_estrutura), str(parent_codigo), parent_nome),
        )
        logger.info("Commit do upsert da estrutura")
        c.commit()


def replace_bom(parent_codigo, estrutura_id, itens):
    """
    Substitui completamente os filhos de um parent (id_estrutura) pelos itens atuais.
    itens: lista de dicts: [{child_codigo, child_nome, qty_por_pai}, ...]
    """
    logger.info(
        "Substituindo BOM para parent_codigo=%s (estrutura_id=%s) com %s itens",
        parent_codigo,
        estrutura_id,
        len(itens or []),
    )
    with conn() as c:
        logger.info("Removendo filhos atuais do parent_codigo=%s", parent_codigo)
        c.execute("DELETE FROM composicao_bom WHERE parent_codigo=?", (str(parent_codigo),))
        for it in (itens or []):
            logger.info(
                "Inserindo filho: child_codigo=%s, qty_por_pai=%s",
                it.get("child_codigo"),
                it.get("qty_por_pai"),
            )
            c.execute(
                """
            INSERT INTO composicao_bom(parent_codigo, child_codigo, child_nome, qty_por_pai, estrutura_id, atualizado_em)
            VALUES(?, ?, ?, ?, ?, datetime('now'))
            """,
                (
                    str(parent_codigo),
                    str(it["child_codigo"]),
                    it.get("child_nome"),
                    float(it["qty_por_pai"]),
                    int(estrutura_id),
                ),
            )
        logger.info("Commit da substituição de BOM")
        c.commit()


# 👇 ADICIONE ESTE BLOCO NO FINAL DO ARQUIVO
if __name__ == "__main__":
    logger.info("Rodando db_bom.py diretamente – inicializando banco...")
    init_db()
    logger.info("Banco bling_bom.db criado/atualizado com sucesso!")
    print("OK: banco bling_bom.db garantido em", DB_PATH)
