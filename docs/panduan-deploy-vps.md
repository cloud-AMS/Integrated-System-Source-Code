# Panduan Deployment VPS — AMS Integrated System

> **Target deployment aktif:** Windows Server VPS bersama aplikasi lain. Ikuti bagian **Prosedur Deployment Saat Ini — Windows Server Staging** terlebih dahulu. Folder aplikasi `C:\Apps\AMS`, domain `ams.bejodigitalprint.com`, dan port aplikasi `3100`.
>
> **Peringatan VPS bersama:** Jangan menjalankan perintah Linux di VPS Windows. Jangan menghentikan/restart Caddy, mengubah port aplikasi lain, menjalankan `-ConfigureFirewall` pada deployment rutin, atau memakai `-BlockPocketBasePort`. VPS ini juga menjalankan aplikasi lain (termasuk Bejo Stiker POS). Skrip rutin hanya boleh mengelola `AMS_AppService`.
>
> Bagian Linux di bawah adalah panduan historis untuk VPS Ubuntu yang terpisah, bukan untuk server Windows aktif ini. Untuk konfigurasi Windows lebih lengkap, lihat [panduan VPS Windows](./panduan-deploy-vps-windows.md). Untuk preview Oracle Cloud, lihat [panduan Oracle Cloud + Firebase](./deployment-oracle-free-preview.md).

Panduan ini menjelaskan alur rilis dari komputer lokal ke Windows Server VPS Firebase Staging, termasuk pengaturan layanan dan verifikasi pasca-deploy.

---

## Prosedur Deployment Saat Ini — Windows Server Staging

### 1. Alur rilis dari komputer lokal

Lakukan langkah ini pada komputer pengembangan, di folder repositori:

```powershell
# Ganti dengan folder repositori pada komputer lokal Anda
Set-Location "<jalur-repo-lokal>\AMS Integrated System"
git switch main
git status --short
npm run lint
npm test
npm run build:staging
```

Pastikan pemeriksaan lulus dan tinjau perubahan sebelum commit. Stage hanya file yang memang menjadi bagian rilis; jangan memakai `git add -A` tanpa memeriksa daftar file.

```powershell
git add -- <file-yang-memang-akan-dirilis>
git diff --cached --check
git diff --cached
git commit -m "jenis(perubahan): ringkasan"
git push origin main
git status --short
git log -1 --oneline
```

Jangan commit `.env`, API key, Service Account JSON, `.session-secret`, database lokal di `data-preview/`, atau file backup. Setelah push berhasil, konfirmasikan commit yang dikirim dan berikan pengguna opsi deploy Windows VPS dengan skrip siap jalan; **push tidak sama dengan deploy** dan tidak memberi izin untuk menjalankan perintah di VPS tanpa persetujuan pengguna.

### 2. Target VPS dan pengaturan tetap

| Pengaturan | Nilai untuk VPS aktif | Catatan |
|---|---|---|
| Folder source | `C:\Apps\AMS` | Branch `main`; deploy script `C:\Apps\AMS\deploy.ps1` |
| Domain publik | `ams.bejodigitalprint.com` | DNS dan TLS dikelola Caddy yang juga melayani aplikasi lain |
| Port Node.js AMS | `3100` | Akses aplikasi melalui Caddy/HTTPS; jangan mengganti tanpa memastikan port baru kosong dan proxy ikut disesuaikan |
| Service aplikasi | `AMS_AppService` | Satu proses Node.js; hanya service ini yang dihentikan/dijalankan oleh deploy |
| Reverse proxy | Caddy (`C:\caddy\Caddyfile`) | Konfigurasi dipakai bersama; jangan timpa atau restart manual |
| Data persisten | `C:\AMS\Data` | Tidak berada di repo; jangan dihapus ketika update source |
| Backup | `C:\AMS\Backups` | Termasuk backup snapshot situs saat diperlukan |
| Log AMS | `C:\AMS\Logs` | Log service Windows |
| Rahasia | `C:\AMS\Secrets` | Service Account Firebase, di luar repo |
| Environment | `C:\Apps\AMS\.env.staging` | Jangan commit atau mengirim isinya ke chat |
| Firebase | `ams-integrated-staging` | Firestore Database ID `(default)`; gunakan nilai dari Firebase Console |

