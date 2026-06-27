import os
import glob
from unidecode import unidecode
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('../dashboard/.env.local')
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def normalize(text):
    if not text:
        return ""
    # Remove accents, lowercase, replace spaces/dashes with common space for search
    return unidecode(text.lower().replace("-", " ").replace("_", " "))

def main():
    print("Mapeando arquivos locais...")
    reais_paths = glob.glob("../assets_sync_final/produtos_reais/*.png") + glob.glob("../assets_sync_final/produtos_reais/*.jpg")
    embalagens_paths = glob.glob("../assets_sync_final/embalagens/*.png") + glob.glob("../assets_sync_final/embalagens/*.jpg")
    
    reais = {os.path.basename(p): normalize(os.path.basename(p).split('.')[0]) for p in reais_paths}
    embalagens = {os.path.basename(p): normalize(os.path.basename(p).split('.')[0]) for p in embalagens_paths}
    
    print(f"Encontrados {len(reais)} produtos reais e {len(embalagens)} embalagens.")

    print("Buscando produtos da tabela produtos_plataformas...")
    response = supabase.table("produtos_plataformas").select("id, title").execute()
    produtos = response.data
    
    updates = 0
    for prod in produtos:
        title_norm = normalize(prod["title"])
        
        # Encontrar melhor match para produto real
        matched_real = None
        for filename, norm_name in reais.items():
            if norm_name in title_norm or (len(norm_name)>4 and norm_name[:5] in title_norm):
                matched_real = filename
                break
                
        # Encontrar melhor match para embalagem
        matched_emb = None
        for filename, norm_name in embalagens.items():
            if norm_name in title_norm or (len(norm_name)>4 and norm_name[:5] in title_norm):
                matched_emb = filename
                break
        
        update_data = {}
        if matched_real:
            update_data["slug_imagem_real"] = matched_real.split('.')[0]
        if matched_emb:
            update_data["slug_embalagem"] = matched_emb.split('.')[0]
            
        if update_data:
            if matched_real:
                # Need to upsert into parent table 'produtos' first to satisfy foreign key
                supabase.table("produtos").upsert({
                    "slug_imagem_real": matched_real.split('.')[0],
                    "produto": prod["title"],
                    "slug_embalagem": matched_emb.split('.')[0] if matched_emb else None
                }).execute()

            supabase.table("produtos_plataformas").update(update_data).eq("id", prod["id"]).execute()
            updates += 1
            print(f"Atualizado {prod['title'][:30]} -> Real: {update_data.get('slug_imagem_real')} | Emb: {update_data.get('slug_embalagem')}")

    print(f"\nFinalizado! {updates} produtos atualizados com slugs de imagens.")

if __name__ == "__main__":
    main()
