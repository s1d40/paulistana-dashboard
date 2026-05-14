
import csv

input_path = "Cocreator_Content - Lista_Produtos_Atualizado_New.csv"
output_path = "Cocreator_Content - Lista_Produtos_Sanitizado.csv"

# Regras de correção de nomes e português
corrections = {
    "Amêndoas Crua": "Amêndoas Cruas",
    "Amêndoas Defumada": "Amêndoas Defumadas",
    "Nozes Partida": "Nozes Partidas",
    "Cramberry": "Cranberry",
    "Mix chips de frutas tropicais desidratadas": "Mix de Frutas Tropicais Desidratadas",
    "psyllium husk 60%": "Psyllium Husk",
    "Psyllium Husk Flocos 90": "Psyllium Husk",
    "Amendoim Com Sal": "Amendoim Torrado",
    "Amendoim torrado sem casca": "Amendoim Torrado",
    "Castanha de Caju Com Sal": "Castanha de Caju",
    "Tâmara Jumbo": "Tâmara",
    "Tâmara Sem Caroço": "Tâmara",
    "Uva Passa Argentina": "Uva Passa",
    "Uva Passa Branca": "Uva Passa",
    "Pistache Partido": "Pistache",
    "Pistache cru partido": "Pistache"
}

# Slugs que devem ser unificados (opcional, mas bom para consistência)
slug_corrections = {
    "amendoim-torrado-sem-casca": "amendoim-torrado",
    "amendoim-com-sal": "amendoim-torrado",
    "castanha-de-caju-c-sal": "castanha-de-caju",
    "tamara-jumbo": "tamara",
    "tamara-s-caroo": "tamara",
    "uva-passa-argentina": "uva-passa",
    "uva-passa-branca": "uva-passa",
    "pistache-partido": "pistache",
    "pistache-cru-partido": "pistache",
    "psyllium-husk-flocos-90": "psyllium-husk",
    "psyllium-husk-60": "psyllium-husk"
}

products_seen = set()
final_rows = []

with open(input_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    
    for row in reader:
        # Aplicar correções de nome
        orig_name = row['Produto']
        new_name = corrections.get(orig_name, orig_name)
        
        # Aplicar correções de slug
        orig_slug = row['slug_embalagem']
        new_slug = slug_corrections.get(orig_slug, orig_slug)
        
        # Se já vimos esse produto (nome corrigido), ignoramos a duplicata
        if new_name in products_seen:
            continue
            
        row['Produto'] = new_name
        row['slug_embalagem'] = new_slug
        
        # Correção específica de imagem real se estiver vazia ou com nome antigo
        if new_name == "Amendoim Torrado" and not row['slug_imagem_real'].endswith('-real.png'):
            row['slug_imagem_real'] = "amendoim-torrado-sem-casca-real.png"
            
        products_seen.add(new_name)
        final_rows.append(row)

# Ordenar alfabeticamente para facilitar a gestão
final_rows.sort(key=lambda x: x['Produto'])

with open(output_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(final_rows)

print(f"Sanitização concluída! De {len(products_seen) + 15} linhas para {len(final_rows)} produtos únicos.")
print(f"Arquivo salvo como: {output_path}")
