@echo off
setlocal EnableExtensions
chcp 65001 >nul 2>&1
title TAV Egitim - Kapat

set "BASE=%~dp0"
set "RUNTIME_DIR=%BASE%runtime"
set "PID_FILE=%RUNTIME_DIR%\node.pid"
set "PORT_FILE=%RUNTIME_DIR%\port.txt"

set "CLOSED=0"

if exist "%PID_FILE%" (
    set /p RUN_PID=<"%PID_FILE%"
    if defined RUN_PID (
        taskkill /PID %RUN_PID% /F >nul 2>&1
        if not errorlevel 1 set "CLOSED=1"
    )
)

if exist "%PORT_FILE%" (
    set /p RUN_PORT=<"%PORT_FILE%"
    for /f "tokens=5" %%P in ('netstat -aon 2^>nul ^| findstr ":%RUN_PORT% " ^| findstr "LISTENING"') do (
        taskkill /PID %%P /F >nul 2>&1
        set "CLOSED=1"
    )
)

if exist "%PID_FILE%" del "%PID_FILE%" >nul 2>&1
if exist "%PORT_FILE%" del "%PORT_FILE%" >nul 2>&1

if "%CLOSED%"=="1" (
    echo Uygulama kapatildi.
) else (
    echo Calisan uygulama bulunamadi.
)

ping -n 3 127.0.0.1 >nul
exit /b 0
