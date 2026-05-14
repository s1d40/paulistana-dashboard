import os
import re

dir_path = 'images/EMBALAGEM NOVA'
files = os.listdir(dir_path)

categories = {'FR': [], 'TN': [], 'BN/BEN': [], 'IN': [], 'UNMARKED': []}

for f in files:
    f_lower = f.lower()
    if re.search(r'\bfr\b|\bfr\d', f_lower):
        categories['FR'].append(f)
    elif re.search(r'\btn\b', f_lower):
        categories['TN'].append(f)
    elif re.search(r'\bbn\b|\bben\b', f_lower):
        categories['BN/BEN'].append(f)
    elif re.search(r'\bin\b', f_lower):
        categories['IN'].append(f)
    else:
        categories['UNMARKED'].append(f)

for k, v in categories.items():
    print(f"{k}: {len(v)} arquivos")
