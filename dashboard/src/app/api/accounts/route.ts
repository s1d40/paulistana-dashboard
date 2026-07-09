import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/accounts
 * Lista contas do usuário logado (filtra por id_cliente vinculado ao auth_user_id)
 */
export async function GET() {
  try {
    const session = await auth();
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userEmail = session?.user?.email?.toLowerCase() || '';

    // Membros da equipe principal veem TODAS as contas (workspace compartilhado)
    const teamEmails = (process.env.AUTHORIZED_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const isTeamMember = userEmail && teamEmails.includes(userEmail);

    if (isTeamMember) {
      const { data, error } = await supabaseAdmin
        .from('contas')
        .select('id_conta, id_cliente, nicho, nome_conta, conta_id_instagram, conta_id_facebook, conta_id_threads, ig_access_token, facebook_access_token');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ accounts: data || [] });
    }

    // Usuários externos: buscar o cliente vinculado ao usuário logado
    let clienteFilter: string | null = null;

    if (userEmail) {
      const { data: cliente } = await supabaseAdmin
        .from('clientes')
        .select('id_cliente')
        .eq('email', userEmail)
        .single();

      if (cliente) {
        clienteFilter = cliente.id_cliente;
      }
    }

    // Fallback: tenta pelo auth_user_id
    if (!clienteFilter && session?.user?.id) {
      const { data: cliente } = await supabaseAdmin
        .from('clientes')
        .select('id_cliente')
        .eq('auth_user_id', session.user.id)
        .single();

      if (cliente) {
        clienteFilter = cliente.id_cliente;
      }
    }

    // Se não encontrou nenhum cliente vinculado, retorna lista vazia
    if (!clienteFilter) {
      return NextResponse.json({ accounts: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('contas')
      .select('id_conta, id_cliente, nicho, nome_conta, conta_id_instagram, conta_id_facebook, conta_id_threads, ig_access_token, facebook_access_token')
      .eq('id_cliente', clienteFilter);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ accounts: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
