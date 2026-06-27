require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPreset() {
  const { data, error } = await supabase
    .from('content_presets')
    .select('id, name, description, created_at')
    .ilike('name', '%SIGNOS%');

  if (error) {
    console.error('Error querying:', error);
  } else {
    console.log('Presets found:', JSON.stringify(data, null, 2));
  }
}

checkPreset();