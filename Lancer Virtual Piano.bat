@echo off
title Virtual Piano - Console
cd /d "%~dp0"

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Lancement en Administrateur pour activer la photo et la bio Discord...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
echo ============================================================
echo   VIRTUAL PIANO - Console Active (Statut Discord + Audio)
echo   Ne ferme pas cette fenetre pendant que tu joues.
echo ============================================================
echo.
"node_modules\electron\dist\Virtual Piano.exe" .
pause
