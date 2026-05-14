import csv
import os

CSV_INPUT = 'Cocreator_Content - Lista_Produtos_Atualizado_New.csv'
CSV_OUTPUT = 'Cocreator_Content - Lista_Produtos_Final_Organizado.csv'
CSV_NEW = 'new_products.csv'

def main():
    # Load the 20 new slugs to identify which rows to fix strictly
    new_slugs = set()
    with open(CSV_NEW, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            new_slugs.add(row['Slug Sugerido (Para o Banco de Dados/IA)'])

    rows = []
    fieldnames = []
    with open(CSV_INPUT, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            slug = row['slug_embalagem']
            
            # If this is one of our 20 new products (or matches the slug pattern)
            if slug in new_slugs or row['slug_imagem_real'].replace('.png', '') == slug:
                # slug_embalagem: just the slug
                row['slug_embalagem'] = slug.replace('.png', '')
                # slug_imagem_real: slug + .png
                if not row['slug_imagem_real'].endswith('.png'):
                    row['slug_imagem_real'] = f"{row['slug_embalagem']}.png"
                else:
                    # Ensure it matches the slug
                    row['slug_imagem_real'] = f"{row['slug_embalagem']}.png"
            
            rows.append(row)

    with open(CSV_OUTPUT, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"CSV Final organizado: {CSV_OUTPUT}")

if __name__ == '__main__':
    main()
