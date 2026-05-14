# Instruções para Execução do Script de Sincronização

Houve uma divergência entre o ambiente de ferramentas e o caminho real do WSL. O script correto foi criado diretamente na pasta de trabalho.

## Localização dos Arquivos
Todos os arquivos necessários estão em: \\wsl.localhost\Ubuntu\home\sid\cocreator-n8n

- **Script:** sync_assets_final.py
- **Tabela de Referência:** Cocreator_Content - Lista_Produtos_Atualizado_New.csv
- **Credenciais:** cocreator-470801-85fe137c8f33.json

## Como Executar
Para finalizar o download e garantir que todos os slugs estejam corretos, execute o seguinte comando no seu terminal (dentro da pasta acima):

`ash
python sync_assets_final.py
`

## O que o script faz
1. Lê a coluna slug_imagem_real da sua planilha atualizada.
2. Busca o arquivo correspondente nas pastas produtos_reais e embalagens do bucket cocreator_content.
3. Faz o download para uma pasta local chamada ssets_sync_final, garantindo que o nome do arquivo seja exatamente o slug correto.
4. Caso o arquivo só exista com o nome antigo/errado no bucket, ele o renomeia automaticamente durante o download.

## Notas Técnicas
- O script utiliza a biblioteca google-cloud-storage.
- Caso ocorra erro de 'UNC path' no CMD, utilize o PowerShell ou o terminal do WSL (Ubuntu).
