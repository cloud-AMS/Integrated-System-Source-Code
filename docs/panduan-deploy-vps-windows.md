# Panduan Deployment Firebase Staging di Windows Server VPS — AMS Integrated System
Dibuat oleh Langgo Bramandityo.
Dokumen ini memandu langkah lengkap untuk menjalankan **AMS Integrated System** dengan mode **Firebase Staging** (`DEPLOYMENT_ENV=staging` + `AMS_DB_DRIVER=firebase`) di **Windows Server VPS (2019 / 2022 / 2025)**.

> Untuk deployment staging di Render gunakan [panduan Render](./deployment-render-staging.md), sedangkan untuk Linux Ubuntu gunakan [panduan VPS Linux](./panduan-deploy-vps.md).
>
> **Target VPS aktif yang sudah diprovisikan:** `C:\Apps\AMS`, domain `ams.bejodigitalprint.com`, port Node `3100`, service `AMS_AppService`, data `C:\AMS\Data`. Server ini dipakai bersama aplikasi lain. Untuk alur lokal → commit/push → deploy rutin dan pemulihan snapshot, ikuti bagian Windows pada [panduan deployment VPS utama](./panduan-deploy-vps.md). Jangan memakai contoh `C:\AMS\App` atau port `3000` dari panduan lama.

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
New-Item -ItemType Directory -Force -Path C:\Apps\AMS, C:\AMS\Data, C:\AMS\Secrets, C:\AMS\Backups, C:\AMS\Logs, C:\caddy\logs | Out-Null
```

Pasang komponen berikut di Windows Server:
1. **Git for Windows** (`git --version`)
2. **Node.js v22 LTS** (`node -v` wajib `>= 22`)
3. **NSSM (Non-Sucking Service Manager)** — ekstrak `nssm.exe` (win64) ke `C:\Windows\System32` atau folder dalam `PATH`. Untuk service AMS yang sudah terpasang, skrip juga mencoba membaca lokasi NSSM dari konfigurasi service Windows.
4. **Caddy Web Server (`caddy.exe`)** — simpan ke `C:\caddy\caddy.exe` untuk HTTPS Let's Encrypt otomatis & reverse proxy WebSocket.

> Pada VPS aktif, direktori dan service ini sudah dibuat. Jangan meng-clone ulang ke `C:\Apps\AMS`, menginstal service kedua, atau mengubah Caddy/firewall sebagai bagian dari deploy rutin.

---

## 3. Clone awal (hanya instalasi baru) & isi `.env.staging`

**Lewati bagian clone bila `C:\Apps\AMS` sudah berisi aplikasi yang berjalan.** Pada VPS aktif, gunakan direktori yang sudah ada:
```powershell
Set-Location C:\Apps\AMS
Test-Path .\deploy.ps1
Test-Path .\.env.staging
```

Hanya saat membuat instalasi baru, clone ke direktori aplikasi yang kosong lalu salin template environment:
```powershell
git clone https://github.com/cloud-AMS/Integrated-System-Source-Code.git C:\Apps\AMS
Copy-Item C:\Apps\AMS\.env.staging.example C:\Apps\AMS\.env.staging
```

Pastikan variabel berikut di `C:\Apps\AMS\.env.staging` cocok dengan proyek Firebase staging dan server aktif:

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

# Firebase Admin SDK (Server-to-Server Firestore)
FIRESTORE_DATABASE_ID="(default)"
FIREBASE_FIRESTORE_DATABASE_ID="(default)"
FIRESTORE_EXPECTED_DATABASE_ID="(default)"
FIREBASE_SERVICE_ACCOUNT_PATH="C:\\AMS\\Secrets\\ams-integrated-staging-firebase-adminsdk-fbsvc-9d434aa089.json"

# Terjemahan situs publik (opsional; kunci digunakan server saja)
DEEPL_AUTH_KEY="<DeepL API key, simpan hanya di VPS>"
DEEPL_API_URL="https://api-free.deepl.com"

SESSION_SECRET="<64-karakter-hex-acak>"
INITIAL_SETUP_TOKEN="<token acak setup awal>"
BOOTSTRAP_DEV_EMAIL="cloud.ams2026@gmail.com"
FIREBASE_ADMIN_EMAILS="cloud.ams2026@gmail.com,antraderyll@gmail.com"
```

Fitur tombol **ID / EN** menerjemahkan teks CMS situs terbit menggunakan DeepL. Untuk mengaktifkannya, isi `DEEPL_AUTH_KEY` pada `.env.staging` di VPS dengan API key akun DeepL Anda. Gunakan `https://api-free.deepl.com` untuk paket Free atau `https://api.deepl.com` untuk Pro. Jangan gunakan awalan `VITE_` dan jangan kirim API key ke browser, Git, atau chat. Cache terjemahan disimpan di `AMS_DATA_DIR\website-translation-en.json`; setelah memperbarui environment, jalankan ulang deployment agar service membaca konfigurasi terbaru.

