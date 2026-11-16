# Panduan & Checklist Deployment VPS — AMS Integrated System

Dokumen ini memuat panduan teknis, spesifikasi infrastruktur, dan checklist kesiapan deployment sistem **AMS Integrated System (PT Anugrahmitra Selaras)** pada Virtual Private Server (VPS) berbasis Linux (Ubuntu 22.04 / 24.04 LTS).

---

## 1. Rekomendasi Spesifikasi Server VPS

Karena sistem mengelola operasional multi-site (Pabrik Manufaktur Cikarang, Kantor Pusat, dan Gudang Distribusi Cakung) dengan server Node.js Express + WebSocket Sync Hub (`/api/sync/ws`), penyimpan state persisten server (`<AMS_DATA_DIR>/rbac-db.json` & `app-state.json`), frontend Vite PWA, serta layanan opsional PocketBase:

| Komponen | Spesifikasi Minimum (Staging / Pilot) | Spesifikasi Rekomendasi (Produksi Multi-Site) |
| :--- | :--- | :--- |
| **vCPU** | 2 Core (High Compute) | **4 Core** (Dedikasi/Shared High Compute) |
| **RAM** | 4 GB | **8 GB** (+ 4 GB Swap file) |
| **Penyimpanan** | 40 GB NVMe / SSD | **80 – 100 GB NVMe SSD** (I/O cepat untuk JSON/WAL SQLite) |
| **Sistem Operasi** | Ubuntu 22.04 LTS / Debian 12 | **Ubuntu 24.04 LTS (64-bit)** |
| **Bandwidth** | 1 Gbps Port, 1 TB transfer/bulan | **1 Gbps Port, 3 – 5 TB transfer/bulan** |
| **Lokasi Server** | Indonesia (Jakarta - IDC / Cyber) | **Indonesia (Jakarta)** — Kepatuhan UU PDP No. 27/2022 & latensi < 15ms |
| **Fitur VPS Wajib** | Static Public IPv4, Firewall UI | **Automated Daily Snapshot & Firewall Provider** |

> **Rasionalisasi Hardware & Arsitektur**:
> 1. **Proses Build Vite & Rollup**: Mengompilasi TypeScript dan ribuan modul UI PWA membutuhkan puncak RAM ~1.5–2 GB saat `npm run build`.
> 2. **Proses Tunggal PM2 (`instances: 1`, `exec_mode: 'fork'`)**: Server menjaga status sesi RBAC (`rbac-db.json`), state ERP (`app-state.json`), serta klien aktif WebSocket `/api/sync/ws` di memori proses. **Jangan jalankan mode cluster (`-i 2`)** agar tidak terjadi *split-brain* autentikasi, kegagalan broadcast real-time antar user, maupun penulisan tumpang-tindih pada file state.
> 3. **Penyimpanan Persisten (`AMS_DATA_DIR`)**: Wajib ditempatkan pada direktori persisten di luar folder build/git (mis. `/var/lib/ams-data`) dan tercakup penuh dalam skrip backup harian.

---

## 2. Checklist Kesiapan Deployment (Production Checklist)

> **Catatan Kejujuran**: item bertanda `[x]` di bawah adalah aspek yang **sudah terverifikasi pada repositori kode sumber**. Item yang bergantung pada provisioning server VPS target, DNS, SSL, Nginx/UFW, dan uji akses publik **tetap `[ ]`** hingga dieksekusi di VPS target.

### A. Checklist Pra-Deployment (Persiapan VPS & Rahasia)
- [ ] Domain aktif terarah ke IP VPS (Contoh: `ams.mitraselaras.co.id` & `web.mitraselaras.co.id` via A-Record DNS).
- [ ] Akses SSH Key terpasang (Password authentication SSH dinonaktifkan).
- [ ] Pengguna non-root dengan privilege `sudo` telah dibuat (misal: `amsadmin`).
- [ ] Port firewall dasar diamankan (Hanya buka port 22/SSH, 80/HTTP, 443/HTTPS).
- [ ] Variabel lingkungan disiapkan di `.env` VPS (`APP_URL`, `AMS_DATA_DIR`, `SESSION_SECRET`, `INITIAL_SETUP_TOKEN`, `AMS_ADMIN_TOKEN`, `GEMINI_API_KEY`).

