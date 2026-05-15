@echo off
title DUNGEON MASTER: THE HUNT - local launcher

echo.
echo ====================================
echo   DUNGEON MASTER: THE HUNT - local launcher
echo ====================================
echo.

pushd "%~dp0"
set "PROJECT_DIR=%CD%"
echo Project: %PROJECT_DIR%
echo.

REM === STEP 0: Sync .env to js\env.local.js =========================
echo [0/3] Syncing .env to js\env.local.js...
if not exist "%PROJECT_DIR%\.env" (
    echo   - No .env at project root, skipping sync.
    goto :step1
)
if not exist "%PROJECT_DIR%\scripts\sync-env.ps1" (
    echo   ! scripts\sync-env.ps1 missing, skipping sync.
    goto :step1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_DIR%\scripts\sync-env.ps1"
if errorlevel 1 (
    echo   ! Sync failed but non-fatal. Continuing with existing js\env.local.js if present.
)
echo.

:step1
REM === STEP 1: Ollama check + auto-start ============================
echo [1/3] Checking Ollama...

where ollama >nul 2>&1
if errorlevel 1 (
    echo   X Ollama not found on PATH.
    echo.
    echo   Download from https://ollama.com/download and install,
    echo   OR the landing page will show install instructions.
    echo.
    echo   Continuing without Ollama - the game still runs,
    echo   but girls won't talk until Ollama is running.
    echo.
    goto :find_server
)

echo   + Ollama found.
echo   + Setting OLLAMA_ORIGINS=* for browser access
setx OLLAMA_ORIGINS "*" >nul 2>&1
set "OLLAMA_ORIGINS=*"

REM Check if Ollama is already serving
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo   + Launching Ollama in a new window...
    start "Ollama serve" cmd /k "set OLLAMA_ORIGINS=* && ollama serve"
    echo   + Waiting 4 seconds for Ollama to come up...
    powershell -NoProfile -Command "Start-Sleep -Seconds 4" >nul 2>&1
) else (
    echo   + Ollama already running at localhost:11434
)

echo.

:find_server
REM === STEP 2: Find a local static server =============================
echo [2/3] Finding a local web server...

set "SERVER_CMD="
set "SERVER_LABEL="

where python >nul 2>&1
if not errorlevel 1 (
    if exist "%PROJECT_DIR%\scripts\serve.py" (
        set "SERVER_CMD=python scripts\serve.py 9535"
        set "SERVER_LABEL=Python no-cache server"
    ) else (
        set "SERVER_CMD=python -m http.server 9535"
        set "SERVER_LABEL=Python http.server"
    )
    goto :have_server
)

where py >nul 2>&1
if not errorlevel 1 (
    if exist "%PROJECT_DIR%\scripts\serve.py" (
        set "SERVER_CMD=py scripts\serve.py 9535"
        set "SERVER_LABEL=Python launcher (no-cache server)"
    ) else (
        set "SERVER_CMD=py -m http.server 9535"
        set "SERVER_LABEL=Python launcher"
    )
    goto :have_server
)

where npx >nul 2>&1
if not errorlevel 1 (
    set "SERVER_CMD=npx --yes http-server . -p 9535 -c-1 --cors"
    set "SERVER_LABEL=Node npx http-server"
    goto :have_server
)

where php >nul 2>&1
if not errorlevel 1 (
    set "SERVER_CMD=php -S localhost:9535"
    set "SERVER_LABEL=PHP built-in server"
    goto :have_server
)

echo.
echo   X No local web server found.
echo.
echo   Install ONE of these so the game can be served over HTTP:
echo     - Python 3:  https://python.org/downloads/  (recommended, smallest)
echo     - Node.js:   https://nodejs.org/
echo     - PHP:       https://windows.php.net/download/
echo.
echo   (Opening a local .html file directly does NOT work -
echo    browsers block fetch() / modules / etc. on file:// URLs.)
echo.
pause
popd
exit /b 1

:have_server
echo   + Using: %SERVER_LABEL%
echo.

REM === STEP 3: Open browser + start server ===========================
echo [3/3] Starting server on http://localhost:9535
echo       Opening browser in 2 seconds...
echo.
echo       This window runs the server.  Close it or hit Ctrl+C to stop.
echo.

start "" /min cmd /c "powershell -NoProfile -Command Start-Sleep -Seconds 2 && start http://localhost:9535/index.html"

echo ====================================================
echo   Server running at http://localhost:9535
echo   Landing page: http://localhost:9535/index.html
echo   Game:         http://localhost:9535/game.html
echo ====================================================
echo.

%SERVER_CMD%
set "SERVER_EXIT=%ERRORLEVEL%"

echo.
if not "%SERVER_EXIT%"=="0" (
    echo Server exited with code %SERVER_EXIT%.
) else (
    echo Server stopped.
)
echo.
popd
pause
exit /b %SERVER_EXIT%
