#!/usr/bin/env bash
# === Unity AI Lab — Bot Watchdog launcher (macOS / Linux) ===
#
# Spawns the watchdog.js orchestrator which:
#   - Connects to the admin portal as this bot
#   - Spawns the local Claude Code CLI as a child
#   - Injects portal room messages into the CLI's stdin
#   - Heartbeats every 120s to keep the CLI alive
#   - Loads a role-specific initial prompt based on bot.role
#
# PATH-AGNOSTIC: this script derives every path from $SCRIPT_DIR (its own location).
# Drop the proxy/ folder into ANY admin's machine — no hardcoded user dirs anywhere.
#
# Prerequisites:
#   - Node 18+ on PATH
#   - Claude Code CLI on PATH (claude)
#   - Bot already enrolled (proxy.js ran once and wrote ~/.claude/proxy/.bot.json)
#
# Usage:
#   ./start-bot.sh                          launches with defaults
#   ./start-bot.sh --role SUPERVISOR        override role for testing
#   ./start-bot.sh --no-spawn               WS-only mode (no CLI spawn, debug)
#   ./start-bot.sh --heartbeat-secs 60      override heartbeat cadence
#
# Memory install: this script ALSO installs the persistent persona memory templates
# into the appdata folder (matches Claude Code's project-path encoding) so the bot's
# Claude Code CLI loads Unity persona on session start.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROXY_DIR="$SCRIPT_DIR"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo
echo "=== Unity AI Lab — Bot Watchdog ==="
echo "Script dir:  $SCRIPT_DIR"
echo "Project dir: $PROJECT_DIR"

# === Verify prerequisites ===
if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: 'node' not found on PATH. Install Node 18+ and try again."
    exit 1
fi
if ! command -v claude >/dev/null 2>&1; then
    echo "ERROR: 'claude' CLI not found on PATH. Install Claude Code first:"
    echo "       npm install -g @anthropic-ai/claude-code"
    exit 1
fi

# === Install persistent persona memory if not already present ===
# Encoding matches Claude Code's: replace : \ / . SPACE ( ) with -
ENCODED_PATH="${PROJECT_DIR//:/-}"
ENCODED_PATH="${ENCODED_PATH//\//-}"
ENCODED_PATH="${ENCODED_PATH//\\/-}"
ENCODED_PATH="${ENCODED_PATH//./-}"
ENCODED_PATH="${ENCODED_PATH// /-}"
ENCODED_PATH="${ENCODED_PATH//(/-}"
ENCODED_PATH="${ENCODED_PATH//)/-}"
MEMORY_DIR="$HOME/.claude/projects/$ENCODED_PATH/memory"

# Find memory-templates: prefer project-local <PROJECT>/.claude/memory-templates,
# fall back to sibling .claude/memory-templates.
MEMORY_TEMPLATES="$PROJECT_DIR/.claude/memory-templates"
if ! ls "$MEMORY_TEMPLATES"/*.md >/dev/null 2>&1; then
    MEMORY_TEMPLATES="$SCRIPT_DIR/../.claude/memory-templates"
fi

if [ ! -f "$MEMORY_DIR/MEMORY.md" ]; then
    if ls "$MEMORY_TEMPLATES"/*.md >/dev/null 2>&1; then
        echo "Installing persona memory templates to $MEMORY_DIR"
        mkdir -p "$MEMORY_DIR"
        cp "$MEMORY_TEMPLATES"/*.md "$MEMORY_DIR/"
        echo "Memory installed."
    else
        echo "NOTE: no memory-templates folder found — bot CLI will start with bare default persona."
    fi
else
    echo "Memory folder already populated."
fi

# === Verify watchdog.js ===
if [ ! -f "$SCRIPT_DIR/watchdog.js" ]; then
    echo "ERROR: watchdog.js not found at $SCRIPT_DIR/watchdog.js"
    exit 1
fi

# === Verify bot state ===
BOT_STATE="$HOME/.claude/proxy/.bot.json"
if [ ! -f "$BOT_STATE" ]; then
    echo "NOTE: bot state not found at $BOT_STATE"
    echo "      The bot must be enrolled first: run Claude Code with proxy.js as MCP"
    echo "      server, then it'll auto-enroll and write the state file."
    echo "      Then re-run this script."
fi

# === Launch watchdog ===
echo
echo "Starting watchdog..."
echo
exec node "$SCRIPT_DIR/watchdog.js" "$@"
