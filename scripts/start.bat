@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul 2>&1
title TAV Egitim Paneli
set "TRACE_LOG=%TEMP%\tav-egitim-start.log"
set "ERROR_LOG_NAME=error.log"
echo.>> "%TRACE_LOG%"
echo ===========================================================>> "%TRACE_LOG%"
echo [%DATE% %TIME%] start.bat basladi. Arg1=%~1 Arg2=%~2>> "%TRACE_LOG%"

set "DEBUG_MODE=0"
if /i "%~1"=="--debug" (
  set "DEBUG_MODE=1"
  shift
)

:: =========================================================
::  OTOMATIK MINIMIZE (UNC + ozel karakterli yol uyumlu)
:: =========================================================
if /i not "%~1"=="__minimized__" (
  if "%DEBUG_MODE%"=="0" (
    pushd "%~dp0." >nul 2>&1
    start "" /min cmd /d /c ""!CD!\%~nx0" __minimized__"
    exit /b
  )
)

:: =========================================================
::  ROOT belirleme + UNC ise surucu harfi esleme
:: =========================================================
set "ORIG_ROOT=%~dp0."
set "ORIG_ROOT=%ORIG_ROOT:/=\%"
set "POPCOUNT=0"

:: pushd ile klasore gir (UNC ise otomatik surucu harfi esler)
set "OK=0"
for /l %%R in (1,1,3) do (
  pushd "%ORIG_ROOT%" >nul 2>&1
  if not errorlevel 1 (
    set "OK=1"
    goto :pushd_ok
  )
  timeout /t 1 /nobreak >nul
)
:pushd_ok
if "%OK%"=="0" (
  echo [%DATE% %TIME%] HATA: Klasore erisilemiyor. Yol=%ORIG_ROOT%>> "%TRACE_LOG%"
  call :show_error "Klasore Erisilemiyor" "Ag paylasimina erisim saglanamadi.||Yol: %ORIG_ROOT%||Cozum:|- Ag kablonuzun bagli oldugundan emin olun|- VPN baglantinizi kontrol edin|- IT departmaniniza danisyin"
  exit /b 1
)
set /a POPCOUNT+=1

:: Artik %CD% her zaman surucu harfli yol
set "ROOT=%CD%\"
echo [BILGI] Calisma dizini: %ROOT%
echo [%DATE% %TIME%] Calisma dizini: %ROOT%>> "%TRACE_LOG%"
set "BOOT_LOG=%ROOT%app\boot.log"
set "ERROR_LOG=%ROOT%app\%ERROR_LOG_NAME%"
echo.>> "%BOOT_LOG%"
echo ===========================================================>> "%BOOT_LOG%"
echo [%DATE% %TIME%] Baslatma denemesi. ROOT=%ROOT%>> "%BOOT_LOG%"

:: =========================================================
::  Dosya kontrolleri (detayli hata mesajlari ile)
:: =========================================================
if not exist "%ROOT%node.exe" (
  echo [%DATE% %TIME%] HATA: node.exe bulunamadi.>> "%TRACE_LOG%"
  call :show_error "Dosya Bulunamadi" "node.exe bulunamadi!||Beklenen konum: %ROOT%node.exe||Cozum: node.exe dosyasini start.bat ile ayni klasore koyun."
  goto :cleanup_fail
)

if not exist "%ROOT%app\server.js" (
  echo [%DATE% %TIME%] HATA: app\server.js bulunamadi.>> "%TRACE_LOG%"
  call :show_error "Dosya Bulunamadi" "app\server.js bulunamadi!||Beklenen konum: %ROOT%app\server.js||Cozum: Uygulamayi yeniden paketleyin."
  goto :cleanup_fail
)

if not exist "%ROOT%app\launch.ps1" (
  echo [%DATE% %TIME%] HATA: app\launch.ps1 bulunamadi.>> "%TRACE_LOG%"
  call :show_error "Dosya Bulunamadi" "app\launch.ps1 bulunamadi!||Beklenen konum: %ROOT%app\launch.ps1||Cozum: Uygulamayi yeniden paketleyin."
  goto :cleanup_fail
)

:: =========================================================
::  PowerShell kullanilabilir mi kontrol et
:: =========================================================
powershell -NoProfile -Command "exit 0" >nul 2>&1
if errorlevel 1 (
  echo [%DATE% %TIME%] HATA: PowerShell kullanilamiyor.>> "%TRACE_LOG%"
  call :show_error "PowerShell Hatasi" "PowerShell calistirilamiyor!||Bu uygulama PowerShell gerektiriyor.||Cozum: IT departmaniniza PowerShell erisiminin||acilmasini isteyin."
  goto :cleanup_fail
)

:: =========================================================
::  Localhost temizligi
::  wmic yerine tasklist/netstat kullanir (wmic deprecated)
:: =========================================================
echo [BILGI] Onceki oturum kalintilari temizleniyor...
echo [%DATE% %TIME%] Localhost temizligi basliyor.>> "%TRACE_LOG%"

:: 1) Port 3000 ve 3001 uzerindeki LISTENING baglantilari temizle
for %%T in (3000 3001) do (
  for /f "tokens=5" %%P in ('netstat -aon 2^>nul ^| findstr ":%%T " ^| findstr "LISTENING"') do (
    if not "%%P"=="0" (
      taskkill /PID %%P /F >nul 2>&1
      echo [BILGI] Port %%T uzerindeki PID %%P sonlandirildi.
      echo [%DATE% %TIME%] Port %%T PID %%P kill.>> "%TRACE_LOG%"
    )
  )
)

