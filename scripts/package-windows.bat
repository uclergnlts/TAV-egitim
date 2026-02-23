@echo off
chcp 65001 >nul 2>&1
title TAV Egitim - Windows Paketleme

echo ============================================
echo   TAV Egitim - Windows Dagitim Paketi
echo ============================================
echo.

:: Proje dizinine git
cd /d "%~dp0.."

:: npm/node arama sirasi:
:: 1. Proje kokunde portable node klasoru (node\ veya node-v*\ )
:: 2. Sistem PATH
:: 3. Bilinen kurulum konumlari

:: Portable node klasoru kontrol et
if exist "node\npm.cmd" (
    echo Portable Node.js bulundu: %cd%\node
    set "PATH=%cd%\node;%PATH%"
    goto :node_found
)

:: node-v*-win-x64 gibi klasor isimlerini ara (zip acilinca boyle oluyor)
for /d %%D in (node-v*) do (
    if exist "%%D\npm.cmd" (
        echo Portable Node.js bulundu: %cd%\%%D
        set "PATH=%cd%\%%D;%PATH%"
        goto :node_found
    )
)

:: Sistem PATH kontrolu
where npm >nul 2>&1
if not errorlevel 1 goto :node_found

:: Bilinen kurulum konumlari
if exist "%ProgramFiles%\nodejs\npm.cmd" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    goto :node_found
)
if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" (
    set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    goto :node_found
)

:: Hicbir yerde bulunamadi
echo HATA: Node.js / npm bulunamadi!
echo.
echo COZUM: Portable Node.js kullanin:
echo   1. Indirin: https://nodejs.org/dist/v20.18.1/node-v20.18.1-win-x64.zip
echo   2. ZIP dosyasini proje klasorune cikartin
echo      (node-v20.18.1-win-x64\ klasoru olusacak)
echo   3. Bu scripti tekrar calistirin
echo.
pause
exit /b 1

:node_found
echo Node.js: & node --version
echo npm:     & call npm --version
echo.

:: Mevcut dist klasorunu temizle
if exist dist (
    echo Eski dist klasoru temizleniyor...
    rmdir /s /q dist
)

:: npm install
echo [1/9] npm install calistiriliyor...
call npm install
if errorlevel 1 (
    echo.
    echo HATA: npm install basarisiz oldu!
    pause
    exit /b 1
)
echo      Bagimliliklar yuklendi.
echo.

:: Build
echo [2/9] npm run build calistiriliyor...
call npm run build
if errorlevel 1 (
    echo.
    echo HATA: Build basarisiz oldu!
    echo Lutfen hatalari duzeltin ve tekrar deneyin.
    pause
    exit /b 1
)
echo      Build basarili!
echo.

:: dist klasor yapisi olustur
echo [3/9] Dist klasoru olusturuluyor...
mkdir dist\app

:: Standalone ciktisini kopyala
echo [4/9] Standalone uygulama kopyalaniyor...
xcopy /e /i /q ".next\standalone\*" "dist\app\" >nul
if errorlevel 1 (
    echo HATA: Standalone klasoru bulunamadi!
    echo next.config.mjs dosyasinda output: 'standalone' ayari var mi?
    pause
    exit /b 1
)
echo      Standalone uygulama kopyalandi.

:: server.js icindeki hardcoded path'leri temizle (UNC path uyumlulugu)
echo      server.js icindeki lokal yollar temizleniyor...
if exist "dist\app\server.js" (
    "%~dp0..\node_modules\.bin\node" -e "const fs=require('fs');let s=fs.readFileSync('dist/app/server.js','utf8');s=s.replace(/\"outputFileTracingRoot\":\"[^\"]*\"/,'\"outputFileTracingRoot\":\"\"');s=s.replace(/\"root\":\"[^\"]*\"/g,(m,o)=>s.indexOf('turbopack',o-50)>o-50?'\"root\":\"\"':m);fs.writeFileSync('dist/app/server.js',s);" 2>nul
    if not errorlevel 1 echo      Hardcoded path'ler temizlendi.
)
echo.

:: Static dosyalari kopyala (Next.js standalone dokumantasyonu geregi)
echo [5/9] Static dosyalar kopyalaniyor...
xcopy /e /i /q ".next\static\*" "dist\app\.next\static\" >nul
echo      Static dosyalar kopyalandi.
echo.

:: Public klasorunu kopyala
echo [6/9] Public dosyalar kopyalaniyor...
if exist public (
    xcopy /e /i /q "public\*" "dist\app\public\" >nul
    echo      Public dosyalar kopyalandi.
) else (
    echo      Public klasoru bulunamadi, atlaniyor.
)
echo.

:: Veritabani dosyasini kopyala
echo [7/9] Veritabani kopyalaniyor...
if exist local.db (
    copy /y "local.db" "dist\app\local.db" >nul
    echo      Veritabani kopyalandi.
) else (
    echo      UYARI: local.db bulunamadi!
    echo      Uygulamayi baslatmadan once local.db dosyasini dist\app\ klasorune koyun.
)
echo.

:: .env dosyasini olustur (runtime icin gerekli)
echo [8/9] .env dosyasi olusturuluyor...
(
echo # JWT Secret ^(min 32 characters^)
echo JWT_SECRET=tav-egitim-paneli-local-jwt-secret-2024-secure-key
echo.
echo # App Environment
echo APP_ENV=production
) > "dist\app\.env"
echo      .env dosyasi olusturuldu.
echo.

:: start.bat, kapat.bat ve update.bat kopyala
echo start.bat, kapat.bat ve update.bat kopyalaniyor...
copy /y "%~dp0start.bat" "dist\start.bat" >nul
copy /y "%~dp0kapat.bat" "dist\kapat.bat" >nul 2>&1
copy /y "%~dp0update.bat" "dist\update.bat" >nul 2>&1
echo      start.bat kopyalandi.
echo      kapat.bat kopyalandi.
echo      update.bat kopyalandi.
echo.

:: node.exe kopyala
echo [9/9] node.exe kopyalaniyor...
set "NODE_COPIED=0"
if exist "node\node.exe" (
    copy /y "node\node.exe" "dist\node.exe" >nul
    set "NODE_COPIED=1"
)
if "%NODE_COPIED%"=="0" (
    for /d %%D in (node-v*) do (
        if exist "%%D\node.exe" (
            copy /y "%%D\node.exe" "dist\node.exe" >nul
            set "NODE_COPIED=1"
        )
    )
)
if "%NODE_COPIED%"=="0" (
    where node >nul 2>&1
    if not errorlevel 1 (
        for /f "delims=" %%N in ('where node') do (
            copy /y "%%N" "dist\node.exe" >nul
            set "NODE_COPIED=1"
        )
    )
)

if "%NODE_COPIED%"=="1" (
    echo      node.exe dist\ klasorune kopyalandi.
) else (
    echo      UYARI: node.exe kopyalanamadi!
    echo      dist\ klasorune manuel olarak node.exe koymaniz gerekiyor.
)
echo.

:: Tamamlandi
echo ============================================
echo   Paketleme tamamlandi!
echo ============================================
echo.
echo Dist klasoru: %cd%\dist
echo.
if "%NODE_COPIED%"=="1" (
    echo dist\ klasoru dagitima hazir!
    echo Hedef bilgisayara kopyalayin ve start.bat'a cift tiklayin.
) else (
    echo SONRAKI ADIM:
    echo   node.exe dosyasini dist\ klasorune koyun, sonra dagitima hazir.
)
echo.
pause
