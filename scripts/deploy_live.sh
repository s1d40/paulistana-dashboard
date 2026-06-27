#!/bin/bash

# ==============================================================================
# Script de Deploy e Sincronização - Cocreator Content Studio (Next.js)
# ==============================================================================
# Este script realiza o build de produção local do Next.js e sincroniza os
# arquivos compilados com o servidor live (root@62.238.22.162),
# preservando as configurações e arquivos do WordPress (WordOps) e reiniciando
# o frontend via PM2.
# ==============================================================================

# Sair imediatamente se algum comando falhar
set -e

# Configurações do Servidor Remoto
REMOTE_USER="root"
REMOTE_HOST="62.238.22.162"
PM2_ID="0"
REMOTE_NODE_PATH="/root/.nvm/versions/node/v20.20.2/bin"

# DIRETÓRIO DE DESTINO (CWD do PM2 no Servidor)
# TODO: Substitua pelo diretório absoluto que você obteve executando:
# ssh root@62.238.22.162 "export PATH=\"/root/.nvm/versions/node/v20.20.2/bin:\$PATH\" && pm2 show 55"
TARGET_DIR="/var/www/painel.paulistanaemporio.com"

# Diretórios Locais (baseados no repositório)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
DASHBOARD_DIR="$BASE_DIR/dashboard"
SCRIPTS_DIR="$BASE_DIR/scripts"

# Diretório de scripts no servidor
TARGET_SCRIPTS_DIR="/var/www/scripts"

echo "======================================================================"
echo "🚀 INICIANDO FLUXO DE IMPLANTAÇÃO (OPÇÃO B - BUILD LOCAL)"
echo "======================================================================"
echo "Servidor Remoto:  $REMOTE_USER@$REMOTE_HOST"
echo "Diretório Remoto: $TARGET_DIR"
echo "PM2 ID Processo:  $PM2_ID"
echo "Diretório Local:  $DASHBOARD_DIR"
echo "======================================================================"

# 1. Executar Compilação Local (Build)
echo -e "\n📦 1/4. Executando compilação (build) local do Next.js..."
cd "$DASHBOARD_DIR"

if [ -d ".next" ]; then
  echo "🧹 Limpando processos e build anterior (.next)..."
  pkill -f "next" || true
  sleep 1
  rm -rf .next
fi

npm run build
echo "✅ Build local concluído com sucesso!"

# 2. Executar Sincronização de Simulação (Dry-Run) para Segurança
echo -e "\n🔍 2/4. Executando simulação (dry-run) do rsync por segurança..."
rsync -avz --dry-run --delete \
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

rsync -avz --dry-run --delete \
  --exclude="venv" \
  --exclude="__pycache__" \
  --exclude=".git" \
  -e "ssh" \
  "$SCRIPTS_DIR/" "$REMOTE_USER@$REMOTE_HOST:$TARGET_SCRIPTS_DIR/"

# Prompt removido para automação

# 3. Executar Sincronização Real via rsync
echo -e "\n🔄 3/4. Enviando arquivos compilados para o servidor de produção..."
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

echo "Enviando pasta scripts..."
rsync -avz --delete \
  --exclude="venv" \
  --exclude="__pycache__" \
  --exclude=".git" \
  -e "ssh" \
  "$SCRIPTS_DIR/" "$REMOTE_USER@$REMOTE_HOST:$TARGET_SCRIPTS_DIR/"

echo "✅ Sincronização de arquivos concluída!"

# 4. Atualizar Dependências no Servidor e Reload PM2
echo -e "\n🔄 4/4. Instalando dependências de produção e recarregando PM2 ID $PM2_ID..."
ssh "$REMOTE_USER@$REMOTE_HOST" "
  export PATH=\"$REMOTE_NODE_PATH:\$PATH\"
  cd \"$TARGET_DIR\"
  
  echo '⬇️ Instalando novas dependências de produção (se houver)...'
  npm install --production --no-audit --no-fund
  
  echo '🐍 Configurando ambiente Python para o Mercado Livre...'
  mkdir -p \"$TARGET_SCRIPTS_DIR\"
  cd \"$TARGET_SCRIPTS_DIR/mercado_livre\"
  if [ ! -d \"venv\" ]; then
    python3 -m venv venv
  fi
  source venv/bin/activate
  pip install requests python-dotenv
  
  cd \"$TARGET_DIR\"
  
  echo '⏰ Configurando o Cron Diário de Preços no PM2 (rodando 02:00 AM)...'
  # Remove o processo antigo (se existir) para atualizar
  pm2 delete sync_prices 2>/dev/null || true
  # Inicia o script Node como um cron via PM2 (não reinicia automaticamente, apenas no cron)
  pm2 start \"$REMOTE_NODE_PATH/node\" --name \"sync_prices\" --cron \"0 2 * * *\" --no-autorestart -- \"$TARGET_SCRIPTS_DIR/sync_prices.js\"
  
  echo '🎥 Iniciando backend do Conversor de Mídia na porta 3001...'
  pm2 delete conversor 2>/dev/null || true
  PORT=3001 pm2 start \"$TARGET_DIR/conversor-backend.cjs\" --name \"conversor\"
  
  echo '🔄 Recarregando processo PM2 $PM2_ID de forma segura com variáveis atualizadas...'
  pm2 reload $PM2_ID --update-env || pm2 restart $PM2_ID --update-env
  
  echo '📈 Status atual do PM2:'
  pm2 show $PM2_ID | grep -E 'status|uptime|mem'
"

echo "======================================================================"
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "======================================================================"
