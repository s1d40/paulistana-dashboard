import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const { title, price } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Título do produto é obrigatório.' }, { status: 400 });
    }

    const supabase = await createClient();
    const slug = generateSlug(title);

    // Inserir na tabela 'produtos' (se houver, usamos 'produto' como titulo)
    const { error: err1 } = await supabase
      .from('produtos')
      .insert([{
        produto: title,
        slug_imagem_real: null, // Ainda não tem imagem
        slug_embalagem: null,
      }]);

    if (err1 && err1.code !== '23505') { // Ignorar erro de duplicidade se já existir
      console.warn("Insert produtos warning:", err1);
    }

    // Inserir na tabela 'produtos_plataformas' para aparecer no Inventário Central
    const { error: err2 } = await supabase
      .from('produtos_plataformas')
      .insert([{
        title: title,
        price: price ? parseFloat(price) : 0,
        platform: 'manual', // Definimos como 'manual' pra distinguir
        slug_imagem_real: null,
        slug_embalagem: null,
        permalink: '#'
      }]);

    if (err2) {
      console.error("Insert produtos_plataformas error:", err2);
      return NextResponse.json({ error: 'Erro ao criar produto no banco de dados.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, title, slug });
  } catch (error) {
    console.error('Create Product Error:', error);
    return NextResponse.json({ error: 'Falha interna ao criar produto.' }, { status: 500 });
  }
}
