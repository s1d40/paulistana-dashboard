import os
import gspread

def format_product_name(filename):
    # Remove extensão
    base_name = os.path.splitext(filename)[0]
    # Remove -1 no final se existir
    if base_name.endswith('-1'):
        base_name = base_name[:-2]
    # Substitui hifens por espaços e coloca primeira letra maiúscula
    return base_name.replace('-', ' ').title()

def update_google_sheets(credentials_path, doc_name, sheet_name, images_dir, gcs_bucket, gcs_prefix):
    print("Autenticando no Google Sheets...")
    gc = gspread.service_account(filename=credentials_path)
    
    try:
        sh = gc.open(doc_name)
    except gspread.exceptions.SpreadsheetNotFound:
        print(f"Erro: Planilha '{doc_name}' não encontrada. Certifique-se de que a conta de serviço '{gc.auth.signer_email}' tem permissão de Editor na planilha.")
        return

    try:
        worksheet = sh.worksheet(sheet_name)
    except gspread.exceptions.WorksheetNotFound:
        print(f"Aba '{sheet_name}' não encontrada. Criando nova...")
        worksheet = sh.add_worksheet(title=sheet_name, rows="100", cols="6")

    print(f"Lendo imagens de {images_dir}...")
    files = [f for f in os.listdir(images_dir) if os.path.isfile(os.path.join(images_dir, f))]
    
    # Cabeçalho
    headers = ["Produto", "Slug_Imagem", "Categoria", "Benefícios_Chave", "URL_GCS"]
    data = [headers]
    
    # Preencher os dados iterando pelas imagens
    for file_name in files:
        produto = format_product_name(file_name)
        slug_imagem = os.path.splitext(file_name)[0]
        categoria = "" # Em branco para preencher manulamente
        beneficios_chave = "" # Em branco para preencher manulamente
        url_gcs = f"https://storage.googleapis.com/{gcs_bucket}/{gcs_prefix.strip('/')}/{file_name}"
        
        data.append([produto, slug_imagem, categoria, beneficios_chave, url_gcs])

    print("Escrevendo os dados na planilha...")
    worksheet.clear()
    worksheet.update('A1', data)
    
    # Formatação basica do cabeçalho
    worksheet.format("A1:E1", {
        "backgroundColor": {"red": 0.2, "green": 0.2, "blue": 0.2},
        "textFormat": {"foregroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0}, "bold": True}
    })
    
    print(f"Sucesso! {len(files)} imagens adicionadas na planilha {doc_name} > {sheet_name}.")

if __name__ == '__main__':
    CREDENTIALS_FILE = 'cocreator-470801-85fe137c8f33.json'
    DOC_NAME = 'Cocreator_Content'
    SHEET_NAME = 'DB_Produtos_Paulistana'
    IMAGES_DIR = 'images'
    GCS_BUCKET = 'cocreator_content'
    GCS_PREFIX = 'embalagens'
    
    update_google_sheets(CREDENTIALS_FILE, DOC_NAME, SHEET_NAME, IMAGES_DIR, GCS_BUCKET, GCS_PREFIX)
