import requests

# Find a valid item ID from search
res = requests.get("https://api.mercadolibre.com/sites/MLB/search?q=castanha&limit=1")
data = res.json()
item_id = data['results'][0]['id']
print("Item:", item_id)

# 1. Fetch description WITHOUT auth
res1 = requests.get(f"https://api.mercadolibre.com/items/{item_id}/description")
print("Desc sem auth:", res1.status_code)

# 2. Fetch reviews WITHOUT auth
res2 = requests.get(f"https://api.mercadolibre.com/reviews/item/{item_id}")
print("Reviews sem auth:", res2.status_code)

# 3. Fetch item WITHOUT auth
res3 = requests.get(f"https://api.mercadolibre.com/items/{item_id}")
print("Item sem auth:", res3.status_code)
