import csv
import os
import shutil
import difflib

csv_path = "Cocreator_Content - Lista_Produtos.csv"
images_dir = "images/EMBALAGEM NOVA"
output_dir = "images/SELECIONADAS_FR"

os.makedirs(output_dir, exist_ok=True)
files = os.listdir(images_dir)

# Filter files that are images
valid_files = [f for f in files if f.lower().endswith(('.png', '.webp', '.jpg', '.jpeg'))]

# Create a mapping of lowercased filenames to real filenames
file_mapping = {f.lower(): f for f in valid_files}
all_lower_names = list(file_mapping.keys())

matched_count = 0
not_found_list = []

try:
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        for row in reader:
            if not row: continue
            produto = row[0]
            slug = row[1]
            
            # Preferências de busca (FR explícito primeiro)
            search_candidates = [
                f"{produto.lower()} fr.png",
                f"{produto.lower()} fr 2.png",
                f"{slug} fr.png",
                f"{slug.replace('-', ' ')} fr.png",
                f"{slug}.png",              # Se já foi renomeado no script anterior
                f"{produto.lower()}.png"
            ]
            
            best_match_filename = ""
            
            # Tentar match exato primeiro
            for cand in search_candidates:
                if cand in file_mapping:
                    best_match_filename = file_mapping[cand]
                    break
                    
            # Tentar um FR fuzzy se falhar o exato
            if not best_match_filename:
                # Filtrar arquivos FR existentes
                fr_files = [n for n in all_lower_names if 'fr' in n]
                term = produto.lower()
                matches = difflib.get_close_matches(term, fr_files, n=1, cutoff=0.3)
                if matches:
                    best_match_filename = file_mapping[matches[0]]
                else:
                    # Tentar de todos
                    matches = difflib.get_close_matches(term, all_lower_names, n=1, cutoff=0.5)
                    if matches:
                        best_match_filename = file_mapping[matches[0]]

            if best_match_filename:
                matched_count += 1
                source_path = os.path.join(images_dir, best_match_filename)
                # Sempre copiar para o nome do slug para facilitar o visual do usuario
                dest_path = os.path.join(output_dir, f"{slug}.png")
                shutil.copy2(source_path, dest_path)
            else:
                not_found_list.append(produto)

    print(f"[{matched_count}/40] Imagens copiadas para a pasta {output_dir}")
    if not_found_list:
        print(f"Não encontrados: {not_found_list}")
                
except Exception as e:
    print(f"Erro: {e}")
