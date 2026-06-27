import urllib.request
from bs4 import BeautifulSoup

url = 'https://produto.mercadolivre.com.br/MLB-3623912061-amendoa-torrada-1-kg-_JM'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
html = urllib.request.urlopen(req).read().decode('utf-8')
soup = BeautifulSoup(html, 'lxml')

print("Title:", soup.title.string if soup.title else "No title")
meta_price = soup.find('meta', itemprop='price')
if meta_price:
    print(f"Price from meta: {meta_price.get('content')}")
fraction = soup.find('span', class_='andes-money-amount__fraction')
if fraction:
    print(f"Price from fraction: {fraction.text}")

print("HTML length:", len(html))
