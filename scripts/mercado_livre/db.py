# db.py
import sqlite3
from config import DB_PATH

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    sql_produtos = """
    CREATE TABLE IF NOT EXISTS produtos (
      id TEXT PRIMARY KEY,
      sku TEXT,
      title TEXT,
      price REAL,
      currency_id TEXT,
      category_id TEXT,
      sold_quantity INTEGER,
      available_quantity INTEGER,
      condition TEXT,
      thumbnail TEXT,
      permalink TEXT,
      dados_json TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """
    sql_taxas = """
    CREATE TABLE IF NOT EXISTS taxas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT,
      tipo TEXT,
      amount REAL,
      dados_json TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(item_id) REFERENCES produtos(id)
    );
    """

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(sql_produtos)
    cur.execute(sql_taxas)
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Banco inicializado em", DB_PATH)
