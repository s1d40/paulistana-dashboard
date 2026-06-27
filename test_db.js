const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './dashboard/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('ml_competitor_history').select('*').limit(5);
  console.log(data, error);
}
run();
