Você precisará acessar o seu servidor Hetzner e adicionar uma variável de ambiente na configuração do Docker do n8n para criar uma "lista de permissões" (whitelist).

Acesse seu servidor Hetzner via SSH.

Abra o arquivo .env onde o seu n8n está configurado (geralmente na pasta do docker-compose).

Adicione a seguinte linha:

Snippet de código
N8N_ENV_VARS_ALLOW_ACCESS="NEXT_PUBLIC_SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY"