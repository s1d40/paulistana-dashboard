// Decide qual API e token usar para responder DMs do Instagram
// Depende de como a conta foi conectada ao painel
const row = $input.first().json;
const trigger = $('Execute Workflow Trigger').first().json;

const hasFbToken = row.facebook_access_token && row.conta_id_facebook;
const igToken = row.ig_access_token;

let apiBase, accessToken;

if (hasFbToken) {
  // Conta conectada via Facebook Login (fluxo antigo - ex: Codigo dos Signos)
  // Usa a Messenger Platform API do Facebook
  apiBase = 'https://graph.facebook.com/v21.0';
  accessToken = row.facebook_access_token;
} else if (igToken) {
  // Conta conectada via Instagram Business Login (fluxo novo - ex: sidnelson)
  // Usa a Instagram API diretamente
  apiBase = 'https://graph.instagram.com/v21.0';
  accessToken = igToken;
} else {
  throw new Error('Nenhum token válido encontrado para esta conta');
}

return {
  json: {
    sender_id: trigger.data.sender.id,
    message_text: trigger.data.message.text,
    nome_conta: row.nome_conta || 'a loja',
    api_base: apiBase,
    access_token: accessToken
  }
};
