import os
import requests
from bs4 import BeautifulSoup
import re
import time

BASE_URL = 'https://www.paulistanaemporio.com'
PRODUCTS_URL = f'{BASE_URL}/produtos/'

def get_product_links():
    links = set()
    page = 1
    
    while True:
        url = f'{PRODUCTS_URL}?page={page}'
        print(f"Buscando produtos da página {page}: {url}")
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            break
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Encontrar links para produtos
        # A url de produtos provavelmente contem /produtos/nome-do-produto/
        # base_url = https://www.paulistanaemporio.com
        product_elements = soup.find_all('a', href=True)
        new_links_found = False
        
        for a in product_elements:
            href = a.get('href', '')
            if '/produtos/' in href and not href.endswith('/produtos/'):
                full_link = f"{BASE_URL}{href}" if href.startswith('/') else href
                if full_link.startswith(BASE_URL) and full_link not in links:
                    links.add(full_link)
                    new_links_found = True
                    
        # Se não encontrou links novos ou página vazia, termina
        if not new_links_found:
            break
            
        page += 1
        time.sleep(1) # Polite delay
        
    return list(links)

def parse_product_page(url, output_dir):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Encontrar nome do produto (geralmente no h1 ou no title)
        h1 = soup.find('h1')
        title = h1.text.strip() if h1 else ""
        if not title:
            og_title = soup.find('meta', property='og:title')
            title = og_title['content'] if og_title else url.split('/')[-2]
            
        # Limpar titulo para nome de arquivo
        safe_title = re.sub(r'[^a-zA-Z0-9\s-]', '', title).strip().replace(' ', '-')
        safe_title = safe_title.lower()
        
        # Buscar imagens do produto.
        # Geralmente estão em tags img, e a principal está no meta og:image ou em uma div de galeria
        images = []
        
        # Tentar primeiro OG Image
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            img_url = og_image['content']
            if img_url.startswith('//'):
                img_url = f"https:{img_url}"
            images.append(img_url)
            
        # Tentar encontrar outras imagens (podemos refinar pelo class na pagina depois)
        # Por enquanto, pegar tags img que parecem de produto (maiores)
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src')
            if src and '/products/' in src: # Em Nuvemshop geralmente as imgs ficam em caminhos com /products/
                if src.startswith('//'):
                    src = f"https:{src}"
                if src not in images:
                    images.append(src)
        
        download_images(images, safe_title, output_dir)
        time.sleep(1)
    except Exception as e:
        print(f"Erro em {url}: {e}")

def download_images(image_urls, prefix, output_dir):
    for i, url in enumerate(image_urls):
        try:
            # Remover parametros de thumb/resize da nuvemshop se existirem para pegar a foto original
            # nuvemshop imgs: cdn.nuvemshop.com.br/site/.../product-name-1024-1024.jpg -> tirar o -1024-1024
            original_url = re.sub(r'-\d+-\d+\.(jpg|png|jpeg)$', r'.\1', url, flags=re.IGNORECASE)
            
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            resp = requests.get(original_url, headers=headers)
            if resp.status_code != 200:
                resp = requests.get(url, headers=headers)
                
            if resp.status_code == 200:
                ext = url.split('.')[-1].split('?')[0]
                if ext.lower() not in ['jpg', 'jpeg', 'png', 'webp']:
                    ext = 'jpg'
                
                filename = f"{prefix}.{ext}" if i == 0 else f"{prefix}-{i}.{ext}"
                filepath = os.path.join(output_dir, filename)
                
                with open(filepath, 'wb') as f:
                    f.write(resp.content)
                print(f"Baixado: {filename}")
        except Exception as e:
            print(f"Erro ao baixar {url}: {e}")

if __name__ == '__main__':
    images_dir = 'images'
    os.makedirs(images_dir, exist_ok=True)
    
    print("Coletando links de produtos...")
    links = get_product_links()
    print(f"Encontrados {len(links)} links de produtos.")
    
    for url in links:
        parse_product_page(url, images_dir)
        
    print("Processo concluído!")
