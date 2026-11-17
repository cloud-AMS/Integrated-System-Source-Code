<#
.SYNOPSIS
  Automasi Build & Deployment AMS Integrated System (Firebase Staging) pada Windows Server VPS.
.DESCRIPTION
  Script ini menyiapkan direktori persisten Windows (C:\AMS\Data), memvalidasi .env.staging,
  menjalankan build Vite mode staging (npm run build:staging), mendaftarkan/me-restart service NSSM
  (AMS_AppService & CaddyWebServer), mengonfigurasi firewall opsional, serta memverifikasi /api/health.
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\deploy-windows-vps.ps1 -Domain "staging-ams.perusahaan-anda.co.id" -ConfigureFirewall
#>

[CmdletBinding()]
param(
  [string]$Domain = "staging-ams.perusahaan-anda.co.id",
  [string]$AppDir = "C:\AMS\App",
  [string]$DataDir = "C:\AMS\Data",
  [string]$SecretsDir = "C:\AMS\Secrets",
  [string]$LogsDir = "C:\AMS\Logs",
  [string]$BackupDir = "C:\AMS\Backups",
  [string]$CaddyDir = "C:\caddy",
  [string]$EnvFileName = ".env.staging",
  [int]$Port = 3000,
  [switch]$SkipTests,
  [switch]$ConfigureFirewall,
  [switch]$SkipServiceRestart
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) {
  Write-Host "`n[AMS Windows Staging] $msg" -ForegroundColor Cyan
}

function Assert-Command([string]$cmd, [string]$installHint) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    throw "Perintah '$cmd' tidak ditemukan. $installHint"
  }
}

Write-Step "1. Memeriksa prasyarat sistem & versi Node.js..."
Assert-Command "node" "Pasang Node.js v22 LTS dari https://nodejs.org/"
Assert-Command "npm" "Pastikan npm ikut terpasang bersama Node.js v22 LTS."

$nodeMajor = [int]((node -v).TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 22) {
  throw "Node.js minimal versi 22 diperlukan. Versi aktif saat ini: $(node -v)"
}
Write-Host "Node.js aktif: $(node -v)" -ForegroundColor Green

if (-not (Test-Path $AppDir)) {
  $AppDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
  Write-Host "Menggunakan direktori aplikasi saat ini: $AppDir" -ForegroundColor Yellow
}

Write-Step "2. Menyiapkan direktori persisten Windows di luar folder source..."
$caddyLogs = Join-Path $CaddyDir "logs"
New-Item -ItemType Directory -Force -Path $AppDir, $DataDir, $SecretsDir, $LogsDir, $BackupDir, $CaddyDir, $caddyLogs | Out-Null

$envPath = Join-Path $AppDir $EnvFileName
$exampleEnvPath = Join-Path $AppDir ".env.staging.example"
if (-not (Test-Path $envPath)) {
  if (Test-Path $exampleEnvPath) {
    Copy-Item $exampleEnvPath $envPath
    throw "File '$envPath' belum ada sehingga disalin dari .env.staging.example. Isi dulu nilai VITE_FIREBASE_* & SESSION_SECRET lalu jalankan ulang script ini."
  } else {
    throw "File '$envPath' tidak ditemukan."
  }
}

Write-Step "3. Memvalidasi konfigurasi Firebase Staging dari $EnvFileName..."
$envMap = @{}
Get-Content $envPath -Encoding UTF8 | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $eqIdx = $line.IndexOf("=")
  if ($eqIdx -lt 1) { return }
  $key = $line.Substring(0, $eqIdx).Trim()
  $val = $line.Substring($eqIdx + 1).Trim().Trim('"').Trim("'")
  $envMap[$key] = $val
}

$requiredKeys = @(
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIRESTORE_DATABASE_ID",
  "SESSION_SECRET"
)

foreach ($rk in $requiredKeys) {
  $val = $envMap[$rk]
  if ([string]::IsNullOrWhiteSpace($val) -or $val -like "GANTI_*") {
    throw "Variabel '$rk' di '$envPath' belum diisi dengan nilai staging yang valid."
  }
}

[Environment]::SetEnvironmentVariable("DEPLOYMENT_ENV", "staging", "Process")
[Environment]::SetEnvironmentVariable("VITE_DEPLOYMENT_ENV", "staging", "Process")
[Environment]::SetEnvironmentVariable("AMS_DB_DRIVER", "firebase", "Process")
[Environment]::SetEnvironmentVariable("AMS_DATA_DIR", $DataDir, "Process")

Write-Step "4. Menginstal dependensi & membangun aplikasi (Vite Staging + server.js)..."
Push-Location $AppDir
try {
  npm ci
  if (-not $SkipTests) {
    npm run lint
    npm test
  }
  npm run build:staging
} finally {
  Pop-Location
}

if ($ConfigureFirewall) {
  Write-Step "5. Mengonfigurasi Windows Defender Firewall (buka 80/443, blokir akses langsung ke $Port/8091)..."
  $rulesToEnsure = @(
    @{ Name = "AMS-HTTP-80"; Port = 80; Action = "Allow" },
    @{ Name = "AMS-HTTPS-443"; Port = 443; Action = "Allow" },
    @{ Name = "AMS-Block-Direct-Node-$Port"; Port = $Port; Action = "Block" },
    @{ Name = "AMS-Block-Direct-PocketBase-8091"; Port = 8091; Action = "Block" }
  )
  foreach ($rule in $rulesToEnsure) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($existing) { Remove-NetFirewallRule -DisplayName $rule.Name }
    New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Protocol TCP -LocalPort $rule.Port -Action $rule.Action | Out-Null
  }
}

