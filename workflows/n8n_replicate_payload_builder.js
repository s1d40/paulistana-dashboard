return $input.all().map(item => {
  const body = item.json.body; // Pega o corpo que o dashboard enviou
  
  // 1. Extração básica dos dados do dashboard
  const id_post = body.id_post;
  const numero_cena = body.numero_cena;
  const replicateConfig = body.replicate; // Contém model_url e input (prompt, etc)
  const imageReferenceUrl = body.image_reference_url; // << CAMPO NOVO QUE ADICIONEI
  
  let model_url = replicateConfig.model_url;
  let inputReplicate = { ...replicateConfig.input };

  // 2. Injeção da Referência Visual
  if (imageReferenceUrl) {
    // O Replicate exige que image_input seja OBRIGATORIAMENTE um array
    inputReplicate.image_input = Array.isArray(imageReferenceUrl) 
      ? imageReferenceUrl 
      : [imageReferenceUrl];
  } else if (typeof inputReplicate.image_input === 'string') {
    // Caso a própria IA tenha gerado a referência solta (sem vir do painel)
    inputReplicate.image_input = [inputReplicate.image_input];
  } else if (!inputReplicate.image_input || inputReplicate.image_input.length === 0) {
    // Se não tem referência, removemos o campo para evitar erro no Replicate
    delete inputReplicate.image_input;
  }

  // 3. Monta o Output final para o próximo nó (HTTP Request da Replicate)
  return {
    json: {
      id_post: id_post,
      numero_cena: numero_cena,
      model_url: model_url,
      payload_replicate: {
        input: inputReplicate
      }
    }
  };
});
