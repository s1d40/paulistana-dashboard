import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { pages, longToken } = body;

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: 'Nenhuma página fornecida' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Buscar o id_cliente do usuário logado
    let idCliente: string | null = null;

    if (session?.user?.email) {
      const { data: cliente } = await supabaseAdmin
        .from('clientes')
        .select('id_cliente')
        .eq('email', session.user.email)
        .single();

      if (cliente) {
        idCliente = cliente.id_cliente;
      }
    }

    // Fallback pelo auth_user_id
    if (!idCliente && session?.user?.id) {
      const { data: cliente } = await supabaseAdmin
        .from('clientes')
        .select('id_cliente')
        .eq('auth_user_id', session.user.id)
        .single();

      if (cliente) {
        idCliente = cliente.id_cliente;
      }
    }

    if (!idCliente) {
      return NextResponse.json({ error: 'Usuário não possui um perfil de cliente vinculado.' }, { status: 403 });
    }

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
            nome_conta: page.name,
            facebook_access_token: page.access_token || longToken,
            ig_access_token: page.access_token || longToken,
            conta_id_instagram: page.instagram_business_account?.id || null,
            id_cliente: idCliente, // Vincular ao usuário logado
          })
          .eq('id_conta', existing.id_conta);
      } else {
        // Cria nova conta vinculada ao usuário logado
        return supabaseAdmin
          .from('contas')
          .insert({
            nome_conta: page.name,
            nicho: page.category || 'Geral',
            conta_id_facebook: page.id,
            facebook_access_token: page.access_token || longToken,
            ig_access_token: page.access_token || longToken,
            conta_id_instagram: page.instagram_business_account?.id || null,
            id_cliente: idCliente, // Vincular ao usuário logado
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
