import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fix() {
  const { data: res1 } = await supabase.from('posts').update({ status: 'Aguardando' }).eq('status', 'Processando').select();
  const { data: res2 } = await supabase.from('posts').update({ status: 'Aguardando' }).eq('status', 'Produzir').select();
  const { data: res3 } = await supabase.from('posts').update({ status: 'Aguardando' }).eq('status', 'Processando Roteiro').select();
  console.log("Destravados:", res1?.length, res2?.length, res3?.length);
}
fix();
