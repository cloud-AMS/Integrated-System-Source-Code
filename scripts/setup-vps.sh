#!/usr/bin/env bash
# ==============================================================================
# Script Otomasi Instalasi & Deployment VPS — AMS Integrated System
# Sistem Operasi Target: Ubuntu 22.04 / 24.04 LTS (64-bit)
# ==============================================================================

set -euo pipefail

DOMAIN="${1:-}"

if [ -z "$DOMAIN" ]; then
  echo "Penggunaan: sudo bash scripts/setup-vps.sh <nama-domain>"
  echo "Contoh: sudo bash scripts/setup-vps.sh ams.mitraselaras.co.id"
  exit 1
fi

echo "=========================================================="
echo "Memulai Provisioning VPS untuk Domain: $DOMAIN"
echo "=========================================================="

# 1. Update OS & Paket Esensial
echo "[1/7] Memperbarui sistem operasi dan paket dasar..."
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git ufw fail2ban unzip build-essential nginx certbot python3-certbot-nginx

# 2. Firewall UFW Hardening
echo "[2/7] Mengonfigurasi firewall UFW..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP Web'
ufw allow 443/tcp comment 'HTTPS Secure Web'
ufw --force enable

# 3. Instalasi Node.js 22 LTS & PM2
echo "[3/7] Menginstal Node.js 22 LTS dan PM2..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
npm install -g pm2

# 4. Setup Basis Data PocketBase AMS
echo "[4/7] Menyiapkan daemon PocketBase AMS di port 8091..."
mkdir -p /opt/pocketbase-ams
cd /opt/pocketbase-ams
if [ ! -f /opt/pocketbase-ams/pocketbase ]; then
  wget -q https://github.com/pocketbase/pocketbase/releases/download/v0.28.1/pocketbase_0.28.1_linux_amd64.zip
  unzip -q pocketbase_0.28.1_linux_amd64.zip
  rm -f pocketbase_0.28.1_linux_amd64.zip
  chmod +x pocketbase
fi

cat <<EOF > /etc/systemd/system/ams-pocketbase.service
[Unit]
Description=PocketBase AMS Database Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/pocketbase-ams
ExecStart=/opt/pocketbase-ams/pocketbase serve --http=127.0.0.1:8091
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ams-pocketbase
systemctl restart ams-pocketbase

# 5. Build Aplikasi Node.js
echo "[5/7] Melakukan build aplikasi produksi..."
APP_DIR="/var/www/ams-integrated-system"
mkdir -p "$APP_DIR/logs"

if [ -f "$APP_DIR/package.json" ]; then
  cd "$APP_DIR"
  npm ci
  npm run build
  pm2 start ecosystem.config.cjs --env production || pm2 restart ams-integrated-system
  pm2 save
fi

# 6. Konfigurasi Nginx Reverse Proxy
echo "[6/7] Menyiapkan konfigurasi Nginx reverse proxy..."
cat <<EOF > /etc/nginx/sites-available/ams-system
server {
    listen 80;
    server_name $DOMAIN;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    client_max_body_size 25M;

    # Aplikasi Utama (Express + Frontend Vite PWA)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Proxy ke PocketBase AMS (SSE & Kanal Realtime)
    location /api/ams-pb/ {
        proxy_pass http://127.0.0.1:8091/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ams-system /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 7. Sertifikat SSL Otomatis Let's Encrypt
echo "[7/7] Menerbitkan sertifikat SSL Let's Encrypt..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect || {
  echo "Peringatan: Certbot SSL belum dapat diselesaikan otomatis. Pastikan DNS A-Record domain sudah mengarah ke IP VPS ini."
}

echo "=========================================================="
echo "Selesai! Aplikasi AMS Integrated System siap diakses di:"
echo "https://$DOMAIN"
echo "=========================================================="
