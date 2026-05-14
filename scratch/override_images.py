import shutil
import os

overrides = {
    "mix-de-frutas-tropicais-chips--desidratadas.png": "tropicais derramado.png",
    "mix-chips-de-vegetais-chips--desidratados.png": "vegetais_1.png",
    "limao-desidratado-fatias.png": "239.png",
    "canela-em-pau.png": "Canela FR.png",
}

for dest, src in overrides.items():
    src_path = os.path.join("images/EMBALAGEM NOVA", src)
    dest_path = os.path.join("images/SELECIONADAS_FR", dest)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dest_path)
        print(f"Sucesso: {src} -> {dest}")
    else:
        print(f"Erro: não achou {src}")
