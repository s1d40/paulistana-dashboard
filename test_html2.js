async function test() {
  const res = await fetch('https://produto.mercadolivre.com.br/MLB-3778386957', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();
  console.log("Status:", res.status);
  
  const descMatch = html.match(/<p class="ui-pdp-description__content">([\s\S]*?)<\/p>/);
  if (descMatch) {
    console.log("Desc found length:", descMatch[1].length);
  } else {
    console.log("Desc not found");
  }
}

test();
