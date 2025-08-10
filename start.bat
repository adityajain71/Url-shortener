@echo off
echo Starting URL Shortener Application...
echo.
echo This script will start both frontend and backend servers.
echo.

REM Navigate to the project root directory
cd %~dp0

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo Node.js is not installed. Please install Node.js and try again.
  exit /b 1
)

REM Check if npm is installed
where npm >nul 2>&1
if %errorlevel% neq 0 (
  echo npm is not installed. Please install npm and try again.
  exit /b 1
)

echo Installing dependencies...
call npm run install-all

echo.
echo Starting development servers...
call npm run dev
