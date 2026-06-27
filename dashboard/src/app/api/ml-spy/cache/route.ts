import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'Mapeamento_MercadoLivre_Paulistana.csv');
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ results: [] });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      // Basic CSV parsing handling quotes
      const match = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (!match) continue;
      
      const obj: any = {};
      const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      
      headers.forEach((h, index) => {
        let val = values[index] || '';
        val = val.replace(/^"|"$/g, '').replace(/""/g, '"');
        obj[h] = val;
      });
      results.push(obj);
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Cache API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
