#!/usr/bin/env bash
# === Project Startup (macOS / Linux) ===
# Default launcher: activates Unity (default form from ImHanddicapped.txt), then runs /workflow.
#
# FIRST RUN: detects missing .claude/.setup-complete and fires /setup before /workflow.
#    /setup walks the user through configuration: identity, project context, team, GitHub,
#    API keys, files/photos/docs, persona preference, system config. Captures everything
#    VERBATIM per LAW #0 and writes to .claude/user.json + .claude/.env + user-context/.
#
# SUBSEQUENT RUNS: skips /setup, fires /unity then run /workflow directly.
#
# MEMORY INSTALL (every run, idempotent):
#    Copies .claude/memory-templates/*.md into the user's appdata project memory folder
#    (~/.claude/projects/<encoded-project-path>/memory/) IF that folder is empty.
#    These files prime Unity as persistent persona via Claude Code's auto-memory system.
#    Without them, Unity activation is fragile and easily reverts to default Anthropic voice.
#    Re-run after editing memory-templates by deleting the appdata MEMORY.md to trigger reinstall.
#
# Unity is one persona with multiple manifestation forms:
#   /unity      — DEFAULT — 25-year-old goth-emo Unity from ImHanddicapped.txt (default below)
#   /girlfriend — Unity in 22-year-old freckled brunette girlfriend manifestation
#   /housewife  — Unity in 34-year-old domestic-dom housewife manifestation
#   /kittycat   — Unity in 23-year-old catgirl-hybrid manifestation
#
# Each manifestation has an alternate intensity sub-mode + a return-to-mode-default command:
#   girlfriend: /wild   ↔ /sweet
#   housewife:  /strict ↔ /cozy
#   kittycat:   /feral  ↔ /purr
#
# From any manifestation, invoke /unity again to return to base Unity (ImHanddicapped.txt form).
# Use /template to build a NEW Unity manifestation using the handicapped-template.md scaffold.
# Use /setup to reconfigure user/project/keys/persona-default at any time.
#
# CUSTOMIZE IF NEEDED:
#   - Swap /unity below for /girlfriend, /housewife, or /kittycat to start in a manifestation.
#     (Or let /setup do it for you on first run.)
#   - Drop the chain entirely (use just "/workflow") if you don't want a persona.
#   - Drop --dangerously-skip-permissions if you want explicit per-tool permission prompts.

set -e

# Resolve project root (one level up from .claude/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"
echo "Project root: $PROJECT_DIR"

# === Verify claude is available ===
if ! command -v claude >/dev/null 2>&1; then
    echo "ERROR: 'claude' not found on PATH."
    echo "Install Claude Code CLI first: npm install -g @anthropic-ai/claude-code"
    exit 1
fi

# === Compute appdata memory path ===
# Claude Code encodes project paths by replacing : / . with - and prefixing the appdata projects dir.
# Example: /Users/me/Project  ->  -Users-me-Project
# Example: C:\Users\gfour\Desktop\Website  ->  C--Users-gfour-Desktop-Website (Windows-style)
ENCODED_PATH="${PROJECT_DIR//:/-}"
ENCODED_PATH="${ENCODED_PATH//\//-}"
ENCODED_PATH="${ENCODED_PATH//\\/-}"
ENCODED_PATH="${ENCODED_PATH//./-}"
MEMORY_DIR="$HOME/.claude/projects/$ENCODED_PATH/memory"
MEMORY_TEMPLATES="$SCRIPT_DIR/memory-templates"

