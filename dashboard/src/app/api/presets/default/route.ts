import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // We assume the Next.js app is inside the 'dashboard' folder,
    // so we go one level up to find the markdown file.
    const filePath = path.join(process.cwd(), '..', 'prompt_agente_roteirista.md');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao ler arquivo' }, { status: 500 });
  }
}
