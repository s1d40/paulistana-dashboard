async function run() {
  try {
    const res = await fetch('https://produto.mercadolivre.com.br/MLB-3623912061-mix-de-vegetais-desidratados-1kg-_JM', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    console.log("Status:", res.status);
    const html = await res.text();
    // Look for price meta tags
    const priceMeta = html.match(/<meta itemprop="price" content="([^"]+)"/);
    if (priceMeta) {
      console.log("Found Price:", priceMeta[1]);
    } else {
      console.log("Price meta not found. HTML snippet:");
      console.log(html.substring(0, 500));
    }
  } catch(e) {
    console.log("Error:", e);
  }
}
run();
