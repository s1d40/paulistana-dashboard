import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Fetching from produtos_plataformas with join...");
  const { data, error } = await supabase
    .from('produtos_plataformas')
    .select('title, slug_embalagem, slug_imagem_real, produtos(restricao_narrativa, restricao_visual)')
    .limit(3);
  console.log(JSON.stringify(data, null, 2));
}

run();
