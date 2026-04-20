$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $repoRoot "AssetGuard AI"
$frontendDir = Join-Path $repoRoot "assetguard-ui"

if (-not (Test-Path $backendDir)) {
    throw "Backend folder not found: $backendDir"
}

if (-not (Test-Path $frontendDir)) {
    throw "Frontend folder not found: $frontendDir"
}

$backendCmd = @"
Set-Location '$backendDir'
if (Test-Path '.\.venv\Scripts\Activate.ps1') {
    . '.\.venv\Scripts\Activate.ps1'
} elseif (Test-Path '.\venv\Scripts\Activate.ps1') {
    . '.\venv\Scripts\Activate.ps1'
} else {
    Write-Host 'No .venv/venv found. Using system Python.' -ForegroundColor Yellow
}
python -m flask --app assetguard_app.py run
"@

$frontendCmd = @"
Set-Location '$frontendDir'
if (-not (Test-Path '.\node_modules')) {
    Write-Host 'node_modules not found, running npm install...' -ForegroundColor Yellow
    npm install
}
npm run dev
"@

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$Host.UI.RawUI.WindowTitle='AssetGuard Backend'; $backendCmd"
)

Start-Sleep -Milliseconds 500

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$Host.UI.RawUI.WindowTitle='AssetGuard Frontend'; $frontendCmd"
)

Write-Host "Started backend and frontend in two new PowerShell windows."
