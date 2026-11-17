export interface WindowsDeploymentGuides {
  environment: 'staging' | 'production' | 'development';
  isStaging: boolean;
  caddyfile: string;
  nssmCommands: string[];
  envStagingTemplate: string;
  powershellQuickDeploy: string[];
}

export function buildWindowsDeploymentGuides(opts?: {
  domain?: string;
  deploymentEnv?: string;
  activeDriver?: 'firebase' | 'pocketbase';
  firebaseProjectId?: string;
}): WindowsDeploymentGuides {
  const rawEnv = (opts?.deploymentEnv || 'staging').trim().toLowerCase();
  const environment =
    rawEnv === 'staging' ? 'staging' : rawEnv === 'production' ? 'production' : 'development';
  const isStaging = environment === 'staging';
  const domain = (opts?.domain || (isStaging ? 'staging-ams.perusahaan-anda.co.id' : 'ams.perusahaan-anda.co.id')).trim();
  const firebaseProjectId = opts?.firebaseProjectId || '<FIREBASE_STAGING_PROJECT_ID>';

  const caddyfile = `# Caddyfile Konfigurasi Reverse Proxy + HTTPS Otomatis (Windows Server VPS)
# Lokasi file: C:\\caddy\\Caddyfile
# Catatan: Pastikan domain ${domain} sudah ditambahkan ke Firebase Auth -> Authorized domains

${domain} {
    encode gzip zstd

    # Reverse proxy utama (Express API + SPA + WebSocket /api/sync/ws)
    reverse_proxy 127.0.0.1:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    # Header Keamanan Standar Medis & Privasi Data (UU PDP)
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Opsional (Hanya jika mode PocketBase diaktifkan kembali pada 127.0.0.1:8091)
    # handle_path /api/ams-pb/* {
    #     reverse_proxy 127.0.0.1:8091
    # }

    log {
        output file C:\\caddy\\logs\\ams_access.log {
            roll_size 20mb
            roll_keep 10
        }
    }
}`;

  const nssmCommands = [
    '# ===== 1. PERSIAPAN DIREKTORI & BUILD STAGING FIREBASE (PowerShell Admin) =====',
    'New-Item -ItemType Directory -Force -Path C:\\AMS\\App, C:\\AMS\\Data, C:\\AMS\\Secrets, C:\\AMS\\Backups, C:\\AMS\\Logs, C:\\caddy\\logs | Out-Null',
    'cd C:\\AMS\\App',
    'Copy-Item .env.staging.example .env.staging -Force  # lalu isi nilai Firebase Staging Project (' + firebaseProjectId + ') & taruh key JSON di C:\\AMS\\Secrets\\firebase-service-account.json',
    'npm ci',
    'npm run build:staging   # Membaca .env.staging (VITE_DEPLOYMENT_ENV=staging + VITE_FIREBASE_*) & build server.js',
    '',
    '# ===== 2. PASANG NODE EXPRESS SERVICE (WAJIB 1 INSTANCE TUNGGAL) =====',
    'nssm install AMS_AppService "C:\\Program Files\\nodejs\\node.exe" "C:\\AMS\\App\\server.js"',
    'nssm set AMS_AppService AppDirectory "C:\\AMS\\App"',
    'nssm set AMS_AppService AppEnvironmentExtra NODE_ENV=production DEPLOYMENT_ENV=staging VITE_DEPLOYMENT_ENV=staging AMS_DB_DRIVER=firebase PORT=3000 AMS_DATA_DIR=C:\\AMS\\Data FIREBASE_FIRESTORE_DATABASE_ID=ai-studio-amsintegratedsys-a6cc9862-667b-4eea-be94-96098a1c9439 FIREBASE_SERVICE_ACCOUNT_PATH=C:\\AMS\\Secrets\\firebase-service-account.json',
    'nssm set AMS_AppService AppStdout "C:\\AMS\\Logs\\service_output.log"',
    'nssm set AMS_AppService AppStderr "C:\\AMS\\Logs\\service_error.log"',
    'nssm set AMS_AppService Start SERVICE_AUTO_START',
    'nssm restart AMS_AppService',
    '',
    '# ===== 3. PASANG CADDY WEB SERVER (PORT 80/443 HTTPS + WEBSOCKET) =====',
    'nssm install CaddyWebServer "C:\\caddy\\caddy.exe" "run --config C:\\caddy\\Caddyfile"',
    'nssm set CaddyWebServer AppDirectory "C:\\caddy"',
    'nssm set CaddyWebServer AppStdout "C:\\caddy\\logs\\caddy_stdout.log"',
    'nssm set CaddyWebServer AppStderr "C:\\caddy\\logs\\caddy_stderr.log"',
    'nssm restart CaddyWebServer',
    '',
    '# ===== 4. VERIFIKASI ENDPOINT STAGING =====',
    'Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/health"',
    'Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/system/db-config"'
  ];

  const envStagingTemplate = `# Simpan sebagai C:\\AMS\\App\\.env.staging (JANGAN di-commit ke Git)
NODE_ENV=production
PORT=3000
APP_URL=https://${domain}
DEPLOYMENT_ENV=staging
VITE_DEPLOYMENT_ENV=staging
AMS_DB_DRIVER=firebase
AMS_DATA_DIR=C:\\AMS\\Data

# Firebase Staging Web App Config (Project terpisah dari production/AI Studio)
VITE_FIREBASE_API_KEY=GANTI_DENGAN_API_KEY_STAGING
VITE_FIREBASE_AUTH_DOMAIN=GANTI_PROJECT_STAGING.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=GANTI_PROJECT_STAGING
VITE_FIREBASE_STORAGE_BUCKET=GANTI_PROJECT_STAGING.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=GANTI_SENDER_ID_STAGING
VITE_FIREBASE_APP_ID=1:GANTI:web:STAGING
VITE_FIRESTORE_DATABASE_ID=ai-studio-amsintegratedsys-a6cc9862-667b-4eea-be94-96098a1c9439
VITE_FIREBASE_ADMIN_EMAIL=cloud.ams2026@gmail.com

# Firebase Admin SDK Server-to-Server (simpan JSON di C:\\AMS\\Secrets)
FIREBASE_FIRESTORE_DATABASE_ID=ai-studio-amsintegratedsys-a6cc9862-667b-4eea-be94-96098a1c9439
FIREBASE_SERVICE_ACCOUNT_PATH=C:\\AMS\\Secrets\\firebase-service-account.json

# Rahasia Server (Buat minimal 48 karakter acak di PowerShell)
SESSION_SECRET=GANTI_DENGAN_RANDOM_HEX_64_KARAKTER
INITIAL_SETUP_TOKEN=GANTI_TOKEN_SETUP_AWAL_STAGING
BOOTSTRAP_DEV_EMAIL=cloud.ams2026@gmail.com
FIREBASE_ADMIN_EMAILS=cloud.ams2026@gmail.com,antraderyll@gmail.com`;

  const powershellQuickDeploy = [
    '# Jalankan di PowerShell Administrator pada Windows Server VPS:',
    'cd C:\\AMS\\App',
    'powershell -ExecutionPolicy Bypass -File .\\scripts\\deploy-windows-vps.ps1 -Domain "' + domain + '" -ConfigureFirewall',
    '',
    '# Verifikasi rules Firebase Staging sebelum membuka login Google:',
    'npx eslint firestore.rules',
    'npx firebase deploy --only firestore:rules --project <FIREBASE_STAGING_PROJECT_ID>'
  ];

  return {
    environment,
    isStaging,
    caddyfile,
    nssmCommands,
    envStagingTemplate,
    powershellQuickDeploy
  };
}
