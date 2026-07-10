import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';

/**
 * DELETE /api/accounts/bulk-delete
 * Remove TODAS as contas vinculadas ao cliente do usuário logado.
 * Também remove posts vinculados (FK constraint).
 */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Buscar id_cliente do usuário
  const { data: cliente } = await supabaseAdmin
    .from('clientes')
    .select('id_cliente')
    .eq('email', session.user.email)
    .single();

  // Fallback: buscar por auth_user_id
  let idCliente = cliente?.id_cliente;
  if (!idCliente && session.user.id) {
    const { data: c2 } = await supabaseAdmin
      .from('clientes')
      .select('id_cliente')
      .eq('auth_user_id', session.user.id)
      .single();
    idCliente = c2?.id_cliente;
  }

  if (!idCliente) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 403 });
  }

  // 1. Buscar todas as contas desse cliente
  const { data: contas } = await supabaseAdmin
    .from('contas')
    .select('id_conta')
    .eq('id_cliente', idCliente);

  if (!contas || contas.length === 0) {
    return NextResponse.json({ message: 'Nenhuma conta encontrada', deleted: 0 });
  }

  // 2. Deletar posts vinculados (respeitar FK constraint)
  for (const conta of contas) {
    await supabaseAdmin.from('posts').delete().eq('id_conta', conta.id_conta);
  }

  // 3. Deletar todas as contas
  const { error } = await supabaseAdmin
    .from('contas')
    .delete()
    .eq('id_cliente', idCliente);

  if (error) {
    console.error('[Bulk Delete] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`✅ Bulk delete: ${contas.length} contas removidas para cliente ${idCliente}`);
  return NextResponse.json({ success: true, deleted: contas.length });
}
