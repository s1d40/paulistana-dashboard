require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
  const postId = 'e0667b80-bfab-401c-b02e-fe2cff9d0540';

  console.log(`Diagnosing Post ID: ${postId}`);

  const { data: post } = await supabase.from('posts').select('roteiro_gerado').eq('id_post', postId).single();
  let script = typeof post?.roteiro_gerado === 'string' ? JSON.parse(post.roteiro_gerado) : post?.roteiro_gerado;
  console.log(`--- SCENES IN SCRIPT ---`);
  script?.cenas?.forEach(c => console.log(`Cena ${c.numero} | id_cena: ${c.id_cena}`));

  const { data: images } = await supabase.from('imagens').select('numero_cena, id_cena, image_url, url_imagem_fundo').eq('id_post', postId);
  console.log(`\n--- IMAGES IN DB ---`);
  console.log(images);

  const { data: audios } = await supabase.from('audios').select('numero_cena, id_cena, audio_url').eq('id_post', postId);
  console.log(`\n--- AUDIOS IN DB ---`);
  console.log(audios);
}

diagnose();