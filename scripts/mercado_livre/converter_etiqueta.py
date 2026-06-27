import requests
import os
from PyPDF2 import PdfMerger
from datetime import datetime

# Caminho do arquivo com as etiquetas
caminho_arquivo_zpl = 'C:/Users/André/Desktop/etiquetas.txt'

# Define o tamanho da etiqueta em polegadas
largura = '3.94'  # 10cm
altura = '5.91'   # 15cm

# Caminho da Área de Trabalho para salvar os PDFs e ZPL consolidado
area_de_trabalho = 'C:/Users/André/Desktop/etiquetas'

# Cria a pasta 'etiquetas' caso não exista
os.makedirs(area_de_trabalho, exist_ok=True)

# Lê o conteúdo do arquivo ZPL
with open(caminho_arquivo_zpl, 'r', encoding='utf-8') as file:
    conteudo = file.read()

# Divide o conteúdo em etiquetas individuais
etiquetas = conteudo.split('^XZ')
etiquetas = [etiqueta.strip() + '^XZ' for etiqueta in etiquetas if etiqueta.strip()]

# --- Novo bloco: grava o ZPL consolidado ---
zpl_consolidado = "\n".join(etiquetas)
caminho_zpl_consolidado = os.path.join(area_de_trabalho, 'etiquetas_consolidadas.zpl')
with open(caminho_zpl_consolidado, 'w', encoding='utf-8') as zpl_file:
    zpl_file.write(zpl_consolidado)
print(f'💾 ZPL consolidado salvo em: {caminho_zpl_consolidado}')

# Lista para armazenar os nomes dos PDFs gerados
arquivos_pdf = []

# Processa uma etiqueta por vez
for i, etiqueta in enumerate(etiquetas, start=1):
    print(f'🔄 Gerando etiqueta {i} de {len(etiquetas)}')

    response = requests.post(
        f'http://api.labelary.com/v1/printers/8dpmm/labels/{largura}x{altura}/0/',
        headers={'Accept': 'application/pdf'},
        data=etiqueta.encode('utf-8')
    )

    if response.status_code == 200:
        nome_arquivo = os.path.join(area_de_trabalho, f'etiqueta_{i}.pdf')
        with open(nome_arquivo, 'wb') as pdf:
            pdf.write(response.content)
        arquivos_pdf.append(nome_arquivo)
        print(f'✅ Salvo: {nome_arquivo}')
    else:
        print(f'❌ Erro na etiqueta {i}: {response.status_code} - {response.text}')

# Juntando todos os PDFs em um único arquivo
if arquivos_pdf:
    pdf_merger = PdfMerger()
    for pdf in arquivos_pdf:
        pdf_merger.append(pdf)

    data_atual = datetime.now().strftime('%Y-%m-%d')
    arquivo_final = os.path.join(area_de_trabalho, f'etiquetas_completas_{data_atual}.pdf')
    pdf_merger.write(arquivo_final)
    pdf_merger.close()

    print(f'\n✅ Todos os PDFs foram unidos! Arquivo final: {arquivo_final}')

    # Apaga os PDFs individuais
    for pdf in arquivos_pdf:
        os.remove(pdf)
        print(f'🗑️ PDF individual apagado: {pdf}')

print('\n🏁 Conversão finalizada! PDFs e ZPL consolidados salvos na pasta "etiquetas".')

