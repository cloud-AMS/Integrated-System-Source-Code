# Panduan & Checklist Deployment VPS — AMS Integrated System

Dokumen ini memuat panduan teknis, spesifikasi infrastruktur, dan checklist kesiapan deployment sistem **AMS Integrated System (PT Anugrah Mitra Selaras)** pada Virtual Private Server (VPS) berbasis Linux (Ubuntu 22.04 / 24.04 LTS).

---

## 1. Rekomendasi Spesifikasi Server VPS

Karena sistem mengelola operasional multi-site (Pabrik Manufaktur Cikarang, Kantor Pusat, dan Gudang Distribusi Cakung) yang mencakup server Node.js Express, frontend Vite PWA, serta daemon basis data PocketBase:

| Komponen | Spesifikasi Minimum (Staging / Pilot) | Spesifikasi Rekomendasi (Produksi Multi-Site) |
| :--- | :--- | :--- |
| **vCPU** | 2 Core (High Compute) | **4 Core** (Dedikasi/Shared High Compute) |
| **RAM** | 4 GB | **8 GB** (+ 4 GB Swap file) |
| **Penyimpanan** | 40 GB NVMe / SSD | **80 – 100 GB NVMe SSD** (I/O cepat WAL SQLite) |
| **Sistem Operasi** | Ubuntu 22.04 LTS / Debian 12 | **Ubuntu 24.04 LTS (64-bit)** |
| **Bandwidth** | 1 Gbps Port, 1 TB transfer/bulan | **1 Gbps Port, 3 – 5 TB transfer/bulan** |
| **Lokasi Server** | Indonesia (Jakarta - IDC / Cyber) | **Indonesia (Jakarta)** — Kepatuhan UU PDP No. 27/2022 & latensi < 15ms |
| **Fitur VPS Wajib** | Static Public IPv4, Firewall UI | **Automated Daily Snapshot & Firewall Provider** |

> **Rasionalisasi Hardware**:
> 1. **Proses Build Vite & Rollup**: Mengompilasi TypeScript dan ribuan modul UI PWA membutuhkan puncak RAM ~1.5–2 GB saat `npm run build`.
> 2. **PocketBase (SQLite WAL Mode)**: Memerlukan storage NVMe dengan IOPS stabil agar pencatatan audit trail ber-hash SHA-256 tidak mengalami disk contention.
> 3. **Node.js Express + PM2**: Menjalankan cluster backend dengan efisiensi memori ~300-500 MB per worker process.

---

## 2. Checklist Kesiapan Deployment (Production Checklist)

### A. Checklist Pra-Deployment (Persiapan)
- [ ] Domain aktif terarah ke IP VPS (Contoh: `ams.mitraselaras.co.id` & `web.mitraselaras.co.id` via A-Record DNS).
- [ ] Akses SSH Key terpasang (Password authentication SSH dinonaktifkan).
- [ ] Pengguna non-root dengan privilege `sudo` telah dibuat (misal: `amsadmin`).
- [ ] Port firewall dasar diamankan (Hanya buka port 22/SSH, 80/HTTP, 443/HTTPS).
- [ ] Variabel rahasia disiapkan (`AMS_ADMIN_TOKEN`, `GEMINI_API_KEY`, `APP_URL`).

### B. Checklist Saat Deployment (Instalasi & Verifikasi)
- [ ] Node.js v22.x LTS dan npm terbaru terpasang.
- [ ] Git terinstal dan repository di-clone ke `/var/www/ams-integrated-system`.
- [ ] Binary PocketBase Linux (v0.28+) terpasang di `/opt/pocketbase-ams` dan berjalan via systemd.
- [ ] Dependensi `npm ci` berhasil tanpa audit error kritis.
- [ ] Skrip verifikasi lolos: `npm run lint`, `npm run test`, dan `npm run cek:semua`.
- [ ] Build produksi selesai (`npm run build` menghasilkan `dist/` dan `server.js`).
- [ ] PM2 menjalankan `server.js` dengan konfigurasi startup otomatis saat reboot.
- [ ] Reverse Proxy (Nginx atau Caddy) aktif mengarahkan traffic port 443 HTTPS ke port 3000 dan `/api/ams-pb` ke port 8091.
- [ ] Sertifikat SSL Let's Encrypt terpasang otomatis (HTTPS Grade A).

### C. Checklist Pasca-Deployment (Keamanan & Pemeliharaan)
- [ ] Endpoint `/api/health` mengembalikan status `aktif` (HTTP 200).
- [ ] Halaman dashboard dan landing page `/web` dapat diakses dari browser eksternal.
- [ ] UFW firewall aktif (`sudo ufw status` menunjukkan port internal 3000 & 8091 terisolasi dari akses publik).
- [ ] Fail2ban terkonfigurasi untuk melindungi port SSH dari serangan brute-force.
- [ ] Cron job backup terjadwal untuk database SQLite `pb_data` dan berkas snapshot publikasi.

---

## 3. Langkah-Langkah Eksekusi Deployment Step-by-Step

