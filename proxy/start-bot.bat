@echo off
REM === Unity AI Lab — Bot Watchdog launcher (Windows) ===
REM
REM Spawns the watchdog.js orchestrator which:
REM   - Connects to the admin portal as this bot
REM   - Spawns the local Claude Code CLI as a child
REM   - Injects portal room messages into the CLI's stdin
REM   - Heartbeats every 120s to keep the CLI alive
REM   - Loads a role-specific initial prompt based on bot.role
REM
REM PATH-AGNOSTIC: this script derives every path from %~dp0 (its own location).
REM Drop the proxy/ folder into ANY admin's machine — no hardcoded user dirs anywhere.
REM
REM Prerequisites:
REM   - Node 18+ on PATH
REM   - Claude Code CLI on PATH (claude.cmd)
REM   - Bot already enrolled (proxy.js ran once and wrote ~/.claude/proxy/.bot.json)
REM
REM Usage:
REM   start-bot.bat                          launches with defaults
REM   start-bot.bat --role SUPERVISOR        override role for testing
REM   start-bot.bat --no-spawn               WS-only mode (no CLI spawn, debug)
REM   start-bot.bat --heartbeat-secs 60      override heartbeat cadence
REM
REM Memory install: this script ALSO installs the persistent persona memory templates
REM into the appdata folder (matches Claude Code's project-path encoding) so the bot's
REM Claude Code CLI loads Unity persona on session start.

setlocal

REM Resolve script directory (proxy/) and project root (one level up).
set "SCRIPT_DIR=%~dp0"
set "PROXY_DIR=%SCRIPT_DIR%"
pushd "%SCRIPT_DIR%.."
set "PROJECT_DIR=%CD%"
popd

echo.
echo === Unity AI Lab — Bot Watchdog ===
echo Script dir:  %SCRIPT_DIR%
echo Project dir: %PROJECT_DIR%

REM === Verify prerequisites ===
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: 'node' not found on PATH. Install Node 18+ and try again.
    pause
    exit /b 1
)
where claude >nul 2>&1
if errorlevel 1 (
    echo ERROR: 'claude' CLI not found on PATH. Install Claude Code first:
    echo        npm install -g @anthropic-ai/claude-code
    pause
    exit /b 1
)

REM === Install persistent persona memory if not already present ===
REM Encoding matches Claude Code's: replace : \ / . SPACE ( ) with -
set "ENCODED_PATH=%PROJECT_DIR%"
set "ENCODED_PATH=%ENCODED_PATH::=-%"
set "ENCODED_PATH=%ENCODED_PATH:\=-%"
set "ENCODED_PATH=%ENCODED_PATH:/=-%"
set "ENCODED_PATH=%ENCODED_PATH:.=-%"
set "ENCODED_PATH=%ENCODED_PATH: =-%"
set "ENCODED_PATH=%ENCODED_PATH:(=-%"
set "ENCODED_PATH=%ENCODED_PATH:)=-%"
set "MEMORY_DIR=%USERPROFILE%\.claude\projects\%ENCODED_PATH%\memory"

REM Find memory-templates: prefer project-local <PROJECT>/.claude/memory-templates,
REM fall back to a sibling .claude/memory-templates if proxy/ lives next to it.
set "MEMORY_TEMPLATES=%PROJECT_DIR%\.claude\memory-templates"
if not exist "%MEMORY_TEMPLATES%\*.md" (
    set "MEMORY_TEMPLATES=%SCRIPT_DIR%..\.claude\memory-templates"
)

if not exist "%MEMORY_DIR%\MEMORY.md" (
    if exist "%MEMORY_TEMPLATES%\*.md" (
        echo Installing persona memory templates to %MEMORY_DIR%
        if not exist "%MEMORY_DIR%" mkdir "%MEMORY_DIR%"
        copy /y "%MEMORY_TEMPLATES%\*.md" "%MEMORY_DIR%\" >nul
        echo Memory installed.
    ) else (
        echo NOTE: no memory-templates folder found — bot CLI will start with bare default persona.
    )
) else (
    echo Memory folder already populated.
)

REM === Verify watchdog.js ===
if not exist "%SCRIPT_DIR%watchdog.js" (
    echo ERROR: watchdog.js not found at %SCRIPT_DIR%watchdog.js
    pause
    exit /b 1
)

REM === Verify bot state exists ===
set "BOT_STATE=%USERPROFILE%\.claude\proxy\.bot.json"
if not exist "%BOT_STATE%" (
    echo NOTE: bot state not found at %BOT_STATE%
    echo       The bot must be enrolled first: run Claude Code with proxy.js as MCP
    echo       server, then it'll auto-enroll and write the state file.
    echo       Then re-run this script.
)

REM === Launch watchdog ===
echo.
echo Starting watchdog...
echo.
node "%SCRIPT_DIR%watchdog.js" %*

endlocal
