require('dotenv').config({ path: '/home/sid/cocreator-n8n/dashboard/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('content_presets').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total presets:', data.length);
    data.forEach(p => console.log(`- ${p.name} (is_draft: ${p.config?.is_draft})`));
  }
}
main();
