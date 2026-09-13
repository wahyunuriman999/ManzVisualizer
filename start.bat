@echo off
echo ============================================
echo    ManzStudio - Data Intelligence Platform
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo [1/3] Setting up virtual environment...
if not exist "backend\venv" (
    python -m venv backend\venv
    echo       Venv created.
) else (
    echo       Venv already exists.
)

echo.
echo [2/3] Installing dependencies...
backend\venv\Scripts\pip install -q -r backend\requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)
echo       Dependencies installed.

echo.
echo [3/3] Starting ManzStudio server...
echo.
echo ============================================
echo  Open your browser at: http://localhost:8000
echo  Press Ctrl+C to stop
echo ============================================
echo.

backend\venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend

pause
