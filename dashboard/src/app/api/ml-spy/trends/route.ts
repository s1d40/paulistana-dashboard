import { NextResponse } from 'next/server';

import { execSync } from 'child_process';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  if (!category) return NextResponse.json({ error: 'Missing category' }, { status: 400 });

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
      console.warn("Could not get token for trends");
    }

    const headers: Record<string, string> = {};
    if (mlToken) {
      headers['Authorization'] = `Bearer ${mlToken}`;
    }

    const res = await fetch(`https://api.mercadolibre.com/trends/MLB/${category}`, { headers });
    if (!res.ok) throw new Error('Falha ao buscar tendências do Mercado Livre');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
