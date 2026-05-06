$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $repoRoot "AssetGuard-AI"
$frontendDir = Join-Path $repoRoot "assetguard-ui"
$extractionDir = Join-Path $repoRoot "gjp-assetguard-extraction-tool"

if (-not (Test-Path $backendDir)) {
    throw "Backend folder not found: $backendDir"
}

if (-not (Test-Path $frontendDir)) {
    throw "Frontend folder not found: $frontendDir"
}

$backendCmdTemplate = @'
Set-Location '__BACKEND_DIR__'

Write-Host '== AssetGuard Backend Bootstrap ==' -ForegroundColor Cyan

if (-not (Test-Path '.\.venv\Scripts\Activate.ps1') -and -not (Test-Path '.\venv\Scripts\Activate.ps1')) {
    Write-Host '[First-time] No backend virtual environment found. Creating .venv ...' -ForegroundColor Yellow
    python -m venv .venv
}

if (Test-Path '.\.venv\Scripts\Activate.ps1') {
    $pyExe = '.\.venv\Scripts\python.exe'
    Write-Host 'Using backend venv: .venv' -ForegroundColor Green
} else {
    $pyExe = '.\venv\Scripts\python.exe'
    Write-Host 'Using backend venv: venv' -ForegroundColor Green
}

if (-not (Test-Path $pyExe)) {
    throw "Python executable not found in venv: $pyExe"
}

Write-Host 'Python executable path:' (Resolve-Path $pyExe) -ForegroundColor Green
& $pyExe -m pip install --upgrade pip

Write-Host 'Ensuring backend dependencies from requirements.txt ...' -ForegroundColor Cyan
& $pyExe -m pip install -r requirements.txt

$bootstrapMarker = '.dev_bootstrap_done'
$dbPath = '.\instance\assetguard.db'
$dbExistedBeforeUpgrade = Test-Path $dbPath
$markerExists = Test-Path $bootstrapMarker

Write-Host 'Running database migrations: flask db upgrade ...' -ForegroundColor Cyan
& $pyExe -m flask --app assetguard_app.py db upgrade

if (-not $markerExists -or -not $dbExistedBeforeUpgrade) {
    if (-not $dbExistedBeforeUpgrade) {
        Write-Host "[Bootstrap] Database file was missing before startup ($dbPath). Running flask seed ..." -ForegroundColor Yellow
    } elseif (-not $markerExists) {
        Write-Host '[First-time] Bootstrap marker missing. Running flask seed ...' -ForegroundColor Yellow
    }
    & $pyExe -m flask --app assetguard_app.py seed
    if ($LASTEXITCODE -eq 0) {
        New-Item -ItemType File -Path $bootstrapMarker -Force | Out-Null
        Write-Host '[First-time] Bootstrap completed. Marker file created.' -ForegroundColor Green
    }
} else {
    Write-Host '[Normal] Bootstrap marker found and database existed before startup. Skip flask seed.' -ForegroundColor Green
}

Write-Host 'Starting backend server on http://127.0.0.1:5000 ...' -ForegroundColor Cyan
& $pyExe -m flask --app assetguard_app.py run
'@

$frontendCmdTemplate = @'
Set-Location '__FRONTEND_DIR__'

Write-Host '== AssetGuard Frontend Bootstrap ==' -ForegroundColor Cyan

if (-not (Test-Path '.\node_modules')) {
    Write-Host '[First-time] node_modules not found. Running npm install ...' -ForegroundColor Yellow
    npm install
} else {
    Write-Host '[Normal] node_modules exists. Skip npm install.' -ForegroundColor Green
}

Write-Host 'Starting frontend dev server ...' -ForegroundColor Cyan
npm run dev
'@

$extractionCmdTemplate = @'
# Extraction tool runs in its own window; failures here must NOT affect backend/frontend.
try {
Set-Location '__EXTRACTION_DIR__'

Write-Host '== AssetGuard Extraction Tool Bootstrap ==' -ForegroundColor Cyan

if (-not (Test-Path '.\.venv\Scripts\Activate.ps1') -and -not (Test-Path '.\venv\Scripts\Activate.ps1')) {
    Write-Host '[First-time] No extraction-tool virtual environment found. Creating .venv ...' -ForegroundColor Yellow
    python -m venv .venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host '[Extraction skipped] Failed to create venv (.venv).' -ForegroundColor Yellow
        return
    }
}

if (Test-Path '.\.venv\Scripts\Activate.ps1') {
    $pyExe = '.\.venv\Scripts\python.exe'
    Write-Host 'Using extraction-tool venv: .venv' -ForegroundColor Green
} else {
    $pyExe = '.\venv\Scripts\python.exe'
    Write-Host 'Using extraction-tool venv: venv' -ForegroundColor Green
}

if (-not (Test-Path $pyExe)) {
    Write-Host '[Extraction skipped] Python executable not found in venv: ' $pyExe -ForegroundColor Yellow
    return
}

Write-Host 'Python executable path:' (Resolve-Path $pyExe) -ForegroundColor Green

& $pyExe -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) {
    Write-Host '[Extraction skipped] pip upgrade failed.' -ForegroundColor Yellow
    return
}

Write-Host 'Ensuring extraction-tool dependencies from requirements.txt ...' -ForegroundColor Cyan
& $pyExe -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host '[Extraction skipped] pip install -r requirements.txt failed.' -ForegroundColor Yellow
    return
}

if (-not (Test-Path '.\.env')) {
    Write-Host '[Warning] .env file not found in extraction tool folder. Some features may not work.' -ForegroundColor Yellow
}

Write-Host 'Starting extraction tool server on http://127.0.0.1:5001 ...' -ForegroundColor Cyan
$env:FLASK_RUN_PORT = '5001'
& $pyExe -m flask --app app.py run --port 5001
}
catch {
    Write-Host '[Extraction skipped] Error during extraction tool startup:' $_.Exception.Message -ForegroundColor Yellow
}
'@

$backendCmd = $backendCmdTemplate.Replace("__BACKEND_DIR__", $backendDir)
$frontendCmd = $frontendCmdTemplate.Replace("__FRONTEND_DIR__", $frontendDir)
$extractionCmd = $extractionCmdTemplate.Replace("__EXTRACTION_DIR__", $extractionDir)

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

Start-Sleep -Milliseconds 500

if (Test-Path $extractionDir) {
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "`$Host.UI.RawUI.WindowTitle='AssetGuard Extraction Tool'; $extractionCmd"
    )
    Write-Host "Also started extraction tool in a separate window."
    Write-Host "  Backend:        http://127.0.0.1:5000"
    Write-Host "  Frontend:       (see frontend window for Vite URL)"
    Write-Host "  Extraction:     http://127.0.0.1:5001"
} else {
    Write-Host "[Warning] Extraction tool folder not found; skipping extraction server: $extractionDir" -ForegroundColor Yellow
    Write-Host "  Backend:        http://127.0.0.1:5000"
    Write-Host "  Frontend:       (see frontend window for Vite URL)"
}
