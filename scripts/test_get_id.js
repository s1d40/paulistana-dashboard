const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'dashboard', '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getValidId() {
  const { data, error } = await supabase.from('posts').select('id_post').limit(1);
  if (error) {
    console.error('Error:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('VALID_ID:' + data[0].id_post);
  } else {
    console.log('NO_POSTS_FOUND');
  }
}

getValidId();
