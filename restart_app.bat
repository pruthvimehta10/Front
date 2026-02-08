@echo off
echo ==========================================
echo      RESTARTING RIIDL LMS STACK
echo ==========================================

echo [1/4] Stopping existing services on ports 3000, 4000, 5173...
call npx -y kill-port 3000 4000 5173

echo [2/4] Starting Main Backend (Next.js) on Port 3000...
start "Main Backend (3000)" cmd /k "cd ko\TRY && npm run dev"

echo [3/4] Starting Video Service (Express) on Port 4000...
start "Video Service (4000)" cmd /k "cd ko\TRY\backend && npm run dev"

echo [4/4] Starting Frontend (Vite) on Port 5173...
start "Frontend (5173)" cmd /k "cd LMS\frontend && npm run dev"

echo ==========================================
echo      ALL SERVICES RESTARTED
echo ==========================================
echo Please wait a moment for servers to boot up, then refresh your browser.
pause
