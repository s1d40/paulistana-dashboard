import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/accounts
 * Lista contas da tabela contas no Supabase
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('contas')
      .select('id_conta, id_cliente, nicho, nome_conta, conta_id_instagram, conta_id_facebook, conta_id_threads');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ accounts: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
