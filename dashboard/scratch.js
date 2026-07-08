const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length > 1) {
    env[parts[0]] = parts.slice(1).join('=').trim().replace(/['"]/g, '');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: p, error: e1 } = await supabase.from('produtos').select('*').limit(1);
  console.log('produtos:', p || e1);
  
  const { data: pp, error: e2 } = await supabase.from('produtos_plataformas').select('*').limit(1);
  console.log('produtos_plataformas:', pp || e2);
}

run();
