#!/usr/bin/env bash

set -euo pipefail

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

# ─── Backend bootstrap ────────────────────────────────────────────────────────
echo "== AssetGuard Backend Bootstrap =="
cd "$BACKEND_DIR"

if [[ ! -x ".venv/bin/python" && ! -x "venv/bin/python" ]]; then
  echo "[First-time] No backend virtual environment found. Creating .venv ..."
  python3 -m venv .venv
fi

if [[ -x ".venv/bin/python" ]]; then
  BACKEND_PY=".venv/bin/python"
  echo "Using backend venv: .venv"
else
  BACKEND_PY="venv/bin/python"
  echo "Using backend venv: venv"
fi

echo "Python executable path: $BACKEND_DIR/$BACKEND_PY"
"$BACKEND_PY" -m pip install --upgrade pip

echo "Ensuring backend dependencies from requirements.txt ..."
"$BACKEND_PY" -m pip install -r requirements.txt

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
"$BACKEND_PY" -m flask --app assetguard_app.py db upgrade

if [[ "$MARKER_EXISTS" == false || "$DB_EXISTED_BEFORE_UPGRADE" == false ]]; then
  if [[ "$DB_EXISTED_BEFORE_UPGRADE" == false ]]; then
    echo "[Bootstrap] Database file was missing before startup ($DB_PATH). Running flask seed ..."
  elif [[ "$MARKER_EXISTS" == false ]]; then
    echo "[First-time] Bootstrap marker missing. Running flask seed ..."
  fi

  "$BACKEND_PY" -m flask --app assetguard_app.py seed
  touch "$BOOTSTRAP_MARKER"
  echo "[First-time] Bootstrap completed. Marker file created."
else
  echo "[Normal] Bootstrap marker found and database existed before startup. Skip flask seed."
fi

# ─── Frontend bootstrap ───────────────────────────────────────────────────────
echo "== AssetGuard Frontend Bootstrap =="
cd "$FRONTEND_DIR"

if [[ ! -d "node_modules" ]]; then
  echo "[First-time] node_modules not found. Running npm install ..."
  npm install
else
  echo "[Normal] node_modules exists. Skip npm install."
fi

# ─── Start backend + frontend first (extraction failures must not block these) ─
echo "Starting backend and frontend dev servers ..."

cd "$BACKEND_DIR"
"$BACKEND_PY" -m flask --app assetguard_app.py run &
BACKEND_PID=$!

cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

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

    if [[ ! -x ".venv/bin/python" && ! -x "venv/bin/python" ]]; then
      echo "[First-time] No extraction-tool virtual environment found. Creating .venv ..."
      if ! python3 -m venv .venv; then
        echo "[Warning] Extraction tool: venv creation failed. Skipping extraction server." >&2
        exit 0
      fi
    fi

    if [[ -x ".venv/bin/python" ]]; then
      EXTRACTION_PY=".venv/bin/python"
      echo "Using extraction-tool venv: .venv"
    else
      EXTRACTION_PY="venv/bin/python"
      echo "Using extraction-tool venv: venv"
    fi

    if [[ ! -x "$EXTRACTION_PY" ]]; then
      echo "[Warning] Extraction tool: Python not found at $EXTRACTION_PY. Skipping." >&2
      exit 0
    fi

    echo "Python executable path: $EXTRACTION_DIR/$EXTRACTION_PY"
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
else
  echo "[Warning] Extraction tool folder not found; skipping extraction server: $EXTRACTION_DIR" >&2
fi

echo ""
echo "Services started:"
echo "  Backend         (pid=$BACKEND_PID)    http://127.0.0.1:5000"
echo "  Frontend        (pid=$FRONTEND_PID)   (see frontend output for Vite URL)"
if [[ -n "$EXTRACTION_PID" ]]; then
  echo "  Extraction Tool (pid=$EXTRACTION_PID) http://127.0.0.1:5001"
else
  echo "  Extraction Tool (not started)"
fi
echo ""

cleanup() {
  echo ""
  echo "Stopping dev servers..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  if [[ -n "${EXTRACTION_PID:-}" ]]; then
    kill "$EXTRACTION_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM
wait "$BACKEND_PID" "$FRONTEND_PID"
if [[ -n "${EXTRACTION_PID:-}" ]]; then
  wait "$EXTRACTION_PID" || true
fi
