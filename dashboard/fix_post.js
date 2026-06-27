require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fixPost() {
  const postId = '8675394b-1ead-428e-91ff-949da914c507';
  console.log(`Fetching post ${postId}...`);
  
  const getRes = await fetch(`${supabaseUrl}/rest/v1/posts?id_post=eq.${postId}&select=roteiro_gerado`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  
  const data = await getRes.json();
  const script = data[0]?.roteiro_gerado;
  
  if (!script) {
    console.log('No script found.');
    return;
  }

  console.log('Current keys in script:', Object.keys(script));
  
  // Apply fix
  script.tipo_post = 'video';
  script.tema = script.tema || 'Tema Recuperado Automaticamente';
  script.titulo_otimizado = script.titulo_otimizado || 'Título Recuperado';

  console.log('Updating post with fixed script...');
  const patchRes = await fetch(`${supabaseUrl}/rest/v1/posts?id_post=eq.${postId}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ roteiro_gerado: script })
  });

  if (!patchRes.ok) {
    const updateError = await patchRes.json();
    console.error('Error updating post:', updateError);
  } else {
    console.log('Post fixed successfully!');
  }
}

fixPost();
