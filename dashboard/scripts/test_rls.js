require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFetch() {
  console.log("Fetching from production_lists using ANON KEY...");
  const { data, error } = await supabase
    .from('production_lists')
    .select('*');

  if (error) {
    console.error('Supabase Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Success! Data:', data);
  }
}

testFetch();