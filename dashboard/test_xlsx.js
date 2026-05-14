/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');
const xlsx = require('xlsx');

const url = 'https://docs.google.com/spreadsheets/d/12JcGa9CuHtavgf0goY8yraYQ6kYuy8NCXsKPKmBWDdY/export?format=xlsx';

https.get(url, (res) => {
  if (res.statusCode === 302 || res.statusCode === 301) {
    https.get(res.headers.location, (res2) => {
      const chunks = [];
      res2.on('data', (chunk) => chunks.push(chunk));
      res2.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        console.log("Sheet names:");
        workbook.SheetNames.forEach(name => console.log(name));
      });
    });
  } else {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      console.log("Sheet names:");
      workbook.SheetNames.forEach(name => console.log(name));
    });
  }
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
