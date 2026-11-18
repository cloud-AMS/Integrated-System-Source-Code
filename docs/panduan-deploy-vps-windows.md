# Panduan Deployment Firebase Staging di Windows Server VPS — AMS Integrated System
Dibuat oleh Langgo Bramandityo.
Dokumen ini memandu langkah lengkap untuk menjalankan **AMS Integrated System** dengan mode **Firebase Staging** (`DEPLOYMENT_ENV=staging` + `AMS_DB_DRIVER=firebase`) di **Windows Server VPS (2019 / 2022 / 2025)**.

> Untuk deployment staging di Render gunakan [panduan Render](./deployment-render-staging.md), sedangkan untuk Linux Ubuntu gunakan [panduan VPS Linux](./panduan-deploy-vps.md).

---

## 1. Siapkan Proyek Firebase Staging Terpisah

Jangan memakai kredensial production atau `firebase-applet-config.json` secara langsung untuk server staging publik.

1. Buka [Firebase Console](https://console.firebase.google.com/) menggunakan akun Google resmi (`cloud.ams2026@gmail.com`).
2. Buat proyek Firebase baru khusus staging (misalnya `ams-integrated-staging`).
3. Daftarkan aplikasi **Web App** pada proyek staging tersebut dan catat nilai konfigurasi:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Aktifkan **Authentication → Sign-in method → Google**.
5. Buat database **Cloud Firestore** dengan Database ID `(default)` (lokasi disarankan `asia-southeast2` / Jakarta atau `asia-southeast1` / Singapore).
6. Publikasikan aturan keamanan dari `firestore.rules` pada repositori ini ke proyek staging:
   ```powershell
   npx eslint firestore.rules
   npx firebase login
   npx firebase deploy --only firestore:rules --project <FIREBASE_STAGING_PROJECT_ID>
   ```
7. Tambahkan hostname domain staging Anda (tanpa `https://`, misalnya `ams.bejodigitalprint.com`) pada **Firebase Authentication → Settings → Authorized domains**.

---

## 2. Siapkan Prasyarat di Windows Server VPS

Buka **PowerShell (Run as Administrator)** dan siapkan direktori terpisah antara kode aplikasi dan data persisten:

```powershell
New-Item -ItemType Directory -Force -Path C:\AMS\App, C:\AMS\Data, C:\AMS\Secrets, C:\AMS\Backups, C:\AMS\Logs, C:\caddy\logs | Out-Null
```

Pasang komponen berikut di Windows Server:
1. **Git for Windows** (`git --version`)
2. **Node.js v22 LTS** (`node -v` wajib `>= 22`)
3. **NSSM (Non-Sucking Service Manager)** — ekstrak `nssm.exe` (win64) ke `C:\Windows\System32` atau folder dalam `PATH`. Untuk service AMS yang sudah terpasang, skrip juga mencoba membaca lokasi NSSM dari konfigurasi service Windows.
4. **Caddy Web Server (`caddy.exe`)** — simpan ke `C:\caddy\caddy.exe` untuk HTTPS Let's Encrypt otomatis & reverse proxy WebSocket.

---

## 3. Clone Repositori & Isi `.env.staging`

```powershell
cd C:\AMS\App
git clone https://github.com/cloud-AMS/Integrated-System-Source-Code.git .
Copy-Item .env.staging.example .env.staging
notepad .env.staging
```

Pastikan minimal variabel berikut di `C:\AMS\App\.env.staging` terisi lengkap:

```env
NODE_ENV=production
PORT=3000
APP_URL=https://ams.bejodigitalprint.com
DEPLOYMENT_ENV=staging
VITE_DEPLOYMENT_ENV=staging
AMS_DB_DRIVER=firebase
AMS_DATA_DIR=C:\AMS\Data

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...firebaseapp.com
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIRESTORE_DATABASE_ID=(default)
VITE_FIREBASE_ADMIN_EMAIL=cloud.ams2026@gmail.com

# Firebase Admin SDK (Server-to-Server Firestore)
FIRESTORE_DATABASE_ID=(default)
FIREBASE_FIRESTORE_DATABASE_ID=(default)
FIRESTORE_EXPECTED_DATABASE_ID=(default)
FIREBASE_SERVICE_ACCOUNT_PATH=C:\AMS\Secrets\firebase-service-account.json

SESSION_SECRET=<64-karakter-hex-acak>
INITIAL_SETUP_TOKEN=<token-setup-awal>
BOOTSTRAP_DEV_EMAIL=cloud.ams2026@gmail.com
FIREBASE_ADMIN_EMAILS=cloud.ams2026@gmail.com,antraderyll@gmail.com
```

> **Konfigurasi Service Account Firebase Admin SDK (Wajib untuk koneksi server VPS → Firestore)**:
> 1. Buka Firebase Console → **Project Settings (ikon roda gigi) → Service accounts → Generate new private key**.
> 2. Simpan file JSON yang diunduh ke `C:\AMS\Secrets\firebase-service-account.json` (jangan taruh di dalam `C:\AMS\App` agar tidak pernah ikut ter-commit ke Git).
> 3. Untuk project staging saat ini, Server Express menghubungkan Admin SDK ke database Firestore `(default)`. Nilai koneksi dan target validasi harus sama di `FIRESTORE_DATABASE_ID`, `FIREBASE_FIRESTORE_DATABASE_ID`, `FIRESTORE_EXPECTED_DATABASE_ID`, dan `VITE_FIRESTORE_DATABASE_ID`.

> **Tip Membuat `SESSION_SECRET` Acak di PowerShell**:
> ```powershell
> -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
> ```

### Akun Developer Tersembunyi dan Permanen

Jangan menyimpan username/password developer di source code, Git, atau `BOOTSTRAP_DEV_PASSWORD`. Buat atau perbarui akun satu kali lewat CLI pada VPS. CLI meminta password tanpa menampilkannya, menyimpan hash scrypt ke `C:\AMS\Data\rbac-db.json`, dan menandai akun sebagai developer tersembunyi. Password maupun hash tidak dikirim ke browser; akun developer tidak muncul pada daftar pengguna RBAC biasa.

Untuk instalasi yang berada di `C:\Apps\AMS`, buka PowerShell sebagai Administrator:

```powershell
$ErrorActionPreference = "Stop"
$service = Get-Service -Name "AMS_AppService" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
  Stop-Service -Name "AMS_AppService"
}

Set-Location C:\Apps\AMS
$env:DEPLOYMENT_ENV = "staging"
$env:VITE_DEPLOYMENT_ENV = "staging"
$env:AMS_DATA_DIR = "C:\AMS\Data"

New-Item -ItemType Directory -Force -Path "C:\AMS\Data", "C:\AMS\Backups" | Out-Null
if (Test-Path "C:\AMS\Data\rbac-db.json") {
  Copy-Item "C:\AMS\Data\rbac-db.json" `
    ("C:\AMS\Backups\rbac-db-before-dev-update-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".json")
} else {
  Write-Host "Database RBAC belum ada; CLI akan membuatnya di C:\AMS\Data."
}

npm run auth:bootstrap -- --username "USERNAME_DEVELOPER"
if ($LASTEXITCODE -ne 0) {
  throw "Provisioning akun gagal. Periksa pesan CLI; service tetap berhenti."
}

Start-Service -Name "AMS_AppService"
```

Ganti `USERNAME_DEVELOPER` dengan username yang diinginkan. Masukkan password baru dan konfirmasinya saat prompt CLI meminta; input password tidak ditampilkan. Akun disimpan dalam data persisten dan tetap ada setelah restart maupun pembaruan source selama `AMS_DATA_DIR` tidak dihapus atau diganti. Batasi akses Windows ke folder `C:\AMS\Data` dan backup-nya untuk administrator/server account yang memerlukan akses.

`BOOTSTRAP_DEV_PASSWORD_HASH` hanya digunakan untuk bootstrap otomatis ketika database RBAC masih kosong; mengubah variabel itu tidak merotasi password pada akun yang sudah ada. Untuk pembuatan atau rotasi akun yang eksplisit, gunakan CLI di atas. Jangan membagikan password, hash, atau file backup.

---

## 4. Jalankan Build Staging & Pasang Windows Service

Gunakan skrip otomasi resmi dari repositori:

```powershell
cd C:\AMS\App
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 `
  -Domain "ams.bejodigitalprint.com" `
  -Port 3100 `
  -ConfigureFirewall
```

Skrip tunggal `C:\AMS\App\deploy.ps1` akan memperbarui branch Git `main` secara fast-forward-only, lalu otomatis. Snapshot situs hasil publikasi `public/website-published.json` dipertahankan saat pemeriksaan perubahan; perubahan source tracked lainnya tetap menghentikan deploy. Jika service `AMS_AppService` sedang berjalan, skrip menghentikannya sementara selama `npm ci` agar file dependensi native tidak terkunci, lalu menjalankannya kembali setelah build. Jika build gagal, skrip mencoba memulihkan service ke status sebelumnya:
- Menjalankan `npm ci`, `npm run lint`, `npm test`, dan `npm run build:staging` (sehingga Vite mengompilasi aset `dist/` menggunakan `.env.staging`).
- Membuka port `80` & `443` di Windows Defender Firewall serta menutup akses langsung dari internet ke port internal yang ditentukan oleh `-Port` (3100 pada contoh) & `8091`.
- Membuat `C:\caddy\Caddyfile` dengan dukungan HTTPS otomatis + WebSocket `/api/sync/ws`.
- Mendaftarkan `AMS_AppService` (**1 instance tunggal**) dan memperbarui service Caddy yang sudah terpasang, atau mendaftarkan `CaddyWebServer` bila belum ada.

> **Penting (Arsitektur Single Instance)**: Jangan menjalankan dua proses `server.js` secara bersamaan karena hub WebSocket (`/api/sync/ws`) dan store JSON persisten di `C:\AMS\Data` membutuhkan satu proses Express tunggal (`instances: 1`, `exec_mode: 'fork'`).

Jika Anda memilih **PM2 di Windows** alih-alih NSSM:
```powershell
npm install -g pm2
cd C:\AMS\App
npm run build:staging
pm2 start ecosystem.config.cjs --env staging
```

---

## 5. Verifikasi Pasca-Deployment & Sinkronisasi Firebase

1. Uji endpoint lokal maupun domain publik:
   ```powershell
   Invoke-RestMethod -Uri "https://ams.bejodigitalprint.com/api/health"
   Invoke-RestMethod -Uri "https://ams.bejodigitalprint.com/api/system/db-config"
   ```
   Pastikan `deploymentEnv` bernilai `"staging"`, `activeDriver` bernilai `"firebase"`, dan `firebase.projectId` sesuai dengan proyek Firebase Staging Anda.
2. Buat akun administrator pertama melalui **Setup Wizard** di browser (`https://ams.bejodigitalprint.com/`) atau lewat CLI PowerShell:
   ```powershell
   $env:DEPLOYMENT_ENV="staging"
   npm run auth:bootstrap
   ```
3. Setelah masuk, buka **IT & Traceability Hub → User Account & Roles (RBAC Server)** untuk membuat akun terpisah bagi tiap pengguna. Pilih role dan kata sandi masing-masing; akun serta hash kata sandi disimpan oleh server pada `AMS_DATA_DIR\rbac-db.json`, sehingga pengguna dari perangkat/internet lain memakai layanan akun yang sama. Data akun/role lama di state sinkronisasi (`rb_akun`/`rb_role`) tidak lagi digunakan atau dimigrasikan; buat akun pada RBAC Server. Jangan berbagi satu sandi antar-pengguna.
4. Masuk dengan akun baru dari browser/perangkat lain untuk memverifikasi autentikasi dan izin role melalui server.
5. Masuk ke menu **IT & Traceability Hub → Penyimpanan & Sinkronisasi → Hubungkan Google Firebase**, lalu jalankan **Sinkronkan 2-Arah Firebase** untuk memverifikasi baca/tulis Firestore Staging berjalan normal.

---

## 6. Jadwal Backup Harian di Windows Task Scheduler

Daftarkan tugas backup harian `C:\AMS\Data` ke `C:\AMS\Backups` setiap pukul 02:00 WIB:

```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\AMS\App\scripts\backup-windows-vps.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
Register-ScheduledTask -TaskName "AMS_Daily_Backup" -Action $action -Trigger $trigger -User "SYSTEM" -RunLevel Highest -Force
```
