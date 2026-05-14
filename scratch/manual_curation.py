import shutil
import os

images_dir = "images/EMBALAGEM NOVA"
dest_dir = "images/SELECIONADAS_FR"

# Mapping: destination_slug: [list of possible source filenames from Canva]
overrides = {
    "mix-de-frutas-tropicais-chips--desidratadas.png": ["76.png", "MIX FT RN 2.png", "MIX FT RN 2 (2).png", "MIX FT RN.png"],
    "pistache-partido.png": ["88.png", "PISTACHE FR.png"],
    "mix-chips-de-vegetais-chips--desidratados.png": ["97.png", "VEGETAIS FR 2.png", "VEGETAIS 2.png", "vegetais_1.png"],
    "psyllium-husk-flocos-90.png": ["136.png", "PSYLLIUM FR.png", "psyllium 90 FR.png"],
    "canela-em-pau.png": ["141.png", "Canela FR.png"],
    "ch-de-hibisco.png": ["152.png", "Hibisco FR.png", "HIBISCO FR.png", "Hibisco FR_1.png"],
    "castanha-de-caju-c-sal.png": ["160.png", "caju FR.png"],
    "cramberry.png": ["168.png", "cramberry fr.png"],
    "cardamomo-sementes.png": ["172.png", "Cardamomo FR.png"],
    "amendoim-com-sal.png": ["176.png", "Amendoim s/Sal FR.png", "Amendoim S_ Sal.png", "Amendoin s_ Sal FR.png"],
    "semente-de-abobora.png": ["184.png", "Abóbora FR.png"],
    "blueberry.png": ["188.png", "blueberry FR.png", "blueberry fr.png"],
    "cravo.png": ["202.png", "Cravo Fr.png", "Cravo FR.png"],
    "castanha-do-par-quebrada.png": ["220.png"],
    "anis-estrelado.png": ["224.png", "Anis FR.png", "Anis FR_1.png", "Anis FR (2).png", "anis fr.png"],
    "amndoas-crua.png": ["228.png", "Amêndoas defumada FR.png"], # as safe fallback or just 228
    "alfazema-azul.png": ["247.png"],
    "folha-de-louro.png": ["251.png", "LOURO FR.png"],
    "tamara-jumbo.png": ["255.png"],
    "ameixa-seca-sem-caroo.png": ["270.png"],
    "goji-berry.png": ["274.png"],
    "chimichurri.png": ["278.png"],
    "banana-passa.png": ["286.png", "Banana Passa FR.png"],
    "damasco-jumbo.png": ["306.png", "Damasco FR.png"]
}

sucessos = 0
erros = []

for dest_slug, candidates in overrides.items():
    found = False
    dest_path = os.path.join(dest_dir, dest_slug)
    
    for cand in candidates:
        src_path = os.path.join(images_dir, cand)
        if os.path.exists(src_path):
            shutil.copy2(src_path, dest_path)
            print(f"Sucesso: {cand} -> {dest_slug}")
            sucessos += 1
            found = True
            break
            
    if not found:
        erros.append(dest_slug)
        print(f"ERRO: Nenhuma das alternativas encontrada para {dest_slug} ({candidates})")

print(f"Total atualizadas: {sucessos}")
if erros:
    print("FALHAS:")
    for e in erros:
        print("-", e)
