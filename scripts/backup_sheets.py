import gspread
import csv
import os

def backup_sheet(gc, doc_name, sheet_name, output_path):
    print(f"Fazendo backup da aba '{sheet_name}' em '{doc_name}'...")
    try:
        sh = gc.open(doc_name)
        worksheet = sh.worksheet(sheet_name)
        data = worksheet.get_all_values()
        
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(data)
        print(f"Sucesso: {output_path}")
    except Exception as e:
        print(f"Erro ao fazer backup de {sheet_name}: {e}")

if __name__ == '__main__':
    CREDENTIALS_FILE = 'cocreator-470801-85fe137c8f33.json'
    DOC_NAME = 'Cocreator_Content'
    BACKUP_DIR = 'local_storage/backup'
    
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
    
    print("Autenticando no Google Sheets...")
    gc = gspread.service_account(filename=CREDENTIALS_FILE)
    
    # Abas para backup
    sheets_to_backup = {
        'DB_Produtos_Paulistana': 'produtos_backup.csv',
        'Clientes': 'clientes_backup.csv',
        'Contas': 'contas_backup.csv',
        'Conteudo': 'conteudo_backup.csv'
    }
    
    for sheet_name, filename in sheets_to_backup.items():
        output_path = os.path.join(BACKUP_DIR, filename)
        backup_sheet(gc, DOC_NAME, sheet_name, output_path)
