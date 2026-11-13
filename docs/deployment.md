# Panduan & Checklist Deployment VPS — AMS Integrated System

Dokumen ini memuat panduan teknis, spesifikasi infrastruktur server, checklist kesiapan, serta langkah-langkah deployment end-to-end untuk sistem **AMS Integrated System (PT Anugrahmitra Selaras)** pada Virtual Private Server (VPS) berbasis Linux (Ubuntu 22.04 / 24.04 LTS).

---

## 1. Rekomendasi Spesifikasi Server VPS

Sistem AMS Integrated System menjalankan arsitektur terintegrasi yang mencakup:
- **Aplikasi Utama**: Node.js Express server + Frontend Vite PWA (Port 3000)
- **Basis Data Real-Time**: PocketBase single-binary daemon dengan SQLite mode WAL (Port 8091)
- **Reverse Proxy & SSL**: Nginx / Caddy Web Server dengan TLS Let's Encrypt (Port 80 & 443)

| Komponen | Spesifikasi Minimum *(Testing / Staging)* | Spesifikasi Rekomendasi *(Produksi Multi-Site)* |
| :--- | :--- | :--- |
| **vCPU** | 2 Core | **4 Core** *(Dedicated / High-Compute)* |
| **RAM** | 4 GB | **8 GB** *(ditambah Swap 4 GB)* |
| **Penyimpanan** | 40 GB NVMe / SSD | **80 – 100 GB NVMe SSD** *(Enterprise IOPS)* |
| **Sistem Operasi** | Ubuntu 22.04 LTS / Debian 12 | **Ubuntu 24.04 LTS (64-bit)** |
| **Bandwidth** | 1 Gbps port, 1 TB transfer/bulan | **1 Gbps port, 3 – 5 TB transfer/bulan** |
| **Lokasi Data Center** | Indonesia (Jakarta - IDC / Cyber) | **Indonesia (Jakarta)** — Kepatuhan UU PDP No. 27/2022 & latensi < 15ms |
| **Fitur VPS Wajib** | 1 Static Public IPv4, Firewall UI | **Automated Daily Snapshot + Firewall Provider** |

### Rasionalisasi Kebutuhan Hardware:
1. **Puncak Beban Memori saat Build**: Kompilasi ribuan modul TypeScript, penataan chunk Vite PWA, dan bundling CSS Tailwind memerlukan puncak memori sekitar **1.5 – 2 GB RAM** saat eksekusi `npm run build`.
2. **I/O NVMe Cepat untuk SQLite WAL**: PocketBase dan transaksi audit trail ber-hash SHA-256 mengandalkan SQLite dalam mode WAL (*Write-Ahead Logging*). Storage berkecepatan tinggi memastikan konsistensi ACID tanpa *disk contention*.
3. **Kepatuhan Data Residensi (UU PDP No. 27/2022 & Kemenkes)**: Data rekam medis karyawan, sertifikasi CDAKB/CPAKB, dan rekam jejak distribusi alkes harus disimpan di dalam yurisdiksi Indonesia.

---

## 2. Checklist Kesiapan Deployment (Production Checklist)

### A. Checklist Pra-Deployment (Persiapan Awal)
- [ ] **Domain & DNS**: Subdomain aktif diarahkan ke IP Public VPS melalui DNS A-Record (contoh: `ams.mitraselaras.co.id`).
- [ ] **Akses SSH**: Login menggunakan SSH Keypair; autentikasi kata sandi root dinonaktifkan (`PasswordAuthentication no`).
- [ ] **Akun Non-Root**: User dengan hak akses sudo telah dibuat (misal: `amsadmin`).
- [ ] **Firewall Dasar**: Hanya port 22 (SSH), 80 (HTTP), dan 443 (HTTPS) yang dibuka untuk publik via UFW.
- [ ] **Variabel Rahasia**: Menyiapkan nilai rahasia untuk `AMS_ADMIN_TOKEN`, `APP_URL`, dan token integrasi.

### B. Checklist Saat Deployment (Instalasi & Verifikasi)
- [ ] **Node.js v22 LTS**: Terinstal dan terverifikasi (`node -v` $\ge$ 22.0.0).
- [ ] **PocketBase Service**: Binary terpasang di `/opt/pocketbase-ams` dan aktif via systemd di `127.0.0.1:8091`.
- [ ] **Kode Sumber**: Berhasil di-clone ke `/var/www/ams-integrated-system`.
- [ ] **Verifikasi Kode**: Perintah `npm run verifikasi` (lint, test, dan cek integritas FEFO/gudang) lolos tanpa kegagalan.
- [ ] **Kompilasi Produksi**: `npm run build` sukses menghasilkan folder `dist/` dan file `server.js`.
- [ ] **Process Manager**: PM2 menjalankan `server.js` dengan konfigurasi startup otomatis saat server reboot.
- [ ] **Reverse Proxy & SSL**: Nginx terkonfigurasi dengan Let's Encrypt SSL (HTTPS Grade A).

### C. Checklist Pasca-Deployment (Verifikasi & Pemeliharaan)
- [ ] **Health Check**: Endpoint `https://ams.mitraselaras.co.id/api/health` mengembalikan status `aktif` (HTTP 200).
- [ ] **Akses Dashboard & Web**: Halaman web publik (`/web`) dan portal internal dapat diakses lancar lintas perangkat.
- [ ] **Isolasi Port Internal**: Port `3000` (Node) dan `8091` (PocketBase) terblokir dari akses internet langsung.
- [ ] **Otomasi Backup Harian**: Cron job aktif mem-backup database SQLite `pb_data` dan file snapshot website secara berkala.
- [ ] **Fail2ban**: Terkonfigurasi aktif untuk mencegah serangan brute-force pada port SSH.

