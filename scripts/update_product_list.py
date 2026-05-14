import csv
import os
import re
import unicodedata

# New mappings provided by the user
new_mappings = {
    "Mix chips de frutas tropicais desidratadas": "MIX FT RN 2.png",
    "Pistache cru partido": "PISTACHE FR.png",
    "mix chips de vegetais desidratados": "VEGETAIS FR 2.png",
    "psyllium husk 60%": "PSYLLIUM FR.png",
    "canela em pau": "Canela FR.png",
    "Chá de hibisco": "HIBISCO FR.png",
    "Castanha de caju": "caju FR.png",
    "Cramberry": "cramberry fr.png",
    "cardamomo": "Cardamomo FR.png",
    "Amendoim torrado sem casca": "Amendoin s_ Sal FR.png",
    "Semente de abóbora": "Abóbora FR.png",
    "Blueberry Desidratada": "blueberry fr.png",
    "Cravo da India": "Cravo FR.png",
    "Castanha do pará quebrada": "220.png",
    "Anis Estrelado": "anis fr.png",
    "Amêndoas Crua": "228.png",
    "Alfazema azul": "247.png",
    "Folha de louro": "LOURO FR.png",
    "Tamara jumbo": "255.png",
    "Ameixa seca sem caroço": "270.png",
    "Gojiberry": "274.png",
    "Chimichurri": "278.png",
    "Banana passa": "Banana Passa FR.png",
    "Damasco": "Damasco FR.png",
}

csv_file = 'Cocreator_Content - Lista_Produtos_Atualizado.csv'
temp_file = 'Cocreator_Content - Lista_Produtos_Atualizado_New.csv'

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

def normalize(name):
    name = remove_accents(name.lower().strip())
    name = re.sub(r'[^a-z0-9]+', '', name)
    return name

def slugify(text):
    text = remove_accents(text.lower().strip())
    text = re.sub(r'[^a-z0-9]+', ' ', text)
    return "-".join(text.split())

normalized_new_mappings = {normalize(k): v for k, v in new_mappings.items()}

rows = []
fieldnames = []
with open(csv_file, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    seen = set()
    for row in reader:
        norm_name = normalize(row['Produto'])
        if norm_name in seen:
            continue
        seen.add(norm_name)
        rows.append(row)

updated_count = 0
matched_keys = set()

for row in rows:
    prod_name = normalize(row['Produto'])
    # Try direct match
    if prod_name in normalized_new_mappings:
        row['slug_imagem_real'] = normalized_new_mappings[prod_name]
        matched_keys.add(prod_name)
        updated_count += 1
    else:
        # Try partial match
        for key in normalized_new_mappings:
            if key in prod_name or prod_name in key:
                row['slug_imagem_real'] = normalized_new_mappings[key]
                matched_keys.add(key)
                updated_count += 1
                break

# Add missing products
added_count = 0
for original_key, img_file in new_mappings.items():
    norm_key = normalize(original_key)
    if norm_key not in matched_keys:
        already_there = False
        for row in rows:
            if norm_key == normalize(row['Produto']) or norm_key in normalize(row['Produto']) or normalize(row['Produto']) in norm_key:
                already_there = True
                break
        
        if not already_there:
            new_row = {
                'Produto': original_key,
                'slug_embalagem': slugify(original_key),
                'slug_imagem_real': img_file,
                'Restricao_Narrativa': '',
                'Restricao_Visual': ''
            }
            rows.append(new_row)
            added_count += 1

# Write back
with open(temp_file, mode='w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Updated {updated_count} products.")
print(f"Added {added_count} new products.")
