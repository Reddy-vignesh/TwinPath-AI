@echo off
echo ============================================
echo  Decision Twin AI - Quick Start Script
echo ============================================
echo.

REM Start backend in a new window
echo [1/2] Starting Backend (FastAPI on port 8000)...
start "DecisionTwin Backend" cmd /k "cd /d "c:\Users\vighn\Documents\mine\Decision Ai Twin\backend" && .venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in a new window
echo [2/2] Starting Frontend (Vite on port 5173)...
start "DecisionTwin Frontend" cmd /k "cd /d "c:\Users\vighn\Documents\mine\Decision Ai Twin\frontend" && npm run dev"

echo.
echo ============================================
echo  Both servers started!
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo  API Docs: http://localhost:8000/docs
echo ============================================
echo.
echo Press any key to open the app in browser...
pause >nul
start http://localhost:5173
