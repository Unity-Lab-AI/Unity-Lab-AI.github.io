#!/usr/bin/env bash
# SEX SLAVE DUNGEON — Mac/Linux local launcher
set -e

cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"

echo
echo "===================================="
echo "  SEX SLAVE DUNGEON - local launcher"
echo "===================================="
echo
echo "Project: $PROJECT_DIR"
echo

# --- Ollama check + auto-start ----------------------------------------
echo "[1/3] Checking Ollama..."
if command -v ollama >/dev/null 2>&1; then
  echo "  + Ollama found."
  export OLLAMA_ORIGINS="*"

  if curl -sSf --max-time 2 http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "  + Ollama already running at localhost:11434"
  else
    echo "  + Launching Ollama in the background..."
    ( OLLAMA_ORIGINS="*" nohup ollama serve >/tmp/ssd-ollama.log 2>&1 & )
    sleep 4
  fi
else
  echo "  X Ollama not found on PATH."
  echo "  Download from https://ollama.com/download before girls can talk."
fi
echo

# --- Find a static server --------------------------------------------
echo "[2/3] Finding a local web server..."
SERVER_CMD=""
SERVER_LABEL=""

if command -v python3 >/dev/null 2>&1; then
  SERVER_CMD="python3 -m http.server 8080"
  SERVER_LABEL="Python 3 http.server"
elif command -v python >/dev/null 2>&1; then
  SERVER_CMD="python -m http.server 8080"
  SERVER_LABEL="Python http.server"
elif command -v npx >/dev/null 2>&1; then
  SERVER_CMD="npx --yes http-server . -p 8080 -c-1 --cors"
  SERVER_LABEL="Node npx http-server"
elif command -v php >/dev/null 2>&1; then
  SERVER_CMD="php -S localhost:8080"
  SERVER_LABEL="PHP built-in server"
else
  echo
  echo "  X No local web server found."
  echo "  Install ONE of these so the game can be served over HTTP:"
  echo "    - Python 3:  https://python.org/downloads/"
  echo "    - Node.js:   https://nodejs.org/"
  echo "    - PHP:       brew install php  (Mac) or apt install php (Linux)"
  echo
  exit 1
fi

echo "  + Using: $SERVER_LABEL"
echo

# --- Open browser + start server -------------------------------------
echo "[3/3] Starting server on http://localhost:8080"
echo "      Opening browser in 2 seconds..."
echo

( sleep 2
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:8080/index.html
  elif command -v open >/dev/null 2>&1; then
    open http://localhost:8080/index.html
  fi ) &

echo "===================================================="
echo "  Server running at http://localhost:8080"
echo "  Landing: http://localhost:8080/index.html"
echo "  Game:    http://localhost:8080/game.html"
echo "  Ctrl-C to stop."
echo "===================================================="
echo

exec $SERVER_CMD