Sebelum deploy pertama kali, buka **PowerShell as Administrator** dan pastikan jalur berikut benar. Jangan menjalankan langkah instalasi/clone pada folder yang sudah berisi aplikasi:

```powershell
Test-Path C:\Apps\AMS\deploy.ps1
Test-Path C:\Apps\AMS\.env.staging
Test-Path C:\caddy\Caddyfile
Test-Path C:\AMS\Data
Get-Service -Name AMS_AppService
Get-Service -Name Caddy -ErrorAction SilentlyContinue
Get-Service -Name CaddyWebServer -ErrorAction SilentlyContinue
```

Jika `C:\caddy\Caddyfile` tidak ada, atau Anda tidak dapat memastikan konfigurasi itu memuat route aplikasi yang ada, **berhenti dan minta administrator VPS memeriksa Caddy**. Jangan biarkan skrip membuat Caddyfile baru pada server bersama sebelum semua hostname aplikasi lain dipertahankan.

Periksa secara read-only bahwa konfigurasi yang ada mengarahkan domain AMS ke port yang benar. Tinjau hasilnya; jangan mengedit atau me-reload Caddy untuk deployment aplikasi rutin:

```powershell
Select-String -Path "C:\caddy\Caddyfile" -Pattern "ams\.bejodigitalprint\.com"
Select-String -Path "C:\caddy\Caddyfile" -Pattern "127\.0\.0\.1:3100"
```

### 3. Isi `.env.staging` di VPS

File yang dipakai service adalah `C:\Apps\AMS\.env.staging`. Buka langsung di VPS dengan Notepad (jalankan Notepad sebagai Administrator bila diperlukan):

```powershell
notepad C:\Apps\AMS\.env.staging
```

Pastikan variabel berikut diset. Ganti placeholder Firebase/token dengan nilai yang benar dari proyek staging dan simpan semua rahasia hanya di VPS:

```env
NODE_ENV="production"
PORT="3100"
APP_URL="https://ams.bejodigitalprint.com"
DEPLOYMENT_ENV="staging"
VITE_DEPLOYMENT_ENV="staging"
AMS_DB_DRIVER="firebase"
AMS_DATA_DIR="C:\\AMS\\Data"

VITE_FIREBASE_API_KEY="<dari Firebase Web App staging>"
VITE_FIREBASE_AUTH_DOMAIN="ams-integrated-staging.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="ams-integrated-staging"
VITE_FIREBASE_STORAGE_BUCKET="ams-integrated-staging.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="<dari Firebase Web App staging>"
VITE_FIREBASE_APP_ID="<dari Firebase Web App staging>"
VITE_FIRESTORE_DATABASE_ID="(default)"
VITE_FIREBASE_ADMIN_EMAIL="cloud.ams2026@gmail.com"

FIRESTORE_DATABASE_ID="(default)"
FIREBASE_FIRESTORE_DATABASE_ID="(default)"
FIRESTORE_EXPECTED_DATABASE_ID="(default)"
FIREBASE_SERVICE_ACCOUNT_PATH="C:\\AMS\\Secrets\\ams-integrated-staging-firebase-adminsdk-fbsvc-9d434aa089.json"

SESSION_SECRET="<64 karakter hex acak>"
INITIAL_SETUP_TOKEN="<token acak untuk setup awal>"
AMS_ADMIN_TOKEN=""
BOOTSTRAP_DEV_USERNAME="dev.admin"
BOOTSTRAP_DEV_FULLNAME="Langgo Bramandityo"
BOOTSTRAP_DEV_EMAIL="cloud.ams2026@gmail.com"
BOOTSTRAP_DEV_ROLE_ID="Developer & IT Support"
BOOTSTRAP_DEV_PASSWORD_HASH=""
BOOTSTRAP_DEV_PASSWORD=""
FIREBASE_ADMIN_EMAILS="cloud.ams2026@gmail.com,antraderyll@gmail.com"

# Opsional: terjemahan otomatis bahasa Inggris pada website publik
DEEPL_AUTH_KEY="<DeepL API key; hanya disimpan di VPS>"
DEEPL_API_URL="https://api-free.deepl.com"
```

