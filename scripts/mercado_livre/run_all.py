import subprocess
import sys
import os

# Lista dos seus scripts (na ordem desejada)
scripts = [
    "fetch_products.py",
    "produtos_bling.py",
    "atualizar-planilha.py",
    "ApiBling.py",
    
    
]

def run_scripts():
    base_dir = os.path.dirname(__file__)
    for script in scripts:
        script_path = os.path.join(base_dir, script)
        print(f"\n=== Iniciando {script} ===")
        try:
            # Executa com o mesmo interpretador do run_all.py
            subprocess.run([sys.executable, script_path], check=True)
            print(f"✅ {script} finalizado com sucesso.")
        except subprocess.CalledProcessError as e:
            print(f"❌ Falha ao executar {script}: código de saída {e.returncode}")
            # Se quiser parar na primeira falha, descomente a linha abaixo:
            # break

if __name__ == "__main__":
    run_scripts()
