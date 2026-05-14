import csv
import os
import difflib

csv_path = "Cocreator_Content - Lista_Produtos.csv"
images_dir = "images/EMBALAGEM NOVA"

files = os.listdir(images_dir)

def clean_text(text):
    text = text.lower().replace('.png', '').replace('.webp', '')
    for stop in [' fr', ' fr_1', '_1', ' (2)', ' (3)', ' saco', ' derramada', ' derramado']:
        text = text.replace(stop, '')
    return text.strip()

file_mapping = {clean_text(f): f for f in files if f.endswith(('.png', '.webp', '.jpeg', '.jpg'))}
clean_filenames = list(file_mapping.keys())

rows = []
try:
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        # Old Header: Produto,Slug,Restricao_Narrativa,Restricao_Visual
        new_header = ['Produto', 'slug_embalagem', 'slug_imagem_real', 'Restricao_Narrativa', 'Restricao_Visual']
        rows.append(new_header)
        
        match_count = 0
        for row in reader:
            if not row: continue
            produto = row[0]
            slug = row[1]
            rest_nar = row[2] if len(row) > 2 else ""
            rest_vis = row[3] if len(row) > 3 else ""
            
            search_terms = [produto.lower(), slug.replace('-', ' ')]
            best_match_filename = ""
            
            # Fuzzy match
            for term in search_terms:
                matches = difflib.get_close_matches(term, clean_filenames, n=1, cutoff=0.5)
                if matches:
                    best_match_filename = file_mapping[matches[0]]
                    break
                    
            # Fallback substring match
            if not best_match_filename:
                for clean_name, orig_name in file_mapping.items():
                    if search_terms[0].split()[0] in clean_name:
                        best_match_filename = orig_name
                        break

            if best_match_filename:
                match_count += 1
                
            new_row = [produto, slug, best_match_filename, rest_nar, rest_vis]
            rows.append(new_row)

    out_path = "Cocreator_Content - Lista_Produtos_Atualizado.csv"
    with open(out_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)
        
    print(f"Sucesso! Mapeadas {match_count} imagens reais. Salvo em {out_path}")
except Exception as e:
    print(f"Erro: {e}")
