import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contaId = params.id;

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verificar se o usuário é da equipe ou dono da conta
  const authorizedEmails = (process.env.AUTHORIZED_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const isTeam = authorizedEmails.includes(session.user.email.toLowerCase());

  if (!isTeam) {
    // Verificar se o usuário é dono da conta
    const { data: cliente } = await supabaseAdmin
      .from('clientes')
      .select('id_cliente')
      .eq('email', session.user.email)
      .single();

    if (!cliente) {
      return NextResponse.json({ error: 'Client not found' }, { status: 403 });
    }

    const { data: conta } = await supabaseAdmin
      .from('contas')
      .select('id_cliente')
      .eq('id_conta', contaId)
      .single();

    if (!conta || conta.id_cliente !== cliente.id_cliente) {
      return NextResponse.json({ error: 'Not authorized to delete this account' }, { status: 403 });
    }
  }

  // Remover a conta (ou apenas limpar os tokens)
  const { error } = await supabaseAdmin
    .from('contas')
    .delete()
    .eq('id_conta', contaId);

  if (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
