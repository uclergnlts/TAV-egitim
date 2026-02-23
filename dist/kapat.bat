@echo off
chcp 65001 >nul 2>&1
title TAV Egitim - Kapat

echo.
echo ============================================
echo   TAV Egitim Paneli kapatiliyor...
echo ============================================
echo.

:: "TAV Egitim Paneli" baslikli pencereyi kapat
:: Bu, start.bat'in actigi cmd penceresini kapatir
:: ve icindeki node.exe process'i de otomatik durur
taskkill /fi "WINDOWTITLE eq TAV Egitim Paneli" >nul 2>&1

:: Ek guvenlik: port 3000 ve 3001 uzerindeki node process'lerini temizle
for /f "tokens=5" %%P in ('netstat -aon 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%P /F >nul 2>&1
)
for /f "tokens=5" %%P in ('netstat -aon 2^>nul ^| findstr ":3001 " ^| findstr "LISTENING"') do (
    taskkill /PID %%P /F >nul 2>&1
)

echo   Uygulama kapatildi.
echo.
echo   Bu pencere 3 saniye icinde kapanacak...
ping -n 4 127.0.0.1 >nul
exit
