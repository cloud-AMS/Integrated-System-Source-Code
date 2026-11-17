#!/usr/bin/env bash
# ==============================================================================
# Script Otomasi Instalasi & Deployment VPS — AMS Integrated System
# Sistem Operasi Target: Ubuntu 22.04 / 24.04 LTS (AMD64 / ARM64)
# ==============================================================================

set -euo pipefail

DOMAIN="${1:-}"

if [ -z "$DOMAIN" ]; then
  echo "Penggunaan: sudo bash scripts/setup-vps.sh <nama-domain>"
  echo "Contoh: sudo bash scripts/setup-vps.sh ams.mitraselaras.co.id"
  exit 1
fi

echo "=========================================================="
echo "Memulai Provisioning Server untuk Domain: $DOMAIN"
echo "=========================================================="

echo "[1/6] Memperbarui sistem operasi dan paket dasar..."
apt-get update && apt-get upgrade -y
apt-get install -y curl git ufw fail2ban build-essential nginx certbot python3-certbot-nginx

echo "[2/6] Mengonfigurasi firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP Web'
ufw allow 443/tcp comment 'HTTPS Secure Web'
ufw --force enable

echo "[3/6] Menginstal Node.js 22 LTS dan PM2..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
npm install -g pm2

echo "[4/6] Build aplikasi dan menyiapkan penyimpanan persisten..."
APP_DIR="/var/www/ams-integrated-system"
DATA_DIR="/var/lib/ams-data"
APP_USER="amsadmin"
APP_HOME="/home/$APP_USER"
if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --create-home --home-dir "$APP_HOME" --shell /bin/bash "$APP_USER"
fi
mkdir -p "$APP_DIR/logs" "$DATA_DIR"
chmod 750 "$DATA_DIR"

if [ ! -f "$APP_DIR/.env" ]; then
  echo "File $APP_DIR/.env wajib disiapkan sebelum deployment."
  exit 1
fi

set -a
# shellcheck disable=SC1091
. "$APP_DIR/.env"
set +a
export APP_URL="https://$DOMAIN"
export AMS_DB_DRIVER="firebase"
export AMS_DATA_DIR="$DATA_DIR"
chmod 600 "$APP_DIR/.env"
chown -R "$APP_USER:$APP_USER" "$APP_DIR" "$DATA_DIR"

if [ ! -f "$APP_DIR/package.json" ]; then
  echo "Repository aplikasi tidak ditemukan di $APP_DIR."
  exit 1
fi

cd "$APP_DIR"
runuser -u "$APP_USER" -- env APP_DIR="$APP_DIR" DEPLOY_APP_URL="$APP_URL" DEPLOY_DATA_DIR="$AMS_DATA_DIR" bash -c '
  cd "$APP_DIR"
  set -a
  . ./.env
  set +a
  export APP_URL="$DEPLOY_APP_URL"
  export AMS_DB_DRIVER=firebase
  export AMS_DATA_DIR="$DEPLOY_DATA_DIR"
  npm ci
  npm run build
  pm2 start ecosystem.config.cjs --env production --update-env || pm2 restart ams-integrated-system --update-env
  pm2 save
'

PM2_BIN="$(command -v pm2)"
cat <<EOF > /etc/systemd/system/pm2-amsadmin.service
[Unit]
Description=PM2 process manager for AMS
After=network.target

[Service]
Type=forking
User=$APP_USER
LimitNOFILE=infinity
Environment=PM2_HOME=$APP_HOME/.pm2
PIDFile=$APP_HOME/.pm2/pm2.pid
ExecStart=$PM2_BIN resurrect
ExecReload=$PM2_BIN reload all
ExecStop=$PM2_BIN kill
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
runuser -u "$APP_USER" -- pm2 kill
systemctl enable --now pm2-amsadmin

echo "[5/6] Menyiapkan Nginx reverse proxy..."
cat <<EOF > /etc/nginx/sites-available/ams-system
server {
    listen 80;
    server_name $DOMAIN;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    client_max_body_size 25M;

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
}
EOF

ln -sf /etc/nginx/sites-available/ams-system /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

echo "[6/6] Menerbitkan sertifikat SSL Let's Encrypt..."
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-admin@$DOMAIN}"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$LETSENCRYPT_EMAIL" --redirect || {
  echo "Peringatan: SSL belum dapat diterbitkan. Pastikan DNS A record mengarah ke VM, lalu jalankan certbot kembali."
}

echo "=========================================================="
echo "Selesai! Aplikasi AMS Integrated System siap diakses di:"
echo "https://$DOMAIN"
echo "Data server tersimpan di $DATA_DIR."
echo "=========================================================="
