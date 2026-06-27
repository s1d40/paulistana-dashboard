import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function GET() {
  try {
    let mlToken = '';
    try {
      const scriptPath = path.join(process.cwd(), '../scripts/mercado_livre');
      mlToken = execSync('source venv/bin/activate && python print_token.py', { 
        cwd: scriptPath, 
        encoding: 'utf-8',
        stdio: 'pipe',
        shell: '/bin/bash'
      }).trim();
    } catch (e) {
      console.warn("Could not get token for categories");
    }

    const headers: Record<string, string> = {};
    if (mlToken) {
      headers['Authorization'] = `Bearer ${mlToken}`;
    }

    const res = await fetch('https://api.mercadolibre.com/sites/MLB/categories', { headers });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
