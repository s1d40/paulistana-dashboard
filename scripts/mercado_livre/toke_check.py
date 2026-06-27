import sqlite3, time, os, sys

TOK_DB = r"C:\Users\André\Desktop\ApiMercadoLivre\bling_tokens.db"
if not os.path.exists(TOK_DB):
    print("❌ DB não encontrado:", TOK_DB); sys.exit(0)

con = sqlite3.connect(TOK_DB)
cur = con.cursor()

def table_exists(name):
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?",(name,))
    return cur.fetchone() is not None

print("📚 Tabelas:")
for t in ["oauth_apps","oauth_tokens"]:
    print(" -", t, "✔" if table_exists(t) else "✘")

if table_exists("oauth_apps"):
    print("\n🔑 oauth_apps (provider, client_id..., redirect_uri, state):")
    for row in cur.execute("SELECT provider, substr(client_id,1,6)||'...', redirect_uri, COALESCE(state,'(null)') FROM oauth_apps"):
        print(" ", row)

if table_exists("oauth_tokens"):
    print("\n🪙 oauth_tokens (provider, access... len, refresh... len, exp, válido?):")
    now = int(time.time())
    for row in cur.execute("SELECT provider, length(access_token), length(refresh_token), COALESCE(expires_at,0) FROM oauth_tokens"):
        prov, lat, lrt, exp = row
        print(f"  prov={prov} | access_len={lat} | refresh_len={lrt} | exp={exp} | valido={exp>now}")
