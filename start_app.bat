@echo off
echo Starting Mentorship Platform...

:: Start Backend
echo Starting Backend Server...
start "Mentorship Backend" cmd /k "cd backend && npm start"

:: Start Frontend
echo Starting Frontend Server...
start "Mentorship Frontend" cmd /k "cd frontend && npm start"

echo.
echo Application is starting!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo You can close this window, but keep the other two terminal windows open.
pause
