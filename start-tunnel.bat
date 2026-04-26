@echo off
REM Daily-use launcher for Unity AI Lab admin portal in LOCAL TUNNEL MODE.
REM Opens 2 terminal windows: backend (npm run dev) + Cloudflare Tunnel.
REM
REM Run this AFTER one-time setup via scripts\setup-cloudflare-tunnel-local.ps1.
REM
REM Both windows must stay open. Closing either takes the portal down.

setlocal
cd /d "%~dp0"

REM Verify cloudflared is on PATH
where cloudflared >nul 2>&1
if errorlevel 1 (
    echo ERROR: cloudflared not on PATH.
    echo Run scripts\setup-cloudflare-tunnel-local.ps1 first ^(as Administrator^).
    pause
    exit /b 1
)

REM Verify server/.env exists
if not exist "server\.env" (
    echo ERROR: server\.env missing.
    echo Run scripts\setup-cloudflare-tunnel-local.ps1 first to generate it.
    pause
    exit /b 1
)

REM Look up the tunnel name from the cloudflared config
set TUNNEL_NAME=admin-portal-local

echo Starting Unity AI Lab admin portal in local-tunnel mode...
echo.
echo  Backend:  opening in window 'Unity Backend'
echo  Tunnel:   opening in window 'Unity Cloudflare Tunnel'
echo.
echo Once both are running, your portal is live at:
echo   https://admin.unityailab.com/
echo   https://admin.unityailab.com/admin/
echo.
echo Closing either window takes the portal down.
echo.

start "Unity Backend" cmd /k "cd /d %~dp0 && echo === BACKEND === && npm run dev"

REM Tiny pause so the backend gets a head start binding port 3000
timeout /t 3 /nobreak >nul

start "Unity Cloudflare Tunnel" cmd /k "cd /d %~dp0 && echo === TUNNEL === && cloudflared tunnel run %TUNNEL_NAME%"

echo.
echo Both windows opened. Look at them for live logs.
echo.
echo Press any key to close THIS launcher window (the backend + tunnel keep running).
pause >nul
