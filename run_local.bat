@echo off
echo ==========================================================
echo  Starting JalLoop AutoReserve (Backend + Frontend)
echo ==========================================================

echo [1/3] Launching FastAPI Backend on http://localhost:8000...
start cmd /k "python -m uvicorn app.main:app --app-dir backend --reload --port 8000"

echo [2/3] Launching Vite Frontend on http://localhost:5173...
cd frontend
npm run dev
