const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function check() {
  const { data, error } = await s.from('contas').select('id_conta, nome_conta, conta_id_instagram, conta_id_facebook');
  if (error) { console.error('Error:', error.message); return; }
  console.log('Contas no banco:');
  data?.forEach(c => {
    console.log('  -', c.nome_conta, '| IG ID:', c.conta_id_instagram, '| FB ID:', c.conta_id_facebook);
  });
  console.log('\nWebhook recipient.id: 17841415762205405');
  const match = data?.find(c => c.conta_id_instagram === '17841415762205405');
  console.log('Match:', match ? 'SIM' : 'NAO - IDs nao batem!');
}
check();