`DEEPL_API_URL` memakai `https://api-free.deepl.com` untuk DeepL API Free atau `https://api.deepl.com` untuk Pro. Jangan memakai awalan `VITE_` untuk key DeepL. `SESSION_SECRET`, `INITIAL_SETUP_TOKEN`, kredensial Google/Firebase, dan DeepL key tidak boleh masuk Git atau dibagikan di chat. Buat nilai token acak langsung di VPS, misalnya:

```powershell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

Pastikan file Service Account benar-benar ada pada path yang ditentukan tanpa membuka atau menyalin isi JSON ke terminal/chat:

```powershell
Test-Path "C:\AMS\Secrets\ams-integrated-staging-firebase-adminsdk-fbsvc-9d434aa089.json"
```

Jika path file Service Account berbeda, ubah hanya nilai `FIREBASE_SERVICE_ACCOUNT_PATH` agar cocok. Jangan menebak ID database Firestore; untuk target aktif gunakan `(default)` yang sudah diverifikasi.

### 4. Deploy rutin setelah commit dan push

Setelah pengguna menyetujui deploy, buka **PowerShell as Administrator** di VPS. Jalankan skrip berikut persis; ia akan mengambil update `origin/main`, menjalankan pemeriksaan/build, memperbarui hanya `AMS_AppService`, lalu memeriksa health lokal:

```powershell
$ErrorActionPreference = "Stop"
$AppDir = "C:\Apps\AMS"
Set-Location -LiteralPath $AppDir

git -C $AppDir status --short
if ($LASTEXITCODE -ne 0) {
  throw "Tidak dapat membaca status repositori AMS."
}

& powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File (Join-Path $AppDir "deploy.ps1") `
  -AppDir $AppDir `
  -Domain "ams.bejodigitalprint.com" `
  -Port 3100
if ($LASTEXITCODE -ne 0) {
  throw "Deploy AMS gagal. Jangan menghentikan atau mengubah service aplikasi lain."
}

Invoke-RestMethod -Uri "http://127.0.0.1:3100/api/health" -TimeoutSec 15
Invoke-RestMethod -Uri "http://127.0.0.1:3100/api/system/db-config" -TimeoutSec 15
```

**Jangan tambahkan** `-ConfigureFirewall` pada deploy rutin. Jangan gunakan `-BlockPocketBasePort`, `Stop-Service Caddy`, `Restart-Service Caddy`, `git reset`, `git clean`, atau force-pull. Port `80/443` dan Caddy dipakai bersama, sedangkan port `3100` adalah port internal AMS. Skrip update saat ini mempertahankan `public/website-published.json` lokal dengan backup di `C:\AMS\Backups`; perubahan tracked lainnya menghentikan deploy agar tidak terhapus. Periksa output `Health OK`, `deploymentEnv=staging`, proyek Firebase staging, dan database `(default)`.

### 5. Jika deploy lama gagal karena snapshot lokal

Jika output menyebut perubahan lokal `public/website-published.json` akan tertimpa, kemungkinan `deploy.ps1` di VPS masih versi lama. Jangan commit snapshot itu dan jangan membuang perubahannya. Jalankan pemulihan satu kali berikut dari PowerShell Administrator; script menyimpan backup, melakukan fast-forward `main`, lalu memulihkan snapshot:

