import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function GET() {
  try {
    const scriptPath = path.join(process.cwd(), '../scripts/mercado_livre');
    const mlToken = execSync('source venv/bin/activate && python print_token.py', { 
      cwd: scriptPath, 
      encoding: 'utf-8',
      stdio: 'pipe',
      shell: '/bin/bash'
    }).trim();

    return NextResponse.json({ token: mlToken });
  } catch (error: any) {
    console.error("ML Token API Error:", error);
    return NextResponse.json({ error: 'Failed to get token' }, { status: 500 });
  }
}
