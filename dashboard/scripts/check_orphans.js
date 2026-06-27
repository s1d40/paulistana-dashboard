const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: presets, error: pErr } = await supabase.from('content_presets').select('id, created_at, name');
  if (pErr) { console.error('Presets Error:', pErr); return; }
  
  const { data: posts, error: postErr } = await supabase.from('posts').select('id_post, data_criacao');
  if (postErr) { console.error('Posts Error:', postErr); return; }

  const postIds = new Set(posts.map(p => p.id_post));
  
  const orphans = presets.filter(p => !postIds.has(p.id) && p.name.startsWith('Draft:'));
  console.log(`Total presets: ${presets.length}`);
  console.log(`Total posts: ${posts.length}`);
  console.log(`Orphaned draft presets: ${orphans.length}`);
  
  if (orphans.length > 0) {
    console.log('Sample orphans:', orphans.slice(0, 5));
  }
}
check();
