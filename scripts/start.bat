@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title TAV Egitim Paneli

:: ============================================
::   Dosya kontrolleri
:: ============================================
if not exist "%~dp0node.exe" (
    echo HATA: node.exe bulunamadi!
    pause
    exit /b 1
)
if not exist "%~dp0app\server.js" (
    echo HATA: app\server.js bulunamadi!
    pause
    exit /b 1
)

:: ============================================
::   Veritabani Yedekleme
:: ============================================
if exist "%~dp0app\local.db" (
    if not exist "%~dp0backups" mkdir "%~dp0backups"
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
    set "TIMESTAMP=!DT:~0,4!-!DT:~4,2!-!DT:~6,2!_!DT:~8,2!-!DT:~10,2!-!DT:~12,2!"
    copy /y "%~dp0app\local.db" "%~dp0backups\local_!TIMESTAMP!.db" >nul

    :: Son 5 yedek tut
    set "COUNT=0"
    for /f "delims=" %%F in ('dir /b /o-d "%~dp0backups\local_*.db" 2^>nul') do (
        set /a COUNT+=1
        if !COUNT! gtr 5 del "%~dp0backups\%%F" >nul 2>&1
    )
)

:: ============================================
::   Port kontrolu
:: ============================================
set PORT=3000

:: Onceki oturumdan kalan process varsa kapat
for /f "tokens=5" %%P in ('netstat -aon 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%P /F >nul 2>&1
)

:: Hala mesgulse 3001 dene
set "PORT_BUSY=0"
for /f "tokens=5" %%P in ('netstat -aon 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    set "PORT_BUSY=1"
)
if "!PORT_BUSY!"=="1" set PORT=3001

:: ============================================
::   Ortam degiskenleri
:: ============================================
set NODE_ENV=production
set HOSTNAME=localhost
set JWT_SECRET=tav-egitim-paneli-local-jwt-secret-2024-secure-key

:: ============================================
::   UNC path destegi
::   pushd ag yolunu gecici surucu harfine baglar
:: ============================================
pushd "%~dp0app"
if errorlevel 1 (
    echo HATA: Uygulama klasorune erisim saglanamadi!
    pause
    exit /b 1
)

:: Calisma dizinini kaydet (pushd sonrasi mapped drive)
set "APP_DIR=%CD%"

:: ============================================
::   Node.exe'yi GIZLI baslat (VBScript ile)
::   Kullanici hicbir CMD penceresi gormez
:: ============================================
set "VBS=%TEMP%\tav_launch_%RANDOM%.vbs"
> "!VBS!" echo Set oShell = CreateObject("WScript.Shell")
>> "!VBS!" echo oShell.CurrentDirectory = "!APP_DIR!"
>> "!VBS!" echo oShell.Run """%~dp0node.exe"" server.js", 0, False

cscript //nologo "!VBS!"
del "!VBS!" >nul 2>&1

:: pushd'yi geri al
popd

:: ============================================
::   Server'in hazir olmasini bekle, tarayici ac
:: ============================================
ping -n 4 127.0.0.1 >nul
start "" "http://localhost:!PORT!"

:: ============================================
::   Bu CMD penceresi hemen kapanir
::   Node.exe arka planda calisir
::   Tarayici kapaninca heartbeat durur
::   ve sunucu 60 sn sonra otomatik kapanir
:: ============================================
exit
