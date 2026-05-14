import requests
from bs4 import BeautifulSoup

url = 'https://lista.mercadolivre.com.br/alimentos-bebidas/mercearia/paulistana-emporio_Desde_49_NoIndex_True'
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
}
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    items = soup.select('h2.ui-search-item__title')
    names = [i.text for i in items]
    print(f"Encontrados {len(names)} produtos no ML.")
    for name in names[:5]:
        print(name)
else:
    print(f"Erro ML: {response.status_code}")
