from supabase_client import supabase

def run():
    print("Deleting mock data...")
    res = supabase.table('ml_competitor_history').delete().like('product_id', 'MLB000000%').execute()
    print("Deleted:", res)

run()
