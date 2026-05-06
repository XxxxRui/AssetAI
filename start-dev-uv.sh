#!/usr/bin/env bash

set -euo pipefail

# Detect Apple Silicon architecture
ARCH=$(uname -m)
if [[ "$ARCH" == "arm64" ]]; then
  echo "[Info] Detected Apple Silicon (ARM64) architecture"
  export ARCHFLAGS=-Wno-error=unused-command-line-argument-hard-error-in-future
fi

if [[ -f "/opt/homebrew/bin/brew" ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"
BACKEND_DIR="$REPO_ROOT/AssetGuard-AI"
FRONTEND_DIR="$REPO_ROOT/assetguard-ui"
EXTRACTION_DIR="$REPO_ROOT/gjp-assetguard-extraction-tool"

if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "Backend folder not found: $BACKEND_DIR" >&2
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR" ]]; then
  echo "Frontend folder not found: $FRONTEND_DIR" >&2
  exit 1
fi

echo "== AssetGuard Backend Bootstrap (using uv) =="
cd "$BACKEND_DIR"

# Check if uv is installed
if ! command -v uv &> /dev/null; then
  echo "Error: uv is not installed. Please install it first:"
  echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
  exit 1
fi

# Create virtual environment with uv if it doesn't exist
if [[ ! -d ".venv" ]]; then
  echo "[First-time] Creating virtual environment with uv..."
  uv venv .venv
fi

# Activate virtual environment
if [[ -f ".venv/bin/activate" ]]; then
  source .venv/bin/activate
  echo "Virtual environment activated: .venv"
else
  echo "Error: Failed to create or activate virtual environment" >&2
  exit 1
fi

PY_EXE="$(pwd)/.venv/bin/python"
echo "Python executable path: $PY_EXE"

# Install dependencies using uv
echo "Installing backend dependencies from requirements.txt with uv..."
uv pip install -r requirements.txt

BOOTSTRAP_MARKER=".dev_bootstrap_done"
DB_PATH="./instance/assetguard.db"

if [[ -f "$DB_PATH" ]]; then
  DB_EXISTED_BEFORE_UPGRADE=true
else
  DB_EXISTED_BEFORE_UPGRADE=false
fi

if [[ -f "$BOOTSTRAP_MARKER" ]]; then
  MARKER_EXISTS=true
else
  MARKER_EXISTS=false
fi

echo "Running database migrations: flask db upgrade ..."
$PY_EXE -m flask --app assetguard_app.py db upgrade

if [[ "$MARKER_EXISTS" == false || "$DB_EXISTED_BEFORE_UPGRADE" == false ]]; then
  if [[ "$DB_EXISTED_BEFORE_UPGRADE" == false ]]; then
    echo "[Bootstrap] Database file was missing before startup ($DB_PATH). Running flask seed ..."
  elif [[ "$MARKER_EXISTS" == false ]]; then
    echo "[First-time] Bootstrap marker missing. Running flask seed ..."
  fi

  $PY_EXE -m flask --app assetguard_app.py seed
  touch "$BOOTSTRAP_MARKER"
  echo "[First-time] Bootstrap completed. Marker file created."
else
  echo "[Normal] Bootstrap marker found and database existed before startup. Skip flask seed."
fi

echo "== AssetGuard Frontend Bootstrap =="
cd "$FRONTEND_DIR"

if [[ ! -d "node_modules" ]]; then
  echo "[First-time] node_modules not found. Running npm install ..."
  npm install
else
  echo "[Normal] node_modules exists. Skip npm install."
fi

echo "== Starting backend and frontend dev servers =="

cd "$BACKEND_DIR"
$PY_EXE -m flask --app assetguard_app.py run &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

EXTRACTION_PID=""
if [[ -d "$EXTRACTION_DIR" ]]; then
  (
    set +e
    set +u
    cd "$EXTRACTION_DIR" || {
      echo "[Warning] Extraction tool: could not cd to $EXTRACTION_DIR. Skipping." >&2
      exit 0
    }

    echo "== AssetGuard Extraction Tool Bootstrap =="

    if [[ ! -d ".venv" ]]; then
      echo "[First-time] No extraction-tool virtual environment found. Creating .venv ..."
      if ! python3 -m venv .venv; then
        echo "[Warning] Extraction tool: venv creation failed. Skipping extraction server." >&2
        exit 0
      fi
    fi

    if [[ -f ".venv/bin/activate" ]]; then
      source .venv/bin/activate
      echo "Virtual environment activated: .venv"
    else
      echo "[Warning] Extraction tool: Failed to activate virtual environment. Skipping." >&2
      exit 0
    fi

    EXTRACTION_PY="$(pwd)/.venv/bin/python"
    echo "Python executable path: $EXTRACTION_PY"

    if ! "$EXTRACTION_PY" -m pip install --upgrade pip; then
      echo "[Warning] Extraction tool: pip upgrade failed. Skipping extraction server." >&2
      exit 0
    fi

    echo "Ensuring extraction-tool dependencies from requirements.txt ..."
    if ! "$EXTRACTION_PY" -m pip install -r requirements.txt; then
      echo "[Warning] Extraction tool: pip install failed. Skipping extraction server." >&2
      exit 0
    fi

    if [[ ! -f ".env" ]]; then
      echo "[Warning] .env file not found in extraction tool folder. Some features may not work."
    fi

    echo "Starting extraction tool server on http://127.0.0.1:5001 ..."
    exec "$EXTRACTION_PY" -m flask --app app.py run --port 5001
  ) &
  EXTRACTION_PID=$!
  echo "Extraction tool started (PID: $EXTRACTION_PID)"
else
  echo "[Warning] Extraction tool folder not found; skipping extraction server: $EXTRACTION_DIR" >&2
fi

cleanup() {
  echo ""
  echo "Stopping backend, frontend, and extraction tool..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  if [[ -n "${EXTRACTION_PID:-}" ]]; then
    kill "$EXTRACTION_PID" 2>/dev/null || true
  fi
  cd "$BACKEND_DIR"
  deactivate 2>/dev/null || true
}

trap cleanup INT TERM
wait "$BACKEND_PID" "$FRONTEND_PID"
if [[ -n "${EXTRACTION_PID:-}" ]]; then
  wait "$EXTRACTION_PID" || true
fi
