@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title TAV Egitim - Guncelleme

echo.
echo ============================================
echo   TAV Egitim Paneli - Guncelleme Araci
echo ============================================
echo.
echo   Bu script uygulamayi guncellerken
echo   veritabanini (local.db) KORUR.
echo.

:: ============================================
::   UNC path destegi
:: ============================================
pushd "%~dp0"
if errorlevel 1 (
    echo HATA: Klasore erisim saglanamadi!
    echo Ag baglantinizi kontrol edin.
    echo.
    pause
    exit /b 1
)

set "APP_DIR=%CD%\"

:: ============================================
::   Guncelleme klasorunu bul
:: ============================================
set "UPDATE_DIR=%CD%\guncelleme"

if not exist "!UPDATE_DIR!\app\server.js" (
    set "UPDATE_DIR=%CD%"
    if not exist "!UPDATE_DIR!\app\server.js" (
        echo HATA: Guncelleme dosyalari bulunamadi!
        echo.
        echo Kullanim:
        echo   1. Yeni dist klasorunun ICERIGINI "guncelleme" adinda
        echo      bir klasore kopyalayin
        echo   2. "guncelleme" klasorunu update.bat'in yanina koyun
        echo   3. update.bat'i calistirin
        echo.
        echo Beklenen yapi:
        echo   update.bat
        echo   guncelleme\
        echo       app\server.js
        echo       node.exe
        echo       start.bat
        echo       kapat.bat
        echo.
        popd
        pause
        exit /b 1
    )
)

:: start.bat var mi kontrol et (mevcut kurulum)
if not exist "!APP_DIR!start.bat" (
    echo HATA: Mevcut kurulum bulunamadi!
    echo update.bat'i mevcut uygulama klasorune koyun.
    echo.
    popd
    pause
    exit /b 1
)

echo   Mevcut kurulum : !APP_DIR!
echo   Guncelleme     : !UPDATE_DIR!
echo.

:: ============================================
::   Veritabani yedekle (guncelleme oncesi)
:: ============================================
if exist "!APP_DIR!app\local.db" (
    if not exist "!APP_DIR!backups" mkdir "!APP_DIR!backups"

    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%I"
    set "TIMESTAMP=!DT:~0,4!-!DT:~4,2!-!DT:~6,2!_!DT:~8,2!-!DT:~10,2!-!DT:~12,2!"

    copy /y "!APP_DIR!app\local.db" "!APP_DIR!backups\local_guncelleme_oncesi_!TIMESTAMP!.db" >nul
    echo   [YEDEK] Guncelleme oncesi yedek alindi.
) else (
    echo   [BILGI] Mevcut local.db bulunamadi, ilk kurulum olabilir.
)
echo.

:: ============================================
::   Mevcut DB'yi gecici yere tasi
:: ============================================
set "DB_SAVED=0"
if exist "!APP_DIR!app\local.db" (
    copy /y "!APP_DIR!app\local.db" "!APP_DIR!local_db_temp_save" >nul
    set "DB_SAVED=1"
    echo   [1/4] Veritabani gecici olarak korunuyor...
)

:: ============================================
::   Eski app klasorunu temizle, yenisini kopyala
:: ============================================
echo   [2/4] Uygulama dosyalari guncelleniyor...

if exist "!APP_DIR!app" rmdir /s /q "!APP_DIR!app"
xcopy /e /i /q "!UPDATE_DIR!\app" "!APP_DIR!app" >nul
echo          app\ klasoru guncellendi.

:: node.exe guncelle
if exist "!UPDATE_DIR!\node.exe" (
    copy /y "!UPDATE_DIR!\node.exe" "!APP_DIR!node.exe" >nul
    echo          node.exe guncellendi.
)

:: start.bat guncelle
if exist "!UPDATE_DIR!\start.bat" (
    copy /y "!UPDATE_DIR!\start.bat" "!APP_DIR!start.bat" >nul
    echo          start.bat guncellendi.
)

:: kapat.bat guncelle
if exist "!UPDATE_DIR!\kapat.bat" (
    copy /y "!UPDATE_DIR!\kapat.bat" "!APP_DIR!kapat.bat" >nul
    echo          kapat.bat guncellendi.
)

:: ============================================
::   Veritabanini geri koy
:: ============================================
echo   [3/4] Veritabani geri yukleniyor...
if "!DB_SAVED!"=="1" (
    copy /y "!APP_DIR!local_db_temp_save" "!APP_DIR!app\local.db" >nul
    del "!APP_DIR!local_db_temp_save" >nul 2>&1
    echo          Mevcut veritabani korundu!
) else (
    echo          Yeni veritabani kullaniliyor.
)

:: ============================================
::   DB migration (yeni kolonlar varsa)
:: ============================================
echo   [4/4] Veritabani sema kontrolu yapiliyor...
if exist "!APP_DIR!node.exe" (
    "!APP_DIR!node.exe" -e "const{createClient:c}=require('@libsql/client');const d=c({url:'file:!APP_DIR!app/local.db'});const m=['email TEXT'];(async()=>{for(const col of m){try{await d.execute('ALTER TABLE personnel ADD COLUMN '+col)}catch(e){}}console.log('Sema kontrolu tamamlandi.')})();" 2>nul
)

echo.
echo ============================================
echo   Guncelleme tamamlandi!
echo ============================================
echo.
echo   Uygulamayi baslatmak icin start.bat'a
echo   cift tiklayin.
echo.

:: Guncelleme klasorunu temizle
if exist "!UPDATE_DIR!\app\server.js" (
    if /i not "!UPDATE_DIR!"=="!APP_DIR!" (
        echo   Guncelleme klasoru temizlensin mi?
        choice /c EH /m "   (E)vet / (H)ayir"
        if !errorlevel! equ 1 (
            rmdir /s /q "!UPDATE_DIR!"
            echo   Guncelleme klasoru silindi.
        )
    )
)

echo.
popd
pause