> **Konfigurasi Service Account Firebase Admin SDK (Wajib untuk koneksi server VPS → Firestore)**:
> 1. Buka Firebase Console → **Project Settings (ikon roda gigi) → Service accounts → Generate new private key**.
> 2. Simpan file JSON di luar repo, pada lokasi yang sesuai dengan `FIREBASE_SERVICE_ACCOUNT_PATH` (saat ini `C:\AMS\Secrets\ams-integrated-staging-firebase-adminsdk-fbsvc-9d434aa089.json`).
> 3. Server Express menggunakan Firestore database `(default)`. Nilai `FIRESTORE_DATABASE_ID`, `FIREBASE_FIRESTORE_DATABASE_ID`, `FIRESTORE_EXPECTED_DATABASE_ID`, dan `VITE_FIRESTORE_DATABASE_ID` harus sama; jangan memakai ID database lain sebelum diverifikasi di proyek staging.

> **Tip Membuat `SESSION_SECRET` Acak di PowerShell**:
> ```powershell
> -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
> ```

### Akun Developer Tersembunyi dan Permanen

Jangan menyimpan username/password developer di source code, Git, atau `BOOTSTRAP_DEV_PASSWORD`. Buat atau perbarui akun satu kali lewat CLI pada VPS. CLI meminta password tanpa menampilkannya, menyimpan hash scrypt ke `C:\AMS\Data\rbac-db.json`, dan menandai akun sebagai developer tersembunyi. Password maupun hash tidak dikirim ke browser; akun developer tidak muncul pada daftar pengguna RBAC biasa.

Untuk instalasi aktif di `C:\Apps\AMS`, buka PowerShell sebagai Administrator:

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

## 4. Deploy/update Windows Service (NSSM)

Setelah source di-push ke `origin/main`, jalankan PowerShell sebagai Administrator pada VPS. Untuk rilis rutin, gunakan skrip di folder aplikasi yang sudah ada:

```powershell
Set-Location C:\Apps\AMS
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\Apps\AMS\deploy.ps1 `
  -AppDir "C:\Apps\AMS" `
  -Domain "ams.bejodigitalprint.com" `
  -Port 3100
if ($LASTEXITCODE -ne 0) {
  throw "Deploy AMS gagal. Jangan menghentikan atau mengubah service aplikasi lain."
}
```

Skrip `C:\Apps\AMS\deploy.ps1` mengambil `origin/main` dengan fast-forward-only, menjalankan `npm ci`, lint, tes, dan `build:staging`, lalu memperbarui `AMS_AppService` dan health-check `127.0.0.1:3100`. Jika snapshot `public/website-published.json` berubah lokal, skrip membackupnya ke `C:\AMS\Backups`, menormalkan file sementara untuk pull, lalu memulihkan snapshot walaupun pull gagal. Perubahan tracked lainnya menghentikan proses dengan aman. Jika build gagal, skrip mencoba menjalankan kembali service AMS yang sebelumnya aktif.

> **Jangan menambahkan `-ConfigureFirewall` atau `-BlockPocketBasePort` pada rilis rutin.** Port 80/443 dan Caddy dipakai bersama oleh aplikasi lain. Jangan stop/restart Caddy, jangan mengubah port 3100, dan jangan menjalankan deploy bila `C:\caddy\Caddyfile` hilang atau konfigurasi domain bersama belum diverifikasi.

Untuk recovery jika VPS masih memakai deploy script lama yang gagal menarik update karena snapshot lokal, ikuti skrip pemulihan aman di [panduan deployment VPS utama](./panduan-deploy-vps.md#5-jika-deploy-lama-gagal-karena-snapshot-lokal). Setelah deploy, pastikan health menyatakan status aktif dan database staging yang benar:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3100/api/health" -TimeoutSec 15
Invoke-RestMethod -Uri "http://127.0.0.1:3100/api/system/db-config" -TimeoutSec 15
Invoke-RestMethod -Uri "https://ams.bejodigitalprint.com/api/health" -TimeoutSec 15
```

> **Penting (Arsitektur Single Instance)**: Jangan menjalankan dua proses `server.js` secara bersamaan karena hub WebSocket (`/api/sync/ws`) dan store JSON persisten di `C:\AMS\Data` membutuhkan satu proses Express tunggal (`instances: 1`, `exec_mode: 'fork'`).

Jangan mencampur NSSM dan PM2 untuk service aktif ini; gunakan satu pengelola proses, yaitu `AMS_AppService` via NSSM.

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
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File C:\Apps\AMS\scripts\backup-windows-vps.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
Register-ScheduledTask -TaskName "AMS_Daily_Backup" -Action $action -Trigger $trigger -User "SYSTEM" -RunLevel Highest -Force
```
