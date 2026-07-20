# 🎯 Task: Fix Mercado Livre Intelligence System — Search Endpoint Deprecated

## Context

The Mercado Livre API has **permanently restricted** the `/sites/MLB/search` endpoint for all developers (anti-scraping policy). This breaks the entire ML intelligence/spy system in our dashboard.

**Account**: `PAULISTANA_EMPORIO` (seller_id: `428354884`, Seller Level 5 🟢, 131 active items)  
**New App**: Client ID `142664587035758` — OAuth authorized and working  
**Token**: saved at `/scripts/mercado_livre/ml_tokens.json` (auto-refreshed by `print_token.py`)

---

## API Endpoint Status (Tested 2026-07-20)

### ✅ WORKING Endpoints
```bash
# 1. Own items listing
GET /users/428354884/items/search?status=active&limit=100
# Returns: { results: ["MLB123", "MLB456", ...], paging: { total: 131 } }

# 2. Item details (single)
GET /items/MLB3648682563
# Returns: full item object with catalog_product_id, price, title, etc.

# 3. Item details (batch — up to 20)
GET /items?ids=MLB123,MLB456,MLB789
# Returns: [{ body: { id, title, price, catalog_product_id, ... } }]

# 4. Catalog product details
GET /products/MLB36563426
# Returns: { name, buy_box_winner, pictures, attributes, ... }

# 5. Catalog product competitors (KEY REPLACEMENT for search!)
GET /products/MLB36563426/items?limit=50
# Returns: { results: [{ item_id, price, seller_id, ... }], paging: { total: N } }

# 6. Highlights (top sellers by category)
GET /highlights/MLB/category/MLB1403
# Returns: { content: [{ id: "MLB18405804", type: "PRODUCT" }, ...] } (19 products)

# 7. Trends
GET /trends/MLB
# Returns: [{ keyword: "tenis feminino" }, ...]

# 8. Category trends
GET /trends/MLB/MLB1403
# Returns: trending keywords in specific category

# 9. Categories list
GET /sites/MLB/categories
# Returns: [{ id: "MLB1403", name: "Alimentos e Bebidas" }, ...]

# 10. Reviews
GET /reviews/item/MLB3648682563
# Returns: { paging: { total: 2 }, rating_average: 4 }

# 11. Item visits
GET /items/MLB3648682563/visits/time_window?last=7&unit=day
# Returns: { total_visits: 0, results: [...] }

# 12. Item description
GET /items/MLB3648682563/description
# Returns: { plain_text: "..." }

# 13. Item health
GET /items/MLB3648682563/health
# Returns: health score data

# 14. User info
GET /users/me
# Returns: nickname, email, seller_reputation, etc.
```

### ❌ BLOCKED Endpoints (403 Forbidden)
```bash
# Generic search — THE ONE THAT BREAKS EVERYTHING
GET /sites/MLB/search?q=tempero&limit=50
# Returns: { "message": "forbidden", "error": "forbidden", "status": 403 }
```

**All requests require**: `Authorization: Bearer {token}` header

---

## Files That Need Changes

### Project Structure
```
dashboard/src/app/api/
├── ml-spy/                    # Main intelligence tool
│   ├── route.ts               # ❌ BROKEN — uses sites/MLB/search for term queries
│   ├── analyze/route.ts       # ✅ OK — uses /items/{id} directly
│   ├── cache/route.ts         # ✅ OK — reads CSV
│   ├── categories/route.ts    # ✅ OK — uses /sites/MLB/categories
│   ├── funnel/route.ts        # ✅ OK — uses /users/{id}/items/search (own items)
│   ├── my-items/route.ts      # ✅ OK — uses /users/me + /users/{id}/items/search
│   ├── reviews/route.ts       # ✅ OK — uses /reviews/item/{id}
│   ├── trends/route.ts        # ✅ OK — uses /trends/MLB/{cat}
│   ├── trends-suggestions/    # ⚠️ CHECK — may use search
│   └── watchlist/route.ts     # ✅ OK — uses /items?ids=
├── concorrencia/
│   ├── auto-discover/route.ts # ❌ BROKEN — uses sites/MLB/search (PARTIALLY FIXED, see below)
│   ├── sync/route.ts          # ✅ OK — uses /items/{mlbId} directly
│   └── ml-item/route.ts       # ✅ OK — uses /items/{id} directly
├── ml-token/route.ts          # ✅ OK — gets token via Python
└── ml-sniper/route.ts         # ⚠️ CHECK — may use search
```

### Scripts
```
scripts/
├── sync_prices.js             # Cron (PM2, 02:00 AM) — calls auto-discover + sync via HTTP
├── mercado_livre/
│   ├── snapshot_ranking.py    # ❌ BROKEN — calls /api/ml-spy which uses search
│   ├── snapshot_sniper.py     # ⚠️ CHECK
│   ├── score_oportunidade.py  # ⚠️ CHECK
│   ├── auth.py                # ✅ OK
│   ├── config.py              # ✅ OK
│   └── print_token.py         # ✅ OK — used by all routes to get fresh token
```