### B. Checklist Saat Deployment (Instalasi & Verifikasi)
- [ ] Node.js v22.x LTS dan npm terbaru terpasang di VPS target.
- [ ] Git terinstal dan repository di-clone ke `/var/www/ams-integrated-system`.
- [ ] Direktori data persisten server (`AMS_DATA_DIR=/var/lib/ams-data`) dibuat dan dimiliki oleh user runtime (`amsadmin`).
- [ ] *(Opsional jika memakai jalur legacy PocketBase)* Binary PocketBase Linux (v0.28+) terpasang di `/opt/pocketbase-ams` dan berjalan via systemd di `127.0.0.1:8091`.
- [ ] Dependensi `npm ci` berhasil di VPS target tanpa audit error kritis.
- [x] **Verifikasi kode sumber di repositori**: `npm run lint` (`tsc --noEmit`), `npm run test` (16 file / 225 tes Vitest), dan `npm run cek:semua` (`cek:benih`, `cek:fefo`, `cek:gudang`) **lulus tanpa error**. *(Wajib dijalankan ulang via `npm run verifikasi` di VPS saat deploy/update.)*
- [x] **Kompilasi produksi di repositori**: `npm run build` menghasilkan `dist/` (termasuk PWA `sw.js`) dan `server.js` (89,6 KB) dengan status sukses. *(Catatan: masih ada chunk >500 kB pada Vite; wajib dijalankan ulang saat build di VPS target.)*
- [ ] PM2 menjalankan `ecosystem.config.cjs` (**1 instance fork**) dengan konfigurasi startup otomatis saat reboot (`pm2 save` & `pm2 startup`).
- [ ] Reverse Proxy (Nginx atau Caddy) aktif mengarahkan port 443 HTTPS ke `127.0.0.1:3000` (termasuk dukungan `Upgrade` WebSocket untuk `/api/sync/ws`).
- [ ] Sertifikat SSL Let's Encrypt terpasang otomatis (HTTPS Grade A) + header HSTS aktif.

### C. Checklist Pasca-Deployment (Keamanan, Inisialisasi & Pemeliharaan)
- [ ] Endpoint `/api/health` mengembalikan JSON `status: "aktif"`, `rbacAktif: true`, dan `realtimeSyncAktif: true` (HTTP 200).
- [ ] Akun Developer/IT Admin pertama telah dibuat melalui **Setup Wizard** (`/`) atau CLI `npm run auth:bootstrap` dan terverifikasi login lintas browser/internet.
- [ ] Data simulasi/dummy dibersihkan melalui **IT & Traceability Hub → Pusat Purge Data Dummy** sebelum input data operasional asli (jika menuju produksi).
- [ ] Halaman dashboard `/` dan landing page `/web` serta sinkronisasi real-time WebSocket (`/api/sync/ws`) berjalan lancar dari jaringan internet eksternal.
- [ ] UFW firewall aktif (`sudo ufw status` menunjukkan port internal 3000 & 8091 terisolasi dari akses publik).
- [ ] Fail2ban terkonfigurasi untuk melindungi port SSH dari serangan brute-force.
- [ ] Cron job backup terjadwal mem-backup seluruh `AMS_DATA_DIR` (`app-state.json`, `rbac-db.json`, `website-published.json`, `.session-secret`) serta `pb_data` (jika aktif), dan uji restore pernah diverifikasi.

---

## 3. Langkah-Langkah Eksekusi Deployment Step-by-Step

> Tersedia pula skrip otomasi awal di `scripts/setup-vps.sh` (jalankan `sudo bash scripts/setup-vps.sh <domain>`), namun pastikan file `.env` dan `AMS_DATA_DIR` dikonfigurasi sesuai panduan di bawah sebelum service dimulai.

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

### Langkah 3: Siapkan Direktori Data Persisten & *(Opsional)* PocketBase AMS
```bash
# 1. Wajib: direktori persisten untuk rbac-db.json, app-state.json, website-published.json, .session-secret
sudo mkdir -p /var/lib/ams-data
sudo chown -R amsadmin:amsadmin /var/lib/ams-data
sudo chmod 700 /var/lib/ams-data

# 2. Opsional (hanya jika mengaktifkan proxy PocketBase /api/ams-pb):
sudo mkdir -p /opt/pocketbase-ams
cd /opt/pocketbase-ams
sudo wget https://github.com/pocketbase/pocketbase/releases/download/v0.28.1/pocketbase_0.28.1_linux_amd64.zip
sudo unzip pocketbase_0.28.1_linux_amd64.zip
sudo rm pocketbase_0.28.1_linux_amd64.zip
sudo chown -R amsadmin:amsadmin /opt/pocketbase-ams

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

sudo systemctl daemon-reload
sudo systemctl enable --now ams-pocketbase
sudo systemctl status ams-pocketbase
```

