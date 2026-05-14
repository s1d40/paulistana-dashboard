
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wolygamyyjgpoqsfefye.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbHlnYW15eWpncG9xc2ZlZnllIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM1NTQ0OSwiZXhwIjoyMDkzOTMxNDQ5fQ.lrjXQbm_y6DkSA_2CsFsoFbdWoKZGpHUAvGGSEd79bY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPost() {
  const id_post = '0ae17897-43a9-41e1-9c5f-03f0fe1f1bd7';
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id_post', id_post)
    .single();

  if (error) {
    console.error('Error fetching post:', error);
    return;
  }

  console.log('Post Data:', JSON.stringify(data, null, 2));
}

checkPost();
