
import os
import csv

# Configurações
csv_path = "Cocreator_Content - Lista_Produtos_Atualizado_New.csv"
images_dir = "images/EMBALAGEM NOVA"
output_csv = "Cocreator_Content - Lista_Produtos_Atualizado_New.csv"

# Mapeamento do usuário (Produto na Lista : Nome do arquivo real)
# Vou usar nomes mais curtos para facilitar o matching
user_mapping = {
    "mix chips de frutas tropicais desidratadas": "MIX FT RN 2",
    "pistache cru partido": "PISTACHE FR",
    "mix chips de vegetais desidratados": "VEGETAIS FR 2",
    "psyllium husk 60%": "PSYLLIUM FR",
    "canela em pau": "Canela FR",
    "hibisco": "Hibisco FR",
    "castanha de caju": "caju FR",
    "cramberry": "cramberry fr",
    "cardamomo": "Cardamomo FR",
    "amendoim torrado sem casca": "amendoim-torrado-sem-casca-real", # Já renomeado no passo anterior
    "semente de abobora": "Abóbora FR",
    "blueberry": "blueberry FR",
    "cravo": "Cravo Fr",
    "castanha do para quebrada": "220",
    "anis estrelado": "Anis FR",
    "amendoas crua": "228",
    "alfazema azul": "247",
    "folha de louro": "LOURO FR",
    "tamara jumbo": "255",
    "ameixa seca sem caroco": "270",
    "goji berry": "274",
    "chimichurri": "278",
    "banana passa": "Banana Passa FR",
    "damasco": "Damasco FR"
}

def normalize(text):
    import unicodedata
    if not text: return ""
    text = str(text).lower().strip()
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    return text

# Atualizar o mapeamento para nomes normalizados
normalized_user_mapping = {normalize(k): v for k, v in user_mapping.items()}

existing_files = os.listdir(images_dir)

def find_file(name):
    if not name: return None
    # Já pode ser o novo nome
    for ext in ['.png', '.webp', '.jpg', '.jpeg']:
        if f"{name}{ext}" in existing_files:
            return f"{name}{ext}"
    
    # Busca por prefixo ou substring
    for f in existing_files:
        if normalize(name) in normalize(f):
            return f
    return None

rows = []
renames_made = 0

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        produto = row['Produto']
        slug = row['slug_embalagem']
        norm_produto = normalize(produto)
        
        # Tenta encontrar o melhor match no mapeamento
        match_key = None
        for key in normalized_user_mapping:
            if key in norm_produto or norm_produto in key:
                match_key = key
                break
        
        if match_key:
            src_base = normalized_user_mapping[match_key]
            src_file = find_file(src_base)
            
            if src_file:
                ext = os.path.splitext(src_file)[1]
                new_filename = f"{slug}-real{ext}"
                
                old_path = os.path.join(images_dir, src_file)
                new_path = os.path.join(images_dir, new_filename)
                
                if old_path != new_path:
                    try:
                        # Se o destino já existe (talvez renomeado em turn anterior), apenas atualiza CSV
                        if os.path.exists(new_path):
                            print(f"Arquivo já existe: {new_filename}")
                        else:
                            os.rename(old_path, new_path)
                            print(f"Renomeado: {src_file} -> {new_filename}")
                            renames_made += 1
                    except Exception as e:
                        print(f"Erro ao renomear {src_file}: {e}")
                
                row['slug_imagem_real'] = new_filename
            else:
                # Se não achou o arquivo mas a coluna já tem algo que parece correto, mantém
                if not row['slug_imagem_real'] or not row['slug_imagem_real'].endswith('-real' + os.path.splitext(row['slug_imagem_real'])[1]):
                    print(f"Aviso: Arquivo base '{src_base}' não encontrado para '{produto}'")
        
        rows.append(row)

with open(output_csv, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"\nRefinamento concluído! {renames_made} novos arquivos renomeados.")
