/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');
const url = 'https://docs.google.com/spreadsheets/d/12JcGa9CuHtavgf0goY8yraYQ6kYuy8NCXsKPKmBWDdY/edit';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const matches = [...data.matchAll(/\["([^"]+)",(\d+)\]/g)];
    const gids = {};
    matches.forEach(m => {
        gids[m[1]] = m[2];
    });
    console.log("Found GIDs mapping:", JSON.stringify(gids, null, 2));
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
