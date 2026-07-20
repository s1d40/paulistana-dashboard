#!/bin/bash
# ==========================================
# Hetzner Server Setup: Paulistana Storefront
# Server: 62.238.22.162 (CX23 - Helsinki)
# ==========================================
# Run as root: bash setup_server.sh

set -e

echo "🚀 Configurando servidor Paulistana Storefront..."

# ==========================================
# 1. System Updates
# ==========================================
echo "📦 Atualizando sistema..."
apt-get update && apt-get upgrade -y

# ==========================================
# 2. Install Node.js 20 LTS
# ==========================================
echo "📦 Instalando Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
node --version
npm --version

# ==========================================
# 3. Install Nginx
# ==========================================
echo "📦 Instalando Nginx..."
apt-get install -y nginx
systemctl enable nginx

# ==========================================
# 4. Install Certbot (Let's Encrypt)
# ==========================================
echo "📦 Instalando Certbot..."
apt-get install -y certbot python3-certbot-nginx

# ==========================================
# 5. Create app user and directory
# ==========================================
echo "👤 Criando usuário da app..."
if ! id "storefront" &>/dev/null; then
    useradd -m -s /bin/bash storefront
fi

mkdir -p /opt/storefront
chown storefront:storefront /opt/storefront

# ==========================================
# 6. Configure Nginx (Wildcard Subdomain)
# ==========================================
echo "🌐 Configurando Nginx..."

cat > /etc/nginx/sites-available/storefront << 'NGINX_CONF'
# Paulistana Storefront - Wildcard Subdomain Routing
# Cada subdomínio renderiza a loja correspondente

# Upstream para a app Next.js
upstream storefront_app {
    server 127.0.0.1:3001;
    keepalive 64;
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name *.paulistanaemporio.com;
    return 301 https://$host$request_uri;
}

# Main HTTPS server block
server {
    listen 443 ssl http2;
    server_name ~^(?<subdomain>.+)\.paulistanaemporio\.com$;

    # SSL (Certbot vai preencher isso)
    # ssl_certificate /etc/letsencrypt/live/paulistanaemporio.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/paulistanaemporio.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;

    # Static files (Next.js _next/static)
    location /_next/static {
        proxy_pass http://storefront_app;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Favicon
    location /favicon.ico {
        proxy_pass http://storefront_app;
        proxy_cache_valid 200 7d;
    }

    # All other requests → Next.js
    location / {
        proxy_pass http://storefront_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Store-Subdomain $subdomain;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
NGINX_CONF

# Enable site
ln -sf /etc/nginx/sites-available/storefront /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default  # Remove default

# Test config
nginx -t

# ==========================================
# 7. Create systemd service
# ==========================================
echo "⚙️ Criando serviço systemd..."

cat > /etc/systemd/system/storefront.service << 'SERVICE_CONF'
[Unit]
Description=Paulistana Storefront (Next.js)
After=network.target

[Service]
Type=simple
User=storefront
WorkingDirectory=/opt/storefront
ExecStart=/usr/bin/node /opt/storefront/.next/standalone/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=HOSTNAME=0.0.0.0

# Env file for secrets (Supabase keys, etc)
EnvironmentFile=/opt/storefront/.env.production

# Limits
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
SERVICE_CONF

systemctl daemon-reload
systemctl enable storefront

# ==========================================
# 8. Setup SSL (after DNS is configured)
# ==========================================
echo ""
echo "==========================================  "
echo "⚠️  PRÓXIMOS PASSOS MANUAIS:"
echo "==========================================  "
echo ""
echo "1. Configure DNS wildcard:"
echo "   *.paulistanaemporio.com → 62.238.22.162 (A record)"
echo "   paulistanaemporio.com   → 62.238.22.162 (A record)"
echo ""
echo "2. Depois que o DNS propagar, rode o Certbot:"
echo "   certbot --nginx -d '*.paulistanaemporio.com' -d paulistanaemporio.com"
echo "   (Vai pedir DNS challenge - adicione o TXT record)"
echo ""
echo "3. Faça o deploy da app:"
echo "   bash /opt/storefront/deploy.sh"
echo ""
echo "✅ Setup do servidor concluído!"
