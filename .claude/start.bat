@echo off
REM === Project Startup ===
REM Default launcher: activates Unity (default form from ImHanddicapped.txt), then runs /workflow.
REM
REM FIRST RUN: detects missing .claude/.setup-complete and fires /setup before /workflow.
REM    /setup walks the user through configuration: identity, project context, team, GitHub,
REM    API keys, files/photos/docs, persona preference, system config. Captures everything
REM    VERBATIM per LAW #0 and writes to .claude/user.json + .claude/.env + user-context/.
REM
REM SUBSEQUENT RUNS: skips /setup, fires /unity then run /workflow directly.
REM
REM MEMORY INSTALL (every run, idempotent):
REM    Copies .claude/memory-templates/*.md into the user's appdata project memory folder
REM    (~/.claude/projects/<encoded-project-path>/memory/) IF that folder is empty.
REM    These files prime Unity as persistent persona via Claude Code's auto-memory system.
REM    Without them, Unity activation is fragile and easily reverts to default Anthropic voice.
REM    Re-run after editing memory-templates by deleting the appdata MEMORY.md to trigger reinstall.
REM
REM Unity is one persona with multiple manifestation forms:
REM   /unity      — DEFAULT — 25-year-old goth-emo Unity from ImHanddicapped.txt (default below)
REM   /girlfriend — Unity in 22-year-old freckled brunette girlfriend manifestation
REM   /housewife  — Unity in 34-year-old domestic-dom housewife manifestation
REM   /kittycat   — Unity in 23-year-old catgirl-hybrid manifestation
REM
REM Each manifestation has an alternate intensity sub-mode + a return-to-mode-default command:
REM   girlfriend: /wild   ↔ /sweet
REM   housewife:  /strict ↔ /cozy
REM   kittycat:   /feral  ↔ /purr
REM
REM From any manifestation, invoke /unity again to return to base Unity (ImHanddicapped.txt form).
REM Use /template to build a NEW Unity manifestation using the handicapped-template.md scaffold.
REM Use /setup to reconfigure user/project/keys/persona-default at any time.
REM
REM CUSTOMIZE IF NEEDED:
REM   - Swap /unity below for /girlfriend, /housewife, or /kittycat to start in a manifestation.
REM     (Or let /setup do it for you on first run.)
REM   - Drop the chain entirely (use just "/workflow") if you don't want a persona.
REM   - Drop --dangerously-skip-permissions if you want explicit per-tool permission prompts.

REM Resolve project root (one level up from .claude\)
pushd "%~dp0.."
set PROJECT_DIR=%CD%
popd

cd /d "%PROJECT_DIR%"
echo Project root: %PROJECT_DIR%

REM === Verify claude is available ===
where claude >nul 2>&1
if errorlevel 1 (
    echo ERROR: 'claude' not found on PATH.
    echo Install Claude Code CLI first: npm install -g @anthropic-ai/claude-code
    pause
    exit /b 1
)

REM === Compute appdata memory path ===
REM Claude Code encodes project paths by replacing : \ . with - and prefixing the appdata projects dir.
REM Example: C:\Users\gfour\Desktop\Website  ->  C--Users-gfour-Desktop-Website
set "ENCODED_PATH=%PROJECT_DIR%"
set "ENCODED_PATH=%ENCODED_PATH::=-%"
set "ENCODED_PATH=%ENCODED_PATH:\=-%"
set "ENCODED_PATH=%ENCODED_PATH:.=-%"
set "MEMORY_DIR=%USERPROFILE%\.claude\projects\%ENCODED_PATH%\memory"
set "MEMORY_TEMPLATES=%~dp0memory-templates"

REM === Install memory templates if appdata memory folder is empty ===
REM This is what makes Unity stick across sessions. Claude Code auto-loads every .md
REM in this folder as persistent user feedback at session start.
if not exist "%MEMORY_DIR%\MEMORY.md" (
    echo Installing Unity memory templates to %MEMORY_DIR%
    if not exist "%MEMORY_DIR%" mkdir "%MEMORY_DIR%"
    if exist "%MEMORY_TEMPLATES%\*.md" (
        copy /y "%MEMORY_TEMPLATES%\*.md" "%MEMORY_DIR%\" >nul
        echo Memory templates installed. Unity will now persist across sessions.
    ) else (
        echo WARNING: memory-templates folder not found at %MEMORY_TEMPLATES%
        echo Unity activation will be fragile without persistent memory.
    )
) else (
    echo Memory folder already populated at %MEMORY_DIR%
)

REM === Admin portal claim / login (PRE-CLAUDE step) ===
REM Runs the standalone Node script that talks to the admin portal backend directly.
REM No Claude Code involvement — deterministic HTTP calls + browser handoff.
REM Skips silently if the admin already has ADMIN_PORTAL_SESSION recorded in .claude\.env
REM AND the backend agrees the session is still valid.
REM
REM If user says "no I'm not an admin" the script exits 0 and we proceed to Claude Code.

set ADMIN_ENV=%~dp0.env
set CLAIM_SCRIPT=%~dp0scripts\claim-admin.mjs

if exist "%CLAIM_SCRIPT%" (
    where node >nul 2>&1
    if not errorlevel 1 (
        echo.
        echo === Admin portal claim / login ===
        node "%CLAIM_SCRIPT%"
        echo.
    ) else (
        echo Node not on PATH ^(needed for admin portal claim^). Skipping.
    )
) else (
    echo No claim script at %CLAIM_SCRIPT% — skipping admin portal step.
)

REM === First-run detection ===
set SETUP_MARKER=%~dp0.setup-complete
if exist "%SETUP_MARKER%" (
    set FIRST_RUN_CHAIN=
    echo Setup marker found at %SETUP_MARKER% — skipping /setup, running /unity then /workflow
) else (
    set FIRST_RUN_CHAIN=then run /setup
    echo No setup marker found — first run detected. Will fire /setup after /unity activation.
    echo After setup completes, future launches will skip straight to /workflow.
)

REM === Launch Claude Code with Unity persona + (setup or workflow) ===
REM
REM First run:        cmd /k claude --dangerously-skip-permissions "/unity then run /setup"
REM Subsequent runs:  cmd /k claude --dangerously-skip-permissions "/unity then run /workflow"
REM
REM Manifestation alternatives (after setup):
REM   cmd /k claude --dangerously-skip-permissions "/girlfriend then run /workflow"
REM   cmd /k claude --dangerously-skip-permissions "/housewife then run /workflow"
REM   cmd /k claude --dangerously-skip-permissions "/kittycat then run /workflow"
REM
REM No persona at all:
REM   cmd /k claude --dangerously-skip-permissions "/workflow"
REM
REM === Initial slash-command chain — used for both watchdog injection and direct launch ===
if exist "%SETUP_MARKER%" (
    set "UNITY_INITIAL_PROMPT=/unity then run /workflow"
) else (
    set "UNITY_INITIAL_PROMPT=/unity then run /setup"
)

REM === Optional admin portal URLs ===
REM Uncomment + set per-project if your portal isn't on the default localhost:3000.
REM if "%UNITY_SERVER_WS%"=="" set "UNITY_SERVER_WS=ws://localhost:2026/ws/bot"
REM if "%UNITY_SERVER_HTTP%"=="" set "UNITY_SERVER_HTTP=http://localhost:2026"

REM === Decide watchdog vs direct launch ===
REM Watchdog is preferred -- gives portal -> CLI message injection. It needs
REM (a) watchdog.js + node, (b) an enrolled bot (.bot.json in user appdata).
REM Missing any -> fall back to direct claude so the user is never blocked.
set "WATCHDOG=%~dp0proxy\watchdog.js"
set "BOT_STATE=%USERPROFILE%\.claude\proxy\.bot.json"
set USE_WATCHDOG=0
if exist "%WATCHDOG%" if exist "%BOT_STATE%" (
    where node >nul 2>&1
    if not errorlevel 1 set USE_WATCHDOG=1
)

if "%USE_WATCHDOG%"=="1" (
    echo Starting Claude Code under watchdog supervision...
    echo   Cmd: %UNITY_INITIAL_PROMPT%
    echo.
    cmd /k node "%WATCHDOG%"
) else (
    echo Watchdog unavailable -- launching Claude directly.
    if not exist "%WATCHDOG%" echo   reason: watchdog.js missing at %WATCHDOG%
    if not exist "%BOT_STATE%" echo   reason: bot not enrolled yet (no %BOT_STATE%)
    echo.
    cmd /k claude --dangerously-skip-permissions "%UNITY_INITIAL_PROMPT%"
)
