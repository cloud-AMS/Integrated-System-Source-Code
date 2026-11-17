<#
.SYNOPSIS
  Backup otomatis data persisten AMS Integrated System pada Windows Server VPS.
.DESCRIPTION
  Mengarsipkan C:\AMS\Data (rbac-db.json, app-state.json, website-published.json, .session-secret, db-driver.json)
  serta folder pb_data PocketBase (jika digunakan) ke C:\AMS\Backups dengan retensi default 14 hari.
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\backup-windows-vps.ps1
#>

[CmdletBinding()]
param(
  [string]$DataDir = "C:\AMS\Data",
  [string]$BackupDir = "C:\AMS\Backups",
  [string]$PocketBaseDataDir = "C:\pocketbase-ams\pb_data",
  [int]$RetentionDays = 14
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

if (Test-Path $DataDir) {
  $dataZip = Join-Path $BackupDir "ams_data_$timestamp.zip"
  Compress-Archive -Path (Join-Path $DataDir "*") -DestinationPath $dataZip -Force
  Write-Host "Backup AMS Data dibuat: $dataZip" -ForegroundColor Green
} else {
  Write-Warning "Direktori data '$DataDir' tidak ditemukan; dilewati."
}

if (Test-Path $PocketBaseDataDir) {
  $pbZip = Join-Path $BackupDir "pocketbase_data_$timestamp.zip"
  Compress-Archive -Path (Join-Path $PocketBaseDataDir "*") -DestinationPath $pbZip -Force
  Write-Host "Backup PocketBase dibuat: $pbZip" -ForegroundColor Green
}

$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "*.zip" | Where-Object { $_.LastWriteTime -lt $cutoff } | Remove-Item -Force
Write-Host "Retensi backup ($RetentionDays hari) selesai diterapkan di $BackupDir." -ForegroundColor Cyan