### Langkah 4: Clone, Konfigurasi `.env`, Verifikasi & Build Aplikasi
```bash
# Buat direktori aplikasi
sudo mkdir -p /var/www/ams-integrated-system/logs
sudo chown -R amsadmin:amsadmin /var/www/ams-integrated-system

# Clone repositori (login sebagai user amsadmin)
cd /var/www/ams-integrated-system
git clone https://github.com/cloud-AMS/Integrated-System-Source-Code.git .

# Buat file konfigurasi environment (ketat: chmod 600)
cat <<EOF > .env
NODE_ENV=production
PORT=3000
APP_URL=https://ams.perusahaan-anda.co.id
AMS_DATA_DIR=/var/lib/ams-data
SESSION_SECRET=$(openssl rand -hex 32)
INITIAL_SETUP_TOKEN=$(openssl rand -hex 24)
AMS_ADMIN_TOKEN=$(openssl rand -hex 24)
GEMINI_API_KEY=
EOF
chmod 600 .env

# Install dependencies & jalankan verifikasi mutu lengkap
npm ci
npm run verifikasi
```

### Langkah 5: Jalankan Aplikasi Menggunakan PM2 (Single Fork Instance)
```bash
cd /var/www/ams-integrated-system

# Jalankan menggunakan ecosystem.config.cjs (instances: 1, exec_mode: 'fork')
# Jangan gunakan mode cluster (-i 2) agar WebSocket /api/sync/ws dan state JSON tetap sinkron!
pm2 start ecosystem.config.cjs --env production

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
    add_header Content-Security-Policy "default-src \x27self\x27 \x27unsafe-inline\x27 \x27unsafe-eval\x27 https: wss: data: blob:;" always;

    client_max_body_size 25M;

    # WebSocket Sync Real-Time (/api/sync/ws)
    location /api/sync/ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Aplikasi Utama & API Express + Frontend PWA
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

    # Opsional: Proxy ke PocketBase AMS (SSE & Kanal Realtime)
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

# Dapatkan sertifikat SSL otomatis dari Let's Encrypt (+ HSTS via flag --hsts)
sudo certbot --nginx -d ams.perusahaan-anda.co.id --non-interactive --agree-tos -m it@perusahaan-anda.co.id --redirect --hsts
```

### Langkah 7: Inisialisasi Akun Admin Pertama & Pembersihan Data Dummy
```bash
# 1. Pastikan endpoint health sehat (HTTP 200)
curl -fsS https://ams.perusahaan-anda.co.id/api/health

# 2a. Opsi CLI (Direkomendasikan di produksi): buat akun developer/admin pertama lewat SSH
cd /var/www/ams-integrated-system
npm run auth:bootstrap

# 2b. Opsi Web Setup Wizard: buka https://ams.perusahaan-anda.co.id/
#     Masukkan username/password baru serta nilai INITIAL_SETUP_TOKEN dari file .env.

# 3. Setelah login pertama kali:
#    - Tambah akun staf & tetapkan peran RBAC pada menu "IT & Traceability Hub -> Akun & Peran RBAC".
#    - Jika menyiapkan lingkungan produksi bersih, buka "Pusat Purge Data Dummy" dan jalankan pembersihan data simulasi.
```

### Langkah 8: Jadwal Backup Otomatis (Cron Job)
```bash
# Buat script backup mencakup seluruh AMS_DATA_DIR (RBAC, app-state, session secret) & PocketBase
sudo bash -c 'cat <<EOF > /usr/local/bin/ams-backup.sh
#!/bin/bash
set -euo pipefail
BACKUP_DIR="/var/backups/ams"
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
mkdir -p "\$BACKUP_DIR"
chmod 700 "\$BACKUP_DIR"

# 1. Wajib: Backup direktori data server (rbac-db.json, app-state.json, website-published.json, .session-secret)
if [ -d /var/lib/ams-data ]; then
  tar -czf "\$BACKUP_DIR/ams_data_\$TIMESTAMP.tar.gz" -C /var/lib ams-data
  chmod 600 "\$BACKUP_DIR/ams_data_\$TIMESTAMP.tar.gz"
fi

# 2. Opsional: Backup basis data PocketBase (SQLite & uploads) jika digunakan
if [ -d /opt/pocketbase-ams/pb_data ]; then
  tar -czf "\$BACKUP_DIR/pocketbase_backup_\$TIMESTAMP.tar.gz" -C /opt/pocketbase-ams pb_data
  chmod 600 "\$BACKUP_DIR/pocketbase_backup_\$TIMESTAMP.tar.gz"
fi

# 3. Hapus backup lebih tua dari 14 hari
find "\$BACKUP_DIR" -type f -name "*.tar.gz" -mtime +14 -delete
EOF'

sudo chmod 700 /usr/local/bin/ams-backup.sh

# Tambahkan ke crontab root untuk backup setiap jam 02:00 pagi
(sudo crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/ams-backup.sh >/dev/null 2>&1") | sudo crontab -
```

