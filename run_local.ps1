# JalLoop AutoReserve - Local Runner Script (PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting JalLoop AutoReserve (Backend + Frontend) " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check Python and Node
Write-Host "[1/3] Checking environment..." -ForegroundColor Yellow
python --version
node --version

# Launch Backend in new window
Write-Host "[2/3] Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting JalLoop Backend...' -ForegroundColor Cyan; python -m uvicorn app.main:app --app-dir backend --reload --port 8000"

# Launch Frontend
Write-Host "[3/3] Launching Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Set-Location -Path "frontend"
npm run dev
