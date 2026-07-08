import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pages, longToken } = body;

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'Nenhuma página fornecida' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const insertPromises = pages.map(async (page: any) => {
      // Verifica se a conta já existe
      const { data: existing } = await supabaseAdmin
        .from('contas')
        .select('id_conta')
        .eq('conta_id_facebook', page.id)
        .single();

      if (existing) {
        // Atualiza tokens da conta existente
        return supabaseAdmin
          .from('contas')
          .update({
            nome: page.name,
            facebook_access_token: page.access_token || longToken,
            ig_access_token: page.access_token || longToken,
            conta_id_instagram: page.instagram_business_account?.id || null
          })
          .eq('id_conta', existing.id_conta);
      } else {
        // Cria nova conta
        return supabaseAdmin
          .from('contas')
          .insert({
            nome: page.name,
            conta_id_facebook: page.id,
            facebook_access_token: page.access_token || longToken,
            ig_access_token: page.access_token || longToken,
            conta_id_instagram: page.instagram_business_account?.id || null,
            status: 'Ativo'
          });
      }
    });

    await Promise.all(insertPromises);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Import Error:', err.message);
    return NextResponse.json({ error: 'Erro interno ao importar contas' }, { status: 500 });
  }
}