---

## 3. Langkah-Langkah Eksekusi Deployment di VPS Linux

### Langkah 1: Persiapan Server & Keamanan Awal
```bash
# 1. Perbarui sistem operasi
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw fail2ban unzip build-essential nginx certbot python3-certbot-nginx

# 2. Buat user operasional non-root
sudo adduser amsadmin
sudo usermod -aG sudo amsadmin

# 3. Kunci firewall (hanya buka port esensial)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Langkah 2: Instalasi Node.js 22 LTS & PM2
```bash
# Pasang Node.js v22 LTS dari NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# Verifikasi versi Node
node -v   # Output wajib >= v22.x
npm -v
```

### Langkah 3: Setup Service PocketBase AMS
```bash
sudo mkdir -p /opt/pocketbase-ams
cd /opt/pocketbase-ams
sudo wget https://github.com/pocketbase/pocketbase/releases/download/v0.28.1/pocketbase_0.28.1_linux_amd64.zip
sudo unzip pocketbase_0.28.1_linux_amd64.zip
sudo rm pocketbase_0.28.1_linux_amd64.zip
sudo chown -R amsadmin:amsadmin /opt/pocketbase-ams

# Daftarkan sebagai systemd service
sudo bash -c 'cat <<EOF > /etc/systemd/system/ams-pocketbase.service
[Unit]
Description=PocketBase AMS Database Service
After=network.target

[Service]
Type=simple
User=amsadmin
Group=amsadmin
WorkingDirectory=/opt/pocketbase-ams
ExecStart=/opt/pocketbase-ams/pocketbase serve --http=127.0.0.1:8091
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF'

# Muat dan jalankan service
sudo systemctl daemon-reload
sudo systemctl enable --now ams-pocketbase
sudo systemctl status ams-pocketbase
```

### Langkah 4: Clone, Verifikasi, dan Build Aplikasi
```bash
# Buat direktori web aplikasi
sudo mkdir -p /var/www/ams-integrated-system
sudo chown -R amsadmin:amsadmin /var/www/ams-integrated-system
cd /var/www/ams-integrated-system

# Clone source code dari repositori resmi
git clone https://github.com/cloud-AMS/Integrated-System-Source-Code.git .

# Konfigurasi Environment Produksi (.env)
cat <<EOF > .env
NODE_ENV=production
PORT=3000
APP_URL=https://ams.mitraselaras.co.id
AMS_ADMIN_TOKEN=$(openssl rand -hex 24)
EOF

# Instal dependencies & verifikasi kualitas sistem
npm ci
npm run verifikasi

# Build produksi (menghasilkan dist/ dan server.js)
npm run build
```

### Langkah 5: Jalankan Server via PM2
```bash
# Jalankan bundel server.js
pm2 start server.js --name "ams-system" -i 2 --env production

# Konfigurasi auto-start saat reboot
pm2 save
pm2 startup
# (Jalankan baris perintah 'sudo env PATH...' yang ditampilkan oleh PM2)
```

### Langkah 6: Konfigurasi Nginx Reverse Proxy & SSL Otomatis
```bash
# Buat server block Nginx
sudo bash -c 'cat <<EOF > /etc/nginx/sites-available/ams-system
server {
    server_name ams.mitraselaras.co.id;

    # Header Keamanan Standar Medis & UU PDP
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src \x27self\x27 \x27unsafe-inline\x27 \x27unsafe-eval\x27 https: data: blob:;" always;

    client_max_body_size 25M;

    # Aplikasi Utama (Express + Frontend PWA)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
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
EOF'

# Aktifkan konfigurasi
sudo ln -sf /etc/nginx/sites-available/ams-system /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Pasang SSL gratis otomatis dari Let's Encrypt
sudo certbot --nginx -d ams.mitraselaras.co.id --non-interactive --agree-tos -m it@mitraselaras.co.id --redirect
```

### Langkah 7: Pasang Backup Otomatis Database (Cron Job)
```bash
# Buat skrip backup otomatis
sudo bash -c 'cat <<EOF > /usr/local/bin/ams-backup.sh
#!/bin/bash
BACKUP_DIR="/var/backups/ams"
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
mkdir -p \$BACKUP_DIR

# 1. Backup basis data PocketBase (SQLite & file attachments)
tar -czf "\$BACKUP_DIR/pb_backup_\$TIMESTAMP.tar.gz" -C /opt/pocketbase-ams pb_data

# 2. Backup file snapshot website terbit
cp /var/www/ams-integrated-system/public/website-published.json "\$BACKUP_DIR/website_\$TIMESTAMP.json" 2>/dev/null

# 3. Rotasi: hapus backup yang berumur lebih dari 14 hari
find \$BACKUP_DIR -type f -name "*.tar.gz" -mtime +14 -exec rm {} \;
find \$BACKUP_DIR -type f -name "*.json" -mtime +14 -exec rm {} \;
EOF'

sudo chmod +x /usr/local/bin/ams-backup.sh

# Daftarkan pada crontab untuk berjalan setiap jam 02:00 pagi
(sudo crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/ams-backup.sh >/dev/null 2>&1") | sudo crontab -
```
