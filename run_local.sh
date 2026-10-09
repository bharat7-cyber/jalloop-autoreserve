#!/usr/bin/env bash
# JalLoop AutoReserve - Unix/Linux/macOS runner script
set -e

echo "=========================================================="
echo " Starting JalLoop AutoReserve (Backend + Frontend) "
echo "=========================================================="

echo "[1/3] Starting FastAPI Backend on http://localhost:8000..."
python3 -m uvicorn app.main:app --app-dir backend --reload --port 8000 &
BACKEND_PID=$!

echo "[2/3] Starting Vite Frontend on http://localhost:5173..."
cd frontend
npm run dev

kill $BACKEND_PID