```powershell
$ErrorActionPreference = "Stop"
$AppDir = "C:\Apps\AMS"
$SnapshotRelative = "public/website-published.json"
$SnapshotPath = Join-Path $AppDir $SnapshotRelative
$BackupDir = "C:\AMS\Backups"

if (-not (Test-Path -LiteralPath $SnapshotPath -PathType Leaf)) {
  throw "Snapshot tidak ditemukan; hentikan dan periksa repositori sebelum melanjutkan."
}
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$BackupPath = Join-Path $BackupDir ("website-published-manual-{0}.json" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
Copy-Item -LiteralPath $SnapshotPath -Destination $BackupPath

try {
  & git -C $AppDir restore --source=HEAD --staged --worktree -- $SnapshotRelative
  if ($LASTEXITCODE -ne 0) { throw "Gagal menyiapkan snapshot untuk fast-forward." }
  & git -C $AppDir pull --ff-only origin main
  if ($LASTEXITCODE -ne 0) { throw "Fast-forward gagal; snapshot akan dipulihkan dari backup." }
} finally {
  Copy-Item -LiteralPath $BackupPath -Destination $SnapshotPath -Force
}

& powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File (Join-Path $AppDir "deploy.ps1") `
  -AppDir $AppDir `
  -Domain "ams.bejodigitalprint.com" `
  -Port 3100 `
  -SkipGitUpdate
if ($LASTEXITCODE -ne 0) {
  throw "Build/deploy gagal. Backup snapshot tersedia di $BackupPath."
}
```

Jangan menjalankan pemulihan ini bila ada perubahan tracked selain snapshot atau branch bukan `main`; minta administrator memeriksa keadaan Git. Backup manual disimpan di `C:\AMS\Backups`.

### 6. Perilaku dan batas aman VPS bersama

- `deploy.ps1` menjalankan `npm ci`, lint, tes, dan `build:staging`. Jika `AMS_AppService` sedang berjalan, hanya service AMS yang dihentikan sementara dan dijalankan kembali setelah build.
- Caddy tidak dihentikan/restart pada deploy rutin. Jangan ubah Caddyfile bersama untuk rilis aplikasi tanpa meninjau route seluruh domain lain.
- Jangan mengubah firewall VPS bersama pada rilis aplikasi biasa. Pengaturan firewall memerlukan pemeriksaan terpisah karena berlaku untuk seluruh server.
- Jangan menjalankan dua proses `server.js`/dua instance AMS; WebSocket dan file data memerlukan satu instance.
- Data aplikasi tetap berada di `C:\AMS\Data`; jangan menghapus folder ini saat memperbarui source. Pastikan backup harian `C:\AMS\Backups` berjalan.
- Jika build, health check, service, port `3100`, atau pemeriksaan Firebase gagal, simpan output error dan hentikan proses. Jangan mencoba memperbaiki dengan menghentikan Caddy atau service aplikasi lain.

---

## Linux legacy — VPS Ubuntu terpisah (bukan VPS Windows aktif)

> **Jangan jalankan perintah pada bagian ini di `C:\Apps\AMS` atau Windows Server.** Instruksi ini hanya untuk operator yang memang menyediakan VPS Ubuntu terpisah.

### A. Rekomendasi Spesifikasi Server VPS

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

### B. Checklist Kesiapan Deployment (Production Checklist)

> **Catatan Kejujuran**: item bertanda `[x]` di bawah adalah aspek yang **sudah terverifikasi pada repositori kode sumber**. Item yang bergantung pada provisioning server VPS target, DNS, SSL, Nginx/UFW, dan uji akses publik **tetap `[ ]`** hingga dieksekusi di VPS target.

#### A. Checklist Pra-Deployment (Persiapan VPS & Rahasia)
- [ ] Domain aktif terarah ke IP VPS (Contoh: `ams.mitraselaras.co.id` & `web.mitraselaras.co.id` via A-Record DNS).
- [ ] Akses SSH Key terpasang (Password authentication SSH dinonaktifkan).
- [ ] Pengguna non-root dengan privilege `sudo` telah dibuat (misal: `amsadmin`).
- [ ] Port firewall dasar diamankan (Hanya buka port 22/SSH, 80/HTTP, 443/HTTPS).
- [ ] Variabel lingkungan disiapkan di `.env` VPS (`APP_URL`, `AMS_DATA_DIR`, `SESSION_SECRET`, `INITIAL_SETUP_TOKEN`, `AMS_ADMIN_TOKEN`, `GEMINI_API_KEY`).

