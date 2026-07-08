import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('produtos_plataformas')
    .select('id, title, slug_imagem_real, slug_embalagem')
    .ilike('title', '%beterraba%');

  console.log('Plataformas:', data);

  const { data: prodData } = await supabase
    .from('produtos')
    .select('id, produto, slug_imagem_real, slug_embalagem')
    .ilike('produto', '%beterraba%');

  console.log('Produtos:', prodData);
}

run();