$caddyfilePath = Join-Path $CaddyDir "Caddyfile"
if (-not (Test-Path $caddyfilePath)) {
  Write-Step "Menulis Caddyfile awal ke $caddyfilePath..."
  $caddyContent = @"
# Caddyfile AMS Integrated System (Firebase Staging - Windows Server VPS)
$Domain {
    encode gzip zstd

    reverse_proxy 127.0.0.1:$Port {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    log {
        output file $CaddyDir\logs\ams_access.log {
            roll_size 20mb
            roll_keep 10
        }
    }
}
"@
  Set-Content -Path $caddyfilePath -Value $caddyContent -Encoding UTF8
}

if (-not $SkipServiceRestart) {
  Write-Step "6. Mengatur service Windows via NSSM (1 instance tunggal)..."
  Assert-Command "nssm" "Pasang NSSM dari https://nssm.cc/download dan masukkan ke PATH Windows."
  $nodeExe = (Get-Command node).Source
  $serverJs = Join-Path $AppDir "server.js"
  $svcName = "AMS_AppService"

  $svcExists = Get-Service -Name $svcName -ErrorAction SilentlyContinue
  if (-not $svcExists) {
    & nssm install $svcName $nodeExe $serverJs
  } else {
    & nssm set $svcName Application $nodeExe
    & nssm set $svcName AppParameters $serverJs
  }
  $firestoreDbId = if ($envMap["FIREBASE_FIRESTORE_DATABASE_ID"]) { $envMap["FIREBASE_FIRESTORE_DATABASE_ID"] } elseif ($envMap["VITE_FIRESTORE_DATABASE_ID"]) { $envMap["VITE_FIRESTORE_DATABASE_ID"] } else { "ai-studio-amsintegratedsys-a6cc9862-667b-4eea-be94-96098a1c9439" }
  $defaultSaPath = Join-Path $SecretsDir "firebase-service-account.json"
  $saPath = if ($envMap["FIREBASE_SERVICE_ACCOUNT_PATH"]) { $envMap["FIREBASE_SERVICE_ACCOUNT_PATH"] } else { $defaultSaPath }
  if (-not (Test-Path $saPath) -and -not $envMap["FIREBASE_SERVICE_ACCOUNT_JSON"]) {
    Write-Host "Peringatan: File Service Account Admin SDK belum ditemukan di '$saPath'. Server akan berjalan pada mode fallback hingga file JSON diletakkan." -ForegroundColor Yellow
  }

  & nssm set $svcName AppDirectory $AppDir
  & nssm set $svcName AppEnvironmentExtra "NODE_ENV=production" "DEPLOYMENT_ENV=staging" "VITE_DEPLOYMENT_ENV=staging" "AMS_DB_DRIVER=firebase" "PORT=$Port" "AMS_DATA_DIR=$DataDir" "FIREBASE_FIRESTORE_DATABASE_ID=$firestoreDbId" "FIREBASE_SERVICE_ACCOUNT_PATH=$saPath"
  & nssm set $svcName AppStdout (Join-Path $LogsDir "service_output.log")
  & nssm set $svcName AppStderr (Join-Path $LogsDir "service_error.log")
  & nssm set $svcName AppRotateFiles 1
  & nssm set $svcName AppRotateBytes 10485760
  & nssm set $svcName Start SERVICE_AUTO_START
  & nssm restart $svcName

  $caddyExe = Join-Path $CaddyDir "caddy.exe"
  if (Test-Path $caddyExe) {
    $caddySvc = Get-Service -Name "CaddyWebServer" -ErrorAction SilentlyContinue
    if (-not $caddySvc) {
      & nssm install CaddyWebServer $caddyExe "run --config $caddyfilePath"
    }
    & nssm set CaddyWebServer AppDirectory $CaddyDir
    & nssm set CaddyWebServer AppStdout (Join-Path $caddyLogs "caddy_stdout.log")
    & nssm set CaddyWebServer AppStderr (Join-Path $caddyLogs "caddy_stderr.log")
    & nssm set CaddyWebServer Start SERVICE_AUTO_START
    & nssm restart CaddyWebServer
  } else {
    Write-Host "Catatan: $caddyExe belum ditemukan; lewati registrasi CaddyWebServer." -ForegroundColor Yellow
  }

  Start-Sleep -Seconds 3
  Write-Step "7. Memeriksa endpoint kesehatan lokal http://127.0.0.1:$Port/api/health..."
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/health" -TimeoutSec 15
  $dbCfg = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/system/db-config" -TimeoutSec 15
  Write-Host "Health OK: status=$($health.status), env=$($health.deploymentEnv), firebaseProjectId=$($dbCfg.firebase.projectId), adminConnected=$($dbCfg.firebaseAdmin.connected), databaseId=$($dbCfg.firebaseAdmin.databaseId)" -ForegroundColor Green
}

Write-Host "`nDeployment Firebase Staging di Windows Server VPS selesai." -ForegroundColor Green
Write-Host "Jangan lupa tambahkan '$Domain' ke Firebase Console -> Authentication -> Settings -> Authorized domains!" -ForegroundColor Yellow
