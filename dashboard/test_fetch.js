const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/var/www/painel.paulistanaemporio.com/.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '/home/sid/cocreator-n8n/dashboard/.env.local' });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('posts').select('roteiro_gerado, tipo_post').eq('id_post', '50ba2154-b42c-4dd3-ae7c-0a8388472b27').single();
  if (error) console.error(error);
  console.log(JSON.stringify(data, null, 2));
}
run();
