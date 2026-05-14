@echo off
setlocal enabledelayedexpansion

title SEX SLAVE DUNGEON - local launcher

echo.
echo ====================================
echo   SEX SLAVE DUNGEON - local launcher
echo ====================================
echo.

pushd "%~dp0"
set PROJECT_DIR=%CD%
echo Project: %PROJECT_DIR%
echo.

REM === STEP 1: Ollama check + auto-start ============================
echo [1/3] Checking Ollama...

where ollama >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
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
set OLLAMA_ORIGINS=*

REM Check if Ollama is already serving
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:11434/api/tags' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   + Ollama already running at localhost:11434
) else (
    echo   + Launching Ollama in a new window...
    start "Ollama serve" cmd /k "set OLLAMA_ORIGINS=* && ollama serve"
    echo   + Waiting 4 seconds for Ollama to come up...
    powershell -NoProfile -Command "Start-Sleep -Seconds 4" >nul 2>&1
)

echo.

:find_server
REM === STEP 2: Find a local static server =============================
echo [2/3] Finding a local web server...

set SERVER_CMD=
set SERVER_LABEL=

where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set SERVER_CMD=python -m http.server 8080
    set SERVER_LABEL=Python http.server
    goto :have_server
)

where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set SERVER_CMD=py -m http.server 8080
    set SERVER_LABEL=Python launcher
    goto :have_server
)

where npx >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set SERVER_CMD=npx --yes http-server . -p 8080 -c-1 --cors
    set SERVER_LABEL=Node npx http-server
    goto :have_server
)

where php >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set SERVER_CMD=php -S localhost:8080
    set SERVER_LABEL=PHP built-in server
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
exit /b 1

:have_server
echo   + Using: %SERVER_LABEL%
echo.

REM === STEP 3: Open browser + start server ===========================
echo [3/3] Starting server on http://localhost:8080
echo       Opening browser in 2 seconds...
echo.
echo       This window runs the server.  Close it to stop.
echo.

start "" /min cmd /c "powershell -NoProfile -Command Start-Sleep -Seconds 2 && start http://localhost:8080/index.html"

echo ====================================================
echo   Server running at http://localhost:8080
echo   Landing page: http://localhost:8080/index.html
echo   Game:         http://localhost:8080/game.html
echo ====================================================
echo.

%SERVER_CMD%

popd
endlocal