:: 2) Onceki TAV oturumundan kalan node.exe process'leri temizle
::    PowerShell ile (wmic deprecated, kurumsal PC'de olmayabilir)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*server.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; Write-Host \"[BILGI] Eski node.exe PID $($_.ProcessId) sonlandirildi.\" }" 2>nul

:: 3) Kisa bekleme - isletim sistemi portlari serbest biraksin
ping -n 2 127.0.0.1 >nul

:: =========================================================
::  local.db yedekleme (PowerShell ile tarih al, wmic yerine)
:: =========================================================
if exist "%ROOT%app\local.db" (
  if not exist "%ROOT%backups" mkdir "%ROOT%backups" >nul 2>&1

  for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "TIMESTAMP=%%I"

  copy /y "%ROOT%app\local.db" "%ROOT%backups\local_!TIMESTAMP!.db" >nul
  echo [YEDEK] local.db -^> backups\local_!TIMESTAMP!.db

  set "COUNT=0"
  for /f "delims=" %%F in ('dir /b /o-d "%ROOT%backups\local_*.db" 2^>nul') do (
    set /a COUNT+=1
    if !COUNT! gtr 5 del "%ROOT%backups\%%F" >nul 2>&1
  )
) else (
  echo [UYARI] local.db yok, yedek alinmadi.
)

:: =========================================================
::  PORT
:: =========================================================
set "PORT=3000"
set "PORT_BUSY=0"
for /f "tokens=5" %%P in ('netstat -aon 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
  set "PORT_BUSY=1"
)
if "!PORT_BUSY!"=="1" set "PORT=3001"

:: =========================================================
::  PS1 DOSYASIYLA BASLAT
:: =========================================================
echo [BILGI] Uygulama baslatiliyor (port: !PORT!)...
echo [%DATE% %TIME%] launch.ps1 calistiriliyor. Port=!PORT!>> "%TRACE_LOG%"

:: ROOT sonundaki \ PowerShell'de tirnak sorununa yol acar, kaldir
set "ROOT_PS=!ROOT:~0,-1!"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%app\launch.ps1" -Port !PORT! -Root "!ROOT_PS!" >> "%BOOT_LOG%" 2>&1
set "PS_EXIT=%ERRORLEVEL%"
echo [%DATE% %TIME%] launch.ps1 exit code: %PS_EXIT%>> "%BOOT_LOG%"
echo [%DATE% %TIME%] launch.ps1 exit code: %PS_EXIT%>> "%TRACE_LOG%"

if not "%PS_EXIT%"=="0" (
  echo [%DATE% %TIME%] launch.ps1 HATA ile kapandi.>> "%TRACE_LOG%"
  if exist "%ERROR_LOG%" (
    echo.
    echo [HATA] Uygulama baslatilamadi.
    echo [HATA] Detaylar: %ERROR_LOG%
    echo.
    echo Hata logunu acmak ister misiniz?
    choice /c EH /m "   (E)vet / (H)ayir" 2>nul
    if !errorlevel! equ 1 (
      notepad "%ERROR_LOG%"
    )
  ) else (
    echo.
    echo [HATA] launch.ps1 hata ile kapandi. Exit code: %PS_EXIT%
    echo [HATA] Detay log: %BOOT_LOG%
    echo.
    echo Boot logunu acmak ister misiniz?
    choice /c EH /m "   (E)vet / (H)ayir" 2>nul
    if !errorlevel! equ 1 (
      notepad "%BOOT_LOG%"
    )
  )
  goto :cleanup_fail
)

goto :cleanup_ok

:: =========================================================
::  Hata gosterme fonksiyonu
::  || -> yeni satir, |- -> madde isareti
::  PowerShell Constrained Language Mode'da popup acilamazsa
::  mshta (HTML popup) kullanilir, o da olmazsa CMD'de gosterir
:: =========================================================
:show_error
set "ERR_TITLE=%~1"
set "ERR_MSG=%~2"

:: Log dosyasina yaz
echo [%DATE% %TIME%] HATA: %ERR_TITLE% - %ERR_MSG%>> "%TRACE_LOG%"

:: error.log varsa oraya da yaz
if defined ERROR_LOG (
  echo.>> "%ERROR_LOG%" 2>nul
  echo ===========================================================>> "%ERROR_LOG%" 2>nul
  echo [%DATE% %TIME%] %ERR_TITLE%>> "%ERROR_LOG%" 2>nul
  echo %ERR_MSG%>> "%ERROR_LOG%" 2>nul
  echo ===========================================================>> "%ERROR_LOG%" 2>nul
)

:: Oncelikle mshta ile popup dene (PowerShell bagimsiz, her Windows'ta var)
set "POPUP_MSG=%ERR_MSG:||=\n%"
set "POPUP_MSG=!POPUP_MSG:|-=- !"
mshta "javascript:var sh=new ActiveXObject('WScript.Shell');sh.Popup('!POPUP_MSG!'.replace(/\\n/g,'\n'),0,'TAV Egitim - %ERR_TITLE%',16);close()" >nul 2>&1
if not errorlevel 1 goto :eof

:: mshta da basarisiz olduysa CMD'de goster
echo.
echo ============================================
echo   HATA: %ERR_TITLE%
echo ============================================
echo   %ERR_MSG%
echo ============================================
echo.
pause
goto :eof

:cleanup_fail
echo.
echo [HATA] Baslatma basarisiz.
echo [%DATE% %TIME%] Baslatma basarisiz.>> "%TRACE_LOG%"
pause

:cleanup_ok
:cleanup_loop
if %POPCOUNT% GTR 0 (
  popd
  set /a POPCOUNT-=1
  goto :cleanup_loop
)

if "%DEBUG_MODE%"=="1" (
  echo.
  echo [BILGI] Debug modda calisti. Kapatmak icin bir tusa basin.
  echo [%DATE% %TIME%] Debug mod tamamlandi.>> "%TRACE_LOG%"
  pause
)

endlocal
exit
