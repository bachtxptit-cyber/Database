@echo off
REM Fashion Store Application Starter
REM Chạy ứng dụng Fashion Store

echo.
echo ============================================================
echo  LUXE Fashion Store - Startup
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org
    pause
    exit /b 1
)

echo Checking and installing dependencies...
python -m pip install -r requirements.txt >nul 2>&1

echo.
echo Starting application...
echo.
echo 🚀 Server will run at http://localhost:5000
echo Press CTRL+C to stop the server
echo.

python run.py

pause