#### B. Checklist Saat Deployment (Instalasi & Verifikasi)
- [ ] Node.js v22.x LTS dan npm terbaru terpasang di VPS target.
- [ ] Git terinstal dan repository di-clone ke `/var/www/ams-integrated-system`.
- [ ] Direktori data persisten server (`AMS_DATA_DIR=/var/lib/ams-data`) dibuat dan dimiliki oleh user runtime (`amsadmin`).
- [ ] *(Opsional jika memakai jalur legacy PocketBase)* Binary PocketBase Linux (v0.28+) terpasang di `/opt/pocketbase-ams` dan berjalan via systemd di `127.0.0.1:8091`.
- [ ] Dependensi `npm ci` berhasil di VPS target tanpa audit error kritis.
- [x] **Verifikasi kode sumber di repositori**: `npm run lint` (`tsc --noEmit`) dan `npm test` (22 file / 256 tes Vitest) lulus pada pengembangan lokal. *(Wajib dijalankan ulang melalui `deploy.ps1` di Windows VPS; daftar tes ini tidak mengklaim hasil pemeriksaan di VPS Linux.)*
- [x] **Kompilasi staging di repositori**: `npm run build:staging` menghasilkan `dist/` (termasuk PWA `sw.js`) dan `server.js` dengan status sukses pada Windows lokal. *(Catatan: Vite memberi peringatan chunk >500 kB; ukuran chunk bukan error build. Hasil Linux VPS belum diverifikasi.)*
- [ ] PM2 menjalankan `ecosystem.config.cjs` (**1 instance fork**) dengan konfigurasi startup otomatis saat reboot (`pm2 save` & `pm2 startup`).
- [ ] Reverse Proxy (Nginx atau Caddy) aktif mengarahkan port 443 HTTPS ke `127.0.0.1:3000` (termasuk dukungan `Upgrade` WebSocket untuk `/api/sync/ws`).
- [ ] Sertifikat SSL Let's Encrypt terpasang otomatis (HTTPS Grade A) + header HSTS aktif.

#### C. Checklist Pasca-Deployment (Keamanan, Inisialisasi & Pemeliharaan)
- [ ] Endpoint `/api/health` mengembalikan JSON `status: "aktif"`, `rbacAktif: true`, dan `realtimeSyncAktif: true` (HTTP 200).
- [ ] Akun Developer/IT Admin pertama telah dibuat melalui **Setup Wizard** (`/`) atau CLI `npm run auth:bootstrap` dan terverifikasi login lintas browser/internet.
- [ ] Data simulasi/dummy dibersihkan melalui **IT & Traceability Hub → Pusat Purge Data Dummy** sebelum input data operasional asli (jika menuju produksi).
- [ ] Halaman dashboard `/` dan landing page `/web` serta sinkronisasi real-time WebSocket (`/api/sync/ws`) berjalan lancar dari jaringan internet eksternal.
- [ ] UFW firewall aktif (`sudo ufw status` menunjukkan port internal 3000 & 8091 terisolasi dari akses publik).
- [ ] Fail2ban terkonfigurasi untuk melindungi port SSH dari serangan brute-force.
- [ ] Cron job backup terjadwal mem-backup seluruh `AMS_DATA_DIR` (`app-state.json`, `rbac-db.json`, `website-published.json`, `.session-secret`) serta `pb_data` (jika aktif), dan uji restore pernah diverifikasi.

---

### C. Langkah-Langkah Eksekusi Linux

> Tersedia pula skrip otomasi awal di `scripts/setup-vps.sh` (jalankan `sudo bash scripts/setup-vps.sh <domain>`), namun pastikan file `.env` dan `AMS_DATA_DIR` dikonfigurasi sesuai panduan di bawah sebelum service dimulai.

#### Langkah 1: Update Server & Hardening Awal
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

#### Langkah 2: Instalasi Node.js 22 LTS & PM2
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

#### Langkah 3: Siapkan Direktori Data Persisten & *(Opsional)* PocketBase AMS
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

#### Langkah 4: Clone, Konfigurasi `.env`, Verifikasi & Build Aplikasi
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

#### Langkah 5: Jalankan Aplikasi Menggunakan PM2 (Single Fork Instance)
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

#### Langkah 6: Konfigurasi Nginx Reverse Proxy & SSL Let's Encrypt
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

#### Langkah 7: Inisialisasi Akun Admin Pertama & Pembersihan Data Dummy
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

#### Langkah 8: Jadwal Backup Otomatis (Cron Job)
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

