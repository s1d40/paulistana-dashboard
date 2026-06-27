async function run() {
  const res = await fetch('https://api.mercadolibre.com/items/MLB3623912061');
  const data = await res.json();
  console.log(data);
}
run();
