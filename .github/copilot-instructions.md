# Repository-specific deployment handoff

After completing a task that successfully commits and pushes changes, always offer the user the option to deploy and include a ready-to-run PowerShell command for the shared Windows VPS:

```powershell
$ErrorActionPreference = "Stop"
$AppDir = "C:\Apps\AMS"
Set-Location -LiteralPath $AppDir
& powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File (Join-Path $AppDir "deploy.ps1") `
  -AppDir $AppDir `
  -Domain "ams.bejodigitalprint.com" `
  -Port 3100
if ($LASTEXITCODE -ne 0) {
  throw "Deploy AMS gagal. Jangan menghentikan atau mengubah service aplikasi lain."
}
Invoke-RestMethod -Uri "http://127.0.0.1:3100/api/health" -TimeoutSec 15
```

Explain that it must be run in PowerShell as Administrator on the VPS and that the deployment script updates `origin/main`. If the push was not to `origin/main`, state that the pushed branch must first be merged into `main`; do not imply it is deployable yet.

The VPS is shared with other applications. Never include `-ConfigureFirewall` or `-BlockPocketBasePort` in the routine deploy command, and never stop/restart Caddy or another application's service. Do not execute a remote deployment without the user's explicit approval. State clearly that providing the script is an option, not confirmation that deployment has occurred.
