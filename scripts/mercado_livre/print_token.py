import sys
import os

# Adiciona o diretório atual ao path para garantir que o auth.py seja encontrado
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from auth import get_access_token
    token = get_access_token()
    print(token)
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