### Langkah 1: Update Server & Hardening Awal
```bash
# Update repository & paket OS
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw fail2ban unzip build-essential

# Buat user baru non-root
sudo adduser amsadmin
sudo usermod -aG sudo amsadmin

# Konfigurasi Firewall UFW
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

# Verifikasi versi (wajib Node >= 22)
node -v
npm -v

# Pasang PM2 global
sudo npm install -g pm2
```

### Langkah 3: Setup Basis Data PocketBase AMS
```bash
# Siapkan folder PocketBase
sudo mkdir -p /opt/pocketbase-ams
cd /opt/pocketbase-ams

# Unduh binary resmi PocketBase Linux amd64
sudo wget https://github.com/pocketbase/pocketbase/releases/download/v0.28.1/pocketbase_0.28.1_linux_amd64.zip
sudo unzip pocketbase_0.28.1_linux_amd64.zip
sudo rm pocketbase_0.28.1_linux_amd64.zip
sudo chown -R amsadmin:amsadmin /opt/pocketbase-ams

# Buat Systemd Service untuk PocketBase
sudo bash -c 'cat <<EOF > /etc/systemd/system/ams-pocketbase.service
[Unit]
Description=PocketBase AMS Database Service
After=network.target

[Service]
Type=simple
User=amsadmin
Group=amsadmin
LimitNOFILE=4096
WorkingDirectory=/opt/pocketbase-ams
ExecStart=/opt/pocketbase-ams/pocketbase serve --http=127.0.0.1:8091
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF'

# Aktifkan dan jalankan service
sudo systemctl daemon-reload
sudo systemctl enable ams-pocketbase
sudo systemctl start ams-pocketbase
sudo systemctl status ams-pocketbase
```

### Langkah 4: Clone & Build Aplikasi AMS
```bash
# Buat direktori aplikasi
sudo mkdir -p /var/www/ams-integrated-system
sudo chown -R amsadmin:amsadmin /var/www/ams-integrated-system

# Clone repositori
cd /var/www/ams-integrated-system
git clone https://github.com/cloud-AMS/Integrated-System-Source-Code.git .

# Buat file konfigurasi environment
cat <<EOF > .env
NODE_ENV=production
PORT=3000
APP_URL=https://ams.perusahaan-anda.co.id
AMS_ADMIN_TOKEN=$(openssl rand -hex 24)
GEMINI_API_KEY=
EOF

# Install dependencies & jalankan verifikasi mutu
npm ci
npm run verifikasi

# Build produksi
npm run build
```

### Langkah 5: Jalankan Aplikasi Menggunakan PM2
```bash
# Jalankan bundel server.js
pm2 start server.js --name "ams-system" -i 2 --env production

# Konfigurasi auto-start saat reboot
pm2 save
pm2 startup
# (Jalankan perintah sudo env PATH... yang dimunculkan oleh pm2)
```

### Langkah 6: Konfigurasi Nginx Reverse Proxy & SSL Let's Encrypt
```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Buat konfigurasi server block Nginx
sudo bash -c 'cat <<EOF > /etc/nginx/sites-available/ams-system
server {
    server_name ams.perusahaan-anda.co.id;

    # Proteksi Header Keamanan Standar Medis & UU PDP
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src \x27self\x27 \x27unsafe-inline\x27 \x27unsafe-eval\x27 https: data: blob:;" always;

    client_max_body_size 25M;

    # Aplikasi Utama & Frontend PWA
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
sudo nginx -t
sudo systemctl reload nginx

# Dapatkan sertifikat SSL otomatis dari Let's Encrypt
sudo certbot --nginx -d ams.perusahaan-anda.co.id --non-interactive --agree-tos -m it@perusahaan-anda.co.id --redirect
```

### Langkah 7: Jadwal Backup Otomatis (Cron Job)
```bash
# Buat script backup
sudo bash -c 'cat <<EOF > /usr/local/bin/ams-backup.sh
#!/bin/bash
BACKUP_DIR="/var/backups/ams"
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
mkdir -p \$BACKUP_DIR

# Backup basis data PocketBase (SQLite & uploads)
tar -czf "\$BACKUP_DIR/pocketbase_backup_\$TIMESTAMP.tar.gz" -C /opt/pocketbase-ams pb_data

# Backup file snapshot website
cp /var/www/ams-integrated-system/public/website-published.json "\$BACKUP_DIR/website_snapshot_\$TIMESTAMP.json" 2>/dev/null

# Hapus backup lebih tua dari 14 hari
find \$BACKUP_DIR -type f -name "*.tar.gz" -mtime +14 -exec rm {} \;
find \$BACKUP_DIR -type f -name "*.json" -mtime +14 -exec rm {} \;
EOF'

sudo chmod +x /usr/local/bin/ams-backup.sh

# Tambahkan ke crontab root untuk backup setiap jam 02:00 pagi
(sudo crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/ams-backup.sh >/dev/null 2>&1") | sudo crontab -
```
