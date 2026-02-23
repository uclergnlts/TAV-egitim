@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title TAV Egitim Paneli

echo.
echo ============================================
echo   TAV Egitim Paneli baslatiliyor...
echo ============================================
echo.

:: ============================================
::   Dosya kontrolleri
:: ============================================
if not exist "%~dp0node.exe" (
    echo HATA: node.exe bulunamadi!
    echo node.exe dosyasini start.bat ile ayni klasore koyun.
    echo.
    pause
    exit /b 1
)

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

    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
    set "TIMESTAMP=!DT:~0,4!-!DT:~4,2!-!DT:~6,2!_!DT:~8,2!-!DT:~10,2!-!DT:~12,2!"

    copy /y "%~dp0app\local.db" "%~dp0backups\local_!TIMESTAMP!.db" >nul
    echo   [YEDEK] local.db yedeklendi

    :: Eski yedekleri temizle - sadece son 5
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
::   Port kontrolu (3000, mesgulse 3001)
:: ============================================
set PORT=3000

set "PORT_BUSY=0"
for /f "tokens=5" %%P in ('netstat -aon 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    set "PORT_BUSY=1"
)

if "!PORT_BUSY!"=="1" (
    echo   [BILGI] Port 3000 mesgul, port 3001 deneniyor...
    set PORT=3001

    set "PORT2_BUSY=0"
    for /f "tokens=5" %%P in ('netstat -aon 2^>nul ^| findstr ":3001 " ^| findstr "LISTENING"') do (
        set "PORT2_BUSY=1"
    )

    if "!PORT2_BUSY!"=="1" (
        echo   [HATA] Port 3000 ve 3001 de mesgul!
        echo   Diger TAV Egitim pencerelerini kapatin ve tekrar deneyin.
        echo.
        pause
        exit /b 1
    )
)

:: ============================================
::   Ortam degiskenleri
:: ============================================
set NODE_ENV=production
set HOSTNAME=localhost
set JWT_SECRET=tav-egitim-paneli-local-jwt-secret-2024-secure-key

:: ============================================
::   UNC path destegi: pushd ag yolunu
::   gecici bir surucu harfine baglar (Z: vb.)
::   Boylece cmd.exe UNC path uzerinde calisabilir
:: ============================================
pushd "%~dp0app"
if errorlevel 1 (
    echo HATA: Uygulama klasorune erisim saglanamadi!
    echo Ag baglantinizi kontrol edin.
    echo.
    pause
    exit /b 1
)

:: ============================================
::   Tarayiciyi gecikmeli ac
:: ============================================
start "" /b cmd /c "title TAV-Browser & ping -n 5 127.0.0.1 >nul & start http://localhost:!PORT! & exit"

echo ============================================
echo   Uygulama baslatildi!
echo ============================================
echo.
echo   Erisim: http://localhost:!PORT!
echo   Tarayici birkac saniye icinde acilacak.
echo.
echo   KAPATMAK ICIN: Bu pencereyi kapatin
echo   veya kapat.bat dosyasina cift tiklayin.
echo.
echo ============================================
echo.

:: Server'i on planda calistir
"%~dp0node.exe" server.js

:: Server durdu - pushd'yi geri al
popd

echo.
echo   Uygulama kapatildi.
echo.
pause
