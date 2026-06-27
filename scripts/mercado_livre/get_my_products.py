import auth
import requests

def get_my_products():
    print("Obtendo token...")
    token = auth.get_access_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Buscando ID do usuário...")
    res_me = requests.get("https://api.mercadolibre.com/users/me", headers=headers)
    if res_me.status_code != 200:
        print("Erro ao buscar me:", res_me.text)
        return
    user_id = res_me.json().get("id")
    print(f"User ID: {user_id}")
    
    url_search = f"https://api.mercadolibre.com/users/{user_id}/items/search?status=active"
    res = requests.get(url_search, headers=headers)
        
    data = res.json()
    item_ids = data.get("results", [])
    print(f"Total de anúncios ativos encontrados: {len(item_ids)}")
    
    if not item_ids:
        print("Nenhum anúncio encontrado.")
        return
        
    # Pega os detalhes em lotes de 20
    chunk_size = 20
    titulos = []
    
    for i in range(0, len(item_ids), chunk_size):
        chunk = item_ids[i:i + chunk_size]
        ids_str = ",".join(chunk)
        url_items = f"https://api.mercadolibre.com/items?ids={ids_str}"
        res_items = requests.get(url_items, headers=headers)
        
        if res_items.status_code == 200:
            items_data = res_items.json()
            for item in items_data:
                body = item.get("body", {})
                titulo = body.get("title")
                if titulo:
                    titulos.append(titulo)
        else:
            print("Erro ao buscar detalhes do lote.")
            
    print("\n--- MEUS PRODUTOS (TÍTULOS) ---")
    for t in titulos:
        print(f"- {t}")

if __name__ == "__main__":
    get_my_products()
