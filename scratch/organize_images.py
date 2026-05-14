import os
import re
import unicodedata

def slugify(value):
    value = str(value)
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^\w\s-]', '', value).strip().lower()
    value = re.sub(r'[-\s]+', '-', value)
    return value

dir_path = 'images/EMBALAGEM NOVA'
files = os.listdir(dir_path)

deleted_count = 0
renamed_count = 0

for f in files:
    f_lower, ext = os.path.splitext(f.lower())
    
    # Inuteis
    if re.search(r'\b(tn|bn|ben|in)\b', f_lower):
        filepath = os.path.join(dir_path, f)
        if os.path.isfile(filepath):
            os.remove(filepath)
            deleted_count += 1
            print(f"Deletado: {f}")
    
    # Uteis (FR)
    elif re.search(r'\bfr\b|\bfr\d', f_lower):
        name_no_fr = re.sub(r'\bfr\b|\bfr\d', '', f_lower).strip(' _-')
        slug = slugify(name_no_fr)
        if not slug:
            slug = "imagem-frente"
            
        new_name = f"{slug}{ext}"
        
        counter = 1
        final_new_name = new_name
        while os.path.exists(os.path.join(dir_path, final_new_name)) and f.lower() != final_new_name.lower():
            final_new_name = f"{slug}-{counter}{ext}"
            counter += 1
            
        old_path = os.path.join(dir_path, f)
        new_path = os.path.join(dir_path, final_new_name)
        
        if old_path != new_path:
            # Handle case insensitive renames on some OS by using a temp name
            if old_path.lower() == new_path.lower():
                temp_path = os.path.join(dir_path, f"{final_new_name}.tmp")
                os.rename(old_path, temp_path)
                os.rename(temp_path, new_path)
            else:
                os.rename(old_path, new_path)
            renamed_count += 1
            print(f"Renomeado: {f} -> {final_new_name}")

print(f"-----")
print(f"Limpeza concluída! Deletadas: {deleted_count} | Renomeadas: {renamed_count}.")
