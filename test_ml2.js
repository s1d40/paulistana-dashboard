const { execSync } = require('child_process');
const path = require('path');

async function testML() {
  const term = "castanha de caju";
  const category = "MLB1403";
  const limit = 10;
  
  let mlToken = '';
  try {
    const scriptPath = path.join(process.cwd(), 'scripts/mercado_livre');
    mlToken = execSync('source venv/bin/activate && python print_token.py', { 
      cwd: scriptPath, 
      encoding: 'utf-8',
      shell: '/bin/bash'
    }).trim();
    console.log("Token:", mlToken.substring(0, 15) + "...");
  } catch (e) {
    console.error("Token error");
    return;
  }

  const headers = { 'Authorization': `Bearer ${mlToken}` };
  
  const searchRes = await fetch(`https://api.mercadolibre.com/products/search?status=active&site_id=MLB&q=${encodeURIComponent(term)}&category_id=${category}&limit=50`, { headers });
  const searchData = await searchRes.json();
  
  const topProducts = searchData.results || [];
  console.log(`Found ${topProducts.length} catalog products`);
  
  let finalResults = [];
  for (const prod of topProducts) {
    const pItemsRes = await fetch(`https://api.mercadolibre.com/products/${prod.id}/items`, { headers });
    const pItemsData = await pItemsRes.json();
    
    if (pItemsData.results) {
      console.log(`Product ${prod.id} has ${pItemsData.results.length} items`);
      for (const item of pItemsData.results) {
        if (item.status !== 'active' || !item.price) continue;
        
        const catRes = await fetch(`https://api.mercadolibre.com/categories/${item.category_id}`, { headers });
        const catData = await catRes.json();
        const pathArr = catData.path_from_root?.map(p => p.id) || [];
        
        console.log(`Item ${item.item_id} Category ${item.category_id} Path:`, pathArr);
        if (!pathArr.includes(category)) {
          console.log(`Item ${item.item_id} Category ${item.category_id} Path: ${pathArr}`);
          continue;
        }
        
        finalResults.push(item);
      }
    }
  }
  
  console.log(`Final results: ${finalResults.length}`);
}

testML();