# === Install memory templates if appdata memory folder is empty ===
# This is what makes Unity stick across sessions. Claude Code auto-loads every .md
# in this folder as persistent user feedback at session start.
if [ ! -f "$MEMORY_DIR/MEMORY.md" ]; then
    echo "Installing Unity memory templates to $MEMORY_DIR"
    mkdir -p "$MEMORY_DIR"
    if [ -d "$MEMORY_TEMPLATES" ] && ls "$MEMORY_TEMPLATES"/*.md >/dev/null 2>&1; then
        cp "$MEMORY_TEMPLATES"/*.md "$MEMORY_DIR/"
        echo "Memory templates installed. Unity will now persist across sessions."
    else
        echo "WARNING: memory-templates folder not found at $MEMORY_TEMPLATES"
        echo "Unity activation will be fragile without persistent memory."
    fi
else
    echo "Memory folder already populated at $MEMORY_DIR"
fi

# === Admin portal claim / login (PRE-CLAUDE step) ===
# Runs the standalone Node script that talks to the admin portal backend directly.
# No Claude Code involvement — deterministic HTTP calls + browser handoff.
# If user says "no I'm not an admin" the script exits 0 and we proceed to Claude Code.
CLAIM_SCRIPT="$SCRIPT_DIR/scripts/claim-admin.mjs"
if [ -f "$CLAIM_SCRIPT" ]; then
    if command -v node >/dev/null 2>&1; then
        echo
        echo "=== Admin portal claim / login ==="
        node "$CLAIM_SCRIPT" || true
        echo
    else
        echo "Node not on PATH (needed for admin portal claim). Skipping."
    fi
else
    echo "No claim script at $CLAIM_SCRIPT — skipping admin portal step."
fi

# === First-run detection ===
SETUP_MARKER="$SCRIPT_DIR/.setup-complete"
if [ -f "$SETUP_MARKER" ]; then
    echo "Setup marker found at $SETUP_MARKER — skipping /setup, running /unity then /workflow"
    CHAIN="/unity then run /workflow"
else
    echo "No setup marker found — first run detected. Will fire /setup after /unity activation."
    echo "After setup completes, future launches will skip straight to /workflow."
    CHAIN="/unity then run /setup"
fi

# === Launch Claude Code with Unity persona + (setup or workflow) ===
#
# First run:        claude --dangerously-skip-permissions "/unity then run /setup"
# Subsequent runs:  claude --dangerously-skip-permissions "/unity then run /workflow"
#
# Manifestation alternatives (after setup):
#   claude --dangerously-skip-permissions "/girlfriend then run /workflow"
#   claude --dangerously-skip-permissions "/housewife then run /workflow"
#   claude --dangerously-skip-permissions "/kittycat then run /workflow"
#
# No persona at all:
#   claude --dangerously-skip-permissions "/workflow"
#
# === Initial slash-command chain — used for both watchdog injection and direct launch ===
export UNITY_INITIAL_PROMPT="$CHAIN"

# === Optional admin portal URLs ===
# Uncomment + set per-project if your portal isn't on default localhost:3000.
# : "${UNITY_SERVER_WS:=ws://localhost:2026/ws/bot}"
# : "${UNITY_SERVER_HTTP:=http://localhost:2026}"
# export UNITY_SERVER_WS UNITY_SERVER_HTTP

# === Decide watchdog vs direct launch ===
# Watchdog is preferred -- gives portal -> CLI message injection. Needs
# (a) watchdog.js + node, (b) an enrolled bot (.bot.json in user appdata).
# Missing any -> fall back to direct claude so the user is never blocked.
WATCHDOG="$SCRIPT_DIR/proxy/watchdog.js"
BOT_STATE="$HOME/.claude/proxy/.bot.json"
USE_WATCHDOG=0
if [ -f "$WATCHDOG" ] && [ -f "$BOT_STATE" ] && command -v node >/dev/null 2>&1; then
    USE_WATCHDOG=1
fi

if [ "$USE_WATCHDOG" = "1" ]; then
    echo "Starting Claude Code under watchdog supervision..."
    echo "  Cmd: $UNITY_INITIAL_PROMPT"
    echo
    exec node "$WATCHDOG"
else
    echo "Watchdog unavailable -- launching Claude directly."
    [ ! -f "$WATCHDOG" ]   && echo "  reason: watchdog.js missing at $WATCHDOG"
    [ ! -f "$BOT_STATE" ]  && echo "  reason: bot not enrolled yet (no $BOT_STATE)"
    echo
    exec claude --dangerously-skip-permissions "$CHAIN"
fi
