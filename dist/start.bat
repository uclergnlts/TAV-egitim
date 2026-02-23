@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul 2>&1
title TAV Egitim - Baslat

set "BASE=%~dp0"
set "APP_DIR=%BASE%app"
set "RUNTIME_DIR=%BASE%runtime"
set "PID_FILE=%RUNTIME_DIR%\node.pid"
set "PORT_FILE=%RUNTIME_DIR%\port.txt"

if not exist "%BASE%node.exe" (
    echo HATA: node.exe bulunamadi.
    pause
    exit /b 1
)

if not exist "%APP_DIR%\server.js" (
    echo HATA: app\server.js bulunamadi.
    pause
    exit /b 1
)

if not exist "%RUNTIME_DIR%" mkdir "%RUNTIME_DIR%" >nul 2>&1
if not exist "%BASE%backups" mkdir "%BASE%backups" >nul 2>&1

if exist "%APP_DIR%\local.db" (
    for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "TIMESTAMP=%%I"
    copy /y "%APP_DIR%\local.db" "%BASE%backups\local_!TIMESTAMP!.db" >nul 2>&1
    set "COUNT=0"
    for /f "delims=" %%F in ('dir /b /o-d "%BASE%backups\local_*.db" 2^>nul') do (
        set /a COUNT+=1
        if !COUNT! gtr 5 del "%BASE%backups\%%F" >nul 2>&1
    )
)

if exist "%PID_FILE%" (
    set /p RUN_PID=<"%PID_FILE%"
    if defined RUN_PID (
        tasklist /fi "PID eq !RUN_PID!" | findstr /i "node.exe" >nul 2>&1
        if !errorlevel! equ 0 (
            if exist "%PORT_FILE%" (
                set /p PORT=<"%PORT_FILE%"
            ) else (
                set "PORT=3000"
            )
            start "" "http://localhost:!PORT!"
            exit /b 0
        )
    )
)

set "PORT=3000"
call :is_port_busy 3000 PORT_BUSY
if "!PORT_BUSY!"=="1" (
    set "PORT=3001"
    call :is_port_busy 3001 PORT2_BUSY
    if "!PORT2_BUSY!"=="1" (
        echo HATA: Port 3000 ve 3001 mesgul.
        pause
        exit /b 1
    )
)

for /f %%I in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:NODE_ENV='production';$env:HOSTNAME='localhost';$env:PORT='!PORT!';$env:JWT_SECRET='tav-egitim-paneli-local-jwt-secret-2024-secure-key';$p=Start-Process -FilePath '%BASE%node.exe' -ArgumentList 'server.js' -WorkingDirectory '%APP_DIR%' -WindowStyle Hidden -PassThru; $p.Id"') do set "NODE_PID=%%I"

if not defined NODE_PID (
    echo HATA: Uygulama baslatilamadi.
    pause
    exit /b 1
)

> "%PID_FILE%" echo !NODE_PID!
> "%PORT_FILE%" echo !PORT!

start "" /b cmd /c "ping -n 4 127.0.0.1 >nul & start http://localhost:!PORT!"
echo Uygulama baslatildi. Tarayici aciliyor...
exit /b 0

:is_port_busy
setlocal
set "PORT_TO_CHECK=%~1"
set "BUSY=0"
for /f "tokens=5" %%P in ('netstat -aon 2^>nul ^| findstr ":%PORT_TO_CHECK% " ^| findstr "LISTENING"') do set "BUSY=1"
endlocal & set "%~2=%BUSY%"
exit /b 0
