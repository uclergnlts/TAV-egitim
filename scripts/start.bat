@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title TAV Egitim Paneli

echo.
echo ============================================
echo   TAV Egitim Paneli baslatiliyor...
echo ============================================
echo.

:: node.exe kontrol
if not exist "%~dp0node.exe" (
    echo HATA: node.exe bulunamadi!
    echo node.exe dosyasini start.bat ile ayni klasore koyun.
    echo.
    pause
    exit /b 1
)

:: app klasoru kontrol
if not exist "%~dp0app\server.js" (
    echo HATA: app\server.js bulunamadi!
    echo Paketleme dogru yapilmamis olabilir.
    echo.
    pause
    exit /b 1
)

:: ============================================
::   Veritabani Yedekleme
:: ============================================
if exist "%~dp0app\local.db" (
    if not exist "%~dp0backups" mkdir "%~dp0backups"

    :: Tarih ve saat bilgisi al (YYYY-MM-DD_HH-MM-SS)
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
    set "TIMESTAMP=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%_%DT:~8,2%-%DT:~10,2%-%DT:~12,2%"

    copy /y "%~dp0app\local.db" "%~dp0backups\local_%TIMESTAMP%.db" >nul
    echo   [YEDEK] local.db yedeklendi: backups\local_%TIMESTAMP%.db

    :: Eski yedekleri temizle - sadece son 5 yedeği tut
    set "COUNT=0"
    for /f "delims=" %%F in ('dir /b /o-d "%~dp0backups\local_*.db" 2^>nul') do (
        set /a COUNT+=1
        if !COUNT! gtr 5 del "%~dp0backups\%%F" >nul 2>&1
    )
) else (
    echo   [UYARI] local.db bulunamadi, yedek alinamadi!
)
echo.

:: ============================================
::   Port kontrolu
:: ============================================
set PORT=3000
for /f "tokens=5" %%P in ('netstat -aon 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    echo   [UYARI] Port 3000 baska bir uygulama tarafindan kullaniliyor ^(PID: %%P^)
    echo   Kapatmak icin: taskkill /PID %%P /F
    echo.
)

:: ============================================
::   Ortam degiskenleri
:: ============================================
set NODE_ENV=production
set HOSTNAME=0.0.0.0
set JWT_SECRET=tav-egitim-paneli-local-jwt-secret-2024-secure-key

cd /d "%~dp0app"

:: ============================================
::   Tarayiciyi gecikmeli ac (server hazir olsun)
:: ============================================
start "" /b cmd /c "title TAV-Browser-Opener & ping -n 8 127.0.0.1 >nul & start http://localhost:%PORT%"

echo ============================================
echo   Uygulama baslatiliyor...
echo ============================================
echo.
echo   Erisim: http://localhost:%PORT%
echo   Tarayici birkaç saniye icinde acilacak.
echo.
echo   Bu pencereyi kapatmak uygulamayi durduracaktir.
echo   Hata olursa asagida gorunecektir.
echo.
echo ============================================
echo.

:: Server'i on planda calistir (hatalar gorunur)
"%~dp0node.exe" server.js

:: Buraya gelirse server durmus demektir
echo.
echo ============================================
echo   [HATA] Server durdu!
echo   Yukardaki hata mesajlarini kontrol edin.
echo ============================================
echo.
pause
