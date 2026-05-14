import requests
from bs4 import BeautifulSoup
import json

url = 'https://www.paulistanaemporio.com/produtos/pistache-partido/'
headers = {'User-Agent': 'Mozilla/5.0'}
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, 'html.parser')
    imgs = soup.find_all('img')
    res = []
    for img in imgs:
        src = img.get('src', '')
        data_src = img.get('data-src', '')
        srcset = img.get('srcset', '')
        if 'produtos/pistache-partido' in response.url or 'cdn.nuvemshop.com.br' in src:
            res.append({
                'src': src,
                'data-src': data_src,
                'srcset': srcset,
                'class': img.get('class', [])
            })
            
    print(json.dumps(res[:5], indent=2))
        
    # Also look for links that might wrap images for lightboxes
    links = soup.find_all('a', class_=lambda c: c and 'product' in c.lower() or 'image' in c.lower())
    for a in links[:3]:
        print("Link href:", a.get('href'))
