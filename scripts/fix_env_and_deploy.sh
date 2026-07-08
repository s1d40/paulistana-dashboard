#!/bin/bash
set -e

# ==============================================================================
# Script de Correção do .env e Deploy - Cocreator Content Studio
# ==============================================================================

# Configurações do Servidor Remoto
REMOTE_USER="root"
REMOTE_HOST="204.168.214.139"
TARGET_DIR="/var/www/painel.paulistanaemporio.com"
PM2_ID="0"
REMOTE_NODE_PATH="/root/.nvm/versions/node/v20.20.2/bin"

# Diretórios Locais
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
DASHBOARD_DIR="$BASE_DIR/dashboard"

echo "======================================================================"
echo "🚀 INICIANDO CORREÇÃO DE VARIÁVEIS DE AMBIENTE E DEPLOY LIVE"
echo "======================================================================"
echo "Servidor Remoto:  $REMOTE_USER@$REMOTE_HOST"
echo "Diretório Remoto: $TARGET_DIR"
echo "PM2 ID Processo:  $PM2_ID"
echo "Diretório Local:  $DASHBOARD_DIR"
echo "======================================================================"

# 1. Copiar .env.local para o servidor de produção como .env
echo -e "\n🔑 1/3. Copiando .env.local local para o servidor como .env..."
if [ -f "$DASHBOARD_DIR/.env.local" ]; then
  scp "$DASHBOARD_DIR/.env.local" "$REMOTE_USER@$REMOTE_HOST:$TARGET_DIR/.env"
  echo "✅ Arquivo .env copiado com sucesso para o servidor remoto!"
else
  echo "❌ Erro: Arquivo .env.local não encontrado localmente em $DASHBOARD_DIR/.env.local!"
  exit 1
fi

# 2. Sincronizar arquivos compilados via rsync
echo -e "\n🔄 2/3. Sincronizando arquivos compilados do Next.js..."
rsync -avz --delete \
  --exclude="node_modules" \
  --exclude=".git" \
  --exclude=".env.local" \
  --exclude=".env" \
  --exclude="console.log" \
  --exclude="frontend.log" \
  --exclude="credentials/" \
  --exclude="*.secret" \
  --exclude="local_storage/" \
  -e "ssh" \
  "$DASHBOARD_DIR/" "$REMOTE_USER@$REMOTE_HOST:$TARGET_DIR/"
echo "✅ Sincronização de arquivos concluída!"

# 3. Rodar npm install e reload PM2 no servidor
echo -e "\n⚡ 3/3. Instalando dependências de produção e recarregando PM2..."
ssh "$REMOTE_USER@$REMOTE_HOST" "
  export PATH=\"$REMOTE_NODE_PATH:\$PATH\"
  cd \"$TARGET_DIR\"
  
  echo '⬇️ Instalando dependências de produção (se houver)...'
  npm install --production --no-audit --no-fund
  
  echo '🔄 Recarregando processo PM2 $PM2_ID para aplicar as novas variáveis de ambiente (.env)...'
  pm2 reload $PM2_ID --update-env || pm2 restart $PM2_ID --update-env
  
  echo '📈 Status atual do PM2:'
  pm2 show $PM2_ID | grep -E 'status|uptime|mem'
"

echo "======================================================================"
echo "🎉 TUDO PRONTO! CORREÇÃO E DEPLOY CONCLUÍDOS COM SUCESSO!"
echo "======================================================================"
