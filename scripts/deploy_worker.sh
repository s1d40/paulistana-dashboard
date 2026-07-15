#!/bin/bash

# Sair imediatamente se algum comando falhar
set -e

# Configurações do Servidor Remoto Dedicado (Worker)
REMOTE_USER="root"
REMOTE_HOST="204.168.142.231"
PM2_ID="video_worker_cx53"
TARGET_SCRIPTS_DIR="/var/www/scripts"

# Diretórios Locais
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================================================"
echo "🚀 INICIANDO DEPLOY DO WORKER DEDICADO"
echo "======================================================================"
echo "Servidor Remoto:  $REMOTE_USER@$REMOTE_HOST"
echo "Diretório Remoto: $TARGET_SCRIPTS_DIR"
echo "PM2 ID Processo:  $PM2_ID"
echo "======================================================================"

echo -e "\n🔄 1/2. Enviando arquivos de scripts para o servidor do worker..."
rsync -avz --delete \
  --exclude="venv" \
  --exclude="worker_venv" \
  --exclude="__pycache__" \
  --exclude=".git" \
  --exclude=".env" \
  --exclude=".env.local" \
  -e "ssh" \
  "$SCRIPT_DIR/" "$REMOTE_USER@$REMOTE_HOST:$TARGET_SCRIPTS_DIR/"

echo "✅ Sincronização de arquivos concluída!"

echo -e "\n🔄 2/2. Recarregando PM2 ID $PM2_ID no servidor dedicado..."
ssh "$REMOTE_USER@$REMOTE_HOST" "
  cd \"$TARGET_SCRIPTS_DIR\"
  
  echo '⬇️ Instalando novas dependências Python (se houver)...'
  if [ ! -d \"worker_venv\" ]; then
    python3 -m venv worker_venv
  fi
  source worker_venv/bin/activate
  pip install -r requirements.txt || pip install requests python-dotenv supabase replicate google-cloud-storage
  
  echo '🔄 Reiniciando o processo do Worker no PM2...'
  pm2 restart $PM2_ID
  
  echo '📈 Status atual do PM2:'
  pm2 show $PM2_ID | grep -E 'status|uptime|mem'
"

echo "======================================================================"
echo "🎉 DEPLOY DO WORKER CONCLUÍDO COM SUCESSO!"
echo "======================================================================"
