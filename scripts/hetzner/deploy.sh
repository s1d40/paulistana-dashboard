#!/bin/bash
# ==========================================
# Deploy Script: Paulistana Storefront
# ==========================================
# Usage: bash deploy.sh [branch]
# Run from the project root or on the Hetzner server

set -e

BRANCH=${1:-main}
APP_DIR="/opt/storefront"
REPO_URL="https://github.com/s1d40/paulistana-dashboard.git"

echo "🚀 Deploying Paulistana Storefront (branch: $BRANCH)..."

# ==========================================
# 1. Clone or pull
# ==========================================
if [ ! -d "$APP_DIR/.git" ]; then
    echo "📥 Clonando repositório..."
    git clone --branch "$BRANCH" --single-branch "$REPO_URL" /tmp/storefront-clone
    cp -r /tmp/storefront-clone/storefront/* "$APP_DIR/"
    cp -r /tmp/storefront-clone/storefront/.* "$APP_DIR/" 2>/dev/null || true
    rm -rf /tmp/storefront-clone
    
    # Init git in app dir for future pulls
    cd "$APP_DIR"
else
    echo "📥 Puxando atualizações..."
    cd "$APP_DIR"
    git pull origin "$BRANCH"
fi

# ==========================================
# 2. Install dependencies
# ==========================================
echo "📦 Instalando dependências..."
cd "$APP_DIR"
npm ci --production=false

# ==========================================
# 3. Build
# ==========================================
echo "🔨 Building Next.js..."
npm run build

# ==========================================
# 4. Restart service
# ==========================================
echo "🔄 Reiniciando serviço..."
sudo systemctl restart storefront

# ==========================================
# 5. Health check
# ==========================================
echo "🏥 Verificando saúde..."
sleep 3
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200\|301\|302"; then
    echo "✅ Deploy concluído com sucesso!"
else
    echo "⚠️ App pode estar inicializando ainda. Verifique: systemctl status storefront"
fi

echo ""
echo "📊 Status: systemctl status storefront"
echo "📋 Logs:   journalctl -u storefront -f"