---

## Detailed Changes Required

### 1. `ml-spy/route.ts` (Main spy tool) — HIGH PRIORITY

**Current behavior**: When user searches by term, it calls `sites/MLB/search?q={term}` → 403  
**When searching by category only**: Uses `/highlights/MLB/category/{cat}` → ✅ Works

**Required fix for term search**:  
Replace the search-by-term flow (lines 50-128) with:
1. Get all our own items via `/users/428354884/items/search?status=active`
2. Get details via `/items?ids=...` batch calls (20 at a time)
3. Filter items whose `title` matches the search term (fuzzy/includes match)
4. For each matching item with a `catalog_product_id`, call `/products/{catalogId}/items` to find competitors
5. Get competitor details via `/items?ids=...` batch
6. Enrich with reviews from `/reviews/item/{id}`
7. Return the same response format as before

**Alternative approach**: If the term doesn't match our own items, use the **highlights** endpoint for the category and expand via catalog.

**Important**: The response format MUST stay the same (the frontend `mercado-livre/page.tsx` and `concorrencia/page.tsx` consume this).

### 2. `concorrencia/auto-discover/route.ts` — HIGH PRIORITY

**I already started a fix** in the current codebase. The new version:
- Gets all André's items → batch `/items?ids=` to get `catalog_product_id`
- For each cataloged item → `/products/{catalogId}/items` to find competitors
- Saves to `tracked_products` + `competitor_ads` + `price_history` in Supabase

**Status**: The rewrite is already in the file. Review and test it.

### 3. `snapshot_ranking.py` — MEDIUM PRIORITY

**Current**: Calls `/api/ml-spy?category={cat}` which falls back to highlights  
**Fix**: This might actually work if the ml-spy highlights path is intact. Test it after fixing ml-spy.

### 4. `ml-sniper/route.ts` — CHECK

Read this file and check if it uses `/sites/MLB/search`. If so, apply the same catalog-based approach.

### 5. `trends-suggestions/route.ts` — CHECK

Line 46 uses `/users/{SELLER_ID}/items/search` which is fine (own items). But verify the full flow.

---

## Our Product Categories (for reference)

These are the categories our store operates in — useful for highlights calls:
```
MLB247521  — Chás e Ervas
MLB269723  — Frutas Secas e Desidratadas
MLB272151  — Castanhas e Amendoins
MLB269724  — Sementes (Chia, Linhaça, etc)
MLB271071  — Snacks Salgados
MLB439587  — Açúcar e Adoçantes Naturais
MLB1403    — Alimentos e Bebidas (parent)
```

---

## Token Management

The token system is already working:
1. `scripts/mercado_livre/print_token.py` reads `ml_tokens.json`, checks expiry, auto-refreshes via `auth.py`
2. All API routes call this Python script via `execSync` to get a fresh token
3. Token expires every 6 hours, refresh_token is single-use

**Do NOT change the token management system.**

---

## Database Tables (Supabase)

```sql
-- Competitors tracking
tracked_products (id, name, created_at)
competitor_ads (id, product_id FK→tracked_products, title, url, ml_id, seller_name)
price_history (id, ad_id FK→competitor_ads, price, captured_at)

-- Ranking snapshots
ml_competitor_history (category_id, product_id, title, price, rank, thumbnail, permalink, snapshot_date)
```

---

## How to Test

```bash
# From the production server (204.168.214.139):
ssh root@204.168.214.139

# Get token
export TOKEN=$(python3 -c "import json; print(json.load(open('/var/www/scripts/mercado_livre/ml_tokens.json'))['access_token'])")

# Test catalog discovery
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.mercadolibre.com/products/MLB36563426/items?limit=5" | python3 -m json.tool

# Test highlights
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.mercadolibre.com/highlights/MLB/category/MLB1403" | python3 -m json.tool

# After deploying, test the routes:
curl -s "https://painel.paulistanaemporio.com/api/ml-spy?category=MLB1403&limit=5"
curl -s -X POST "https://painel.paulistanaemporio.com/api/concorrencia/auto-discover"
```

---

## Deploy

After all changes:
```bash
bash /home/sid/cocreator-n8n/scripts/deploy_live.sh
```

This builds locally, rsyncs to production, and reloads PM2.

---

## Summary of Strategy

**OLD**: `sites/MLB/search?q=term` → get competitors by keyword  
**NEW**: Own items → `catalog_product_id` → `/products/{id}/items` → real competitors of the same product

This is actually **more accurate** because it finds competitors selling the exact same cataloged product, not just similar keywords.
