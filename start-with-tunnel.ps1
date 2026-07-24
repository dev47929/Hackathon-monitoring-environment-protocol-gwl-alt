param()

$BackendPort = 3000
$FrontendPort = 8080
$RootDir = $PSScriptRoot
$BackendDir = Join-Path $RootDir 'backend'
$FrontendDir = Join-Path $RootDir 'hackproof-ai'
$CloudflaredPath = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$EnvFile = Join-Path $FrontendDir '.env'

$backendTunnelLog = Join-Path $env:TEMP "backend_tunnel_$(Get-Random).log"
$frontendTunnelLog = Join-Path $env:TEMP "frontend_tunnel_$(Get-Random).log"

$global:running = $true

function Cleanup {
    if (-not $global:running) { return }
    $global:running = $false
    Write-Host "`n[cleanup] Shutting down..." -ForegroundColor Yellow
    Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Job -Name "Backend", "Frontend" -ErrorAction SilentlyContinue | Stop-Job | Remove-Job
    Remove-Item $backendTunnelLog, $frontendTunnelLog -ErrorAction SilentlyContinue
    Write-Host "[cleanup] Stopped." -ForegroundColor Yellow
}

function Kill-ProcessOnPort {
    param([int]$Port)
    $connections = netstat -ano | Select-String ":$Port\s"
    foreach ($c in $connections) {
        $parts = $c -split '\s+'
        if ($parts.Count -ge 5) {
            $foundPid = $parts[-1]
            if ($foundPid -match '^\d+$') {
                Stop-Process -Id $foundPid -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

try {

# Kill stale processes on target ports
Kill-ProcessOnPort $BackendPort
Kill-ProcessOnPort $FrontendPort
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force

Start-Sleep -Seconds 1

# ────────────────────────────────────────────────────────────────────
# 1. Start Backend
# ────────────────────────────────────────────────────────────────────
Write-Host ">>> Starting backend (port $BackendPort)..." -ForegroundColor Cyan
$backendJob = Start-Job -Name "Backend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev 2>&1
} -ArgumentList $BackendDir

Start-Sleep -Seconds 4

# ────────────────────────────────────────────────────────────────────
# 2. Start Backend Tunnel
# ────────────────────────────────────────────────────────────────────
Write-Host ">>> Starting Cloudflare tunnel for backend..." -ForegroundColor Cyan
$bp = Start-Process -FilePath $CloudflaredPath `
    -ArgumentList "tunnel --url http://localhost:$BackendPort" `
    -NoNewWindow -RedirectStandardError $backendTunnelLog -PassThru

# ────────────────────────────────────────────────────────────────────
# 3. Poll for Backend Tunnel URL
# ────────────────────────────────────────────────────────────────────
$backendUrl = $null
Write-Host "   Waiting for backend tunnel URL..." -ForegroundColor Gray
$timeout = 90
$elapsed = 0
while (-not $backendUrl -and $elapsed -lt $timeout -and $global:running) {
    if (Test-Path $backendTunnelLog) {
        $content = Get-Content $backendTunnelLog -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $m = [regex]::Match($content, 'https://[a-zA-Z0-9_-]+\.trycloudflare\.com')
            if ($m.Success) {
                $backendUrl = $m.Value.Trim()
                Write-Host "   Backend tunnel URL: $backendUrl" -ForegroundColor Green
            }
        }
    }
    Start-Sleep -Seconds 1
    $elapsed++
}
if (-not $backendUrl) { throw "Timed out waiting for backend tunnel URL" }

# ────────────────────────────────────────────────────────────────────
# 4. Update Frontend .env
# ────────────────────────────────────────────────────────────────────
Write-Host ">>> Updating frontend .env..." -ForegroundColor Cyan
$lines = @()
if (Test-Path $EnvFile) { $lines = Get-Content $EnvFile }
$lines = $lines | Where-Object { $_ -notmatch '^VITE_API_BASE_URL=' }
$lines += "VITE_API_BASE_URL=`"$backendUrl`""
$lines | Set-Content $EnvFile -Force

# ────────────────────────────────────────────────────────────────────
# 5. Start Frontend
# ────────────────────────────────────────────────────────────────────
Write-Host ">>> Starting frontend (port $FrontendPort)..." -ForegroundColor Cyan
$frontendJob = Start-Job -Name "Frontend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev 2>&1
} -ArgumentList $FrontendDir

Start-Sleep -Seconds 4

# ────────────────────────────────────────────────────────────────────
# 6. Start Frontend Tunnel
# ────────────────────────────────────────────────────────────────────
Write-Host ">>> Starting Cloudflare tunnel for frontend..." -ForegroundColor Cyan
$fp = Start-Process -FilePath $CloudflaredPath `
    -ArgumentList "tunnel --url http://localhost:$FrontendPort" `
    -NoNewWindow -RedirectStandardError $frontendTunnelLog -PassThru

# ────────────────────────────────────────────────────────────────────
# 7. Poll for Frontend Tunnel URL
# ────────────────────────────────────────────────────────────────────
$frontendUrl = $null
Write-Host "   Waiting for frontend tunnel URL..." -ForegroundColor Gray
$elapsed = 0
while (-not $frontendUrl -and $elapsed -lt $timeout -and $global:running) {
    if (Test-Path $frontendTunnelLog) {
        $content = Get-Content $frontendTunnelLog -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $m = [regex]::Match($content, 'https://[a-zA-Z0-9_-]+\.trycloudflare\.com')
            if ($m.Success) {
                $frontendUrl = $m.Value.Trim()
                Write-Host "   Frontend tunnel URL: $frontendUrl" -ForegroundColor Green
            }
        }
    }
    Start-Sleep -Seconds 1
    $elapsed++
}
if (-not $frontendUrl) { throw "Timed out waiting for frontend tunnel URL" }

# ────────────────────────────────────────────────────────────────────
# 8. Summary
# ────────────────────────────────────────────────────────────────────
$border = '=' * 60
Write-Host "`n$border" -ForegroundColor Magenta
Write-Host "  ALL SERVICES RUNNING" -ForegroundColor Magenta
Write-Host "$border" -ForegroundColor Magenta
Write-Host "  Backend API  : $backendUrl" -ForegroundColor Green
Write-Host "  Frontend App : $frontendUrl" -ForegroundColor Green
Write-Host "  Health Check : $backendUrl/health" -ForegroundColor Green
Write-Host "$border" -ForegroundColor Magenta
Write-Host "  Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host "$border`n" -ForegroundColor Magenta

# ────────────────────────────────────────────────────────────────────
# 9. Stream Output
# ────────────────────────────────────────────────────────────────────
$btPos = 0; $ftPos = 0

while ($global:running) {
    # Backend npm output
    $bo = Receive-Job $backendJob
    if ($bo) { foreach ($l in $bo) { Write-Host "$l" } }

    # Frontend npm output
    $fo = Receive-Job $frontendJob
    if ($fo) { foreach ($l in $fo) { Write-Host "$l" } }

    # Backend tunnel new output
    if (Test-Path $backendTunnelLog) {
        $all = Get-Content $backendTunnelLog -Raw -ErrorAction SilentlyContinue
        if ($all -and $all.Length -gt $btPos) {
            Write-Host $all.Substring($btPos) -NoNewline -ForegroundColor DarkGray
            $btPos = $all.Length
        }
    }

    # Frontend tunnel new output
    if (Test-Path $frontendTunnelLog) {
        $all = Get-Content $frontendTunnelLog -Raw -ErrorAction SilentlyContinue
        if ($all -and $all.Length -gt $ftPos) {
            Write-Host $all.Substring($ftPos) -NoNewline -ForegroundColor DarkGray
            $ftPos = $all.Length
        }
    }

    if ($bp.HasExited -and $global:running) { Write-Host "[error] Backend tunnel exited" -ForegroundColor Red; break }
    if ($fp.HasExited -and $global:running) { Write-Host "[error] Frontend tunnel exited" -ForegroundColor Red; break }
    if ($backendJob.State -ne 'Running' -and $global:running) {
        $bo = Receive-Job $backendJob
        if ($bo) { foreach ($l in $bo) { Write-Host "$l" } }
        Write-Host "[error] Backend stopped" -ForegroundColor Red; break
    }
    if ($frontendJob.State -ne 'Running' -and $global:running) {
        $fo = Receive-Job $frontendJob
        if ($fo) { foreach ($l in $fo) { Write-Host "$l" } }
        Write-Host "[error] Frontend stopped" -ForegroundColor Red; break
    }

    Start-Sleep -Milliseconds 500
}

} catch {
    Write-Host "[fatal] $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
} finally {
    Cleanup
}
