const gids = ['1038454023', '1311161084', '729253016', '927613935'];
const urlBase = 'https://docs.google.com/spreadsheets/d/12JcGa9CuHtavgf0goY8yraYQ6kYuy8NCXsKPKmBWDdY/export?format=csv&gid=';

async function test() {
  for (const gid of gids) {
    try {
      const response = await fetch(urlBase + gid);
      const text = await response.text();
      console.log(`GID: ${gid}`);
      console.log(`Headers: ${text.split('\n')[0]}`);
    } catch (err) {
      console.error(err);
    }
  }
}
test();
