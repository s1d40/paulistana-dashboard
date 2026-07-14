// ============================================================
// NÓ: Preparar Dados
// Workflow: Publicar no Instagram (Dual API)
// 
// INPUT: Recebe dados do nó Postgres "Buscar Conta"
//        que faz merge com o webhook original
//
// POSTGRES QUERY (nó anterior):
// SELECT conta_id_instagram, ig_access_token, facebook_access_token 
// FROM contas WHERE id_conta = '{{ $('Webhook Publicar IG').item.json.body.id_conta }}'
// ============================================================

// Dados do webhook (body)
const webhook = $('Webhook Publicar IG').first().json;
const input = webhook.body || webhook;

// Dados da conta (vindo do Postgres)
const conta = $input.first().json;

// Montar caption com hashtags
let caption = input.metadata?.captions || input.metadata?.title || '';
const hashtags = input.metadata?.hashtags || '';
if (hashtags) {
  caption = caption.trim() + '\n\n' + hashtags.trim();
}

// Determinar API base e token pela presença de facebook_access_token
const isDirectIG = !conta.facebook_access_token;
const apiBase = isDirectIG ? 'https://graph.instagram.com' : 'https://graph.facebook.com';
const accessToken = isDirectIG 
  ? conta.ig_access_token 
  : (conta.facebook_access_token || conta.ig_access_token);
const igAccountId = conta.conta_id_instagram || '';
const videoUrl = input.metadata?.video_url || '';
const postId = input.id_post || '';
const authType = isDirectIG ? 'instagram_direct' : 'facebook';

if (!accessToken || !igAccountId || !videoUrl) {
  throw new Error(`Dados incompletos: token=${!!accessToken}, igId=${!!igAccountId}, video=${!!videoUrl}`);
}

console.log(`[Publish] ${authType} | API: ${apiBase} | IG: ${igAccountId}`);
console.log(`[Publish] Video: ${videoUrl.substring(0, 80)}...`);
console.log(`[Publish] Caption: ${caption.substring(0, 60)}...`);

return [{
  json: {
    apiBase,
    accessToken,
    igAccountId,
    videoUrl,
    caption,
    postId,
    authType,
    containerUrl: `${apiBase}/v21.0/${igAccountId}/media`,
    publishUrl: `${apiBase}/v21.0/${igAccountId}/media_publish`
  }
}];
