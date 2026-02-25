param(
    [int]$Port = 3000,
    [string]$Root = ""
)

# =========================================================
#  Hata log dosyasi
# =========================================================
$errorLogPath = Join-Path $Root 'app\error.log'
$bootLogPath  = Join-Path $Root 'app\boot.log'

function Write-Log {
    param([string]$Message, [string]$Level = "BILGI")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] [$Level] $Message"
    Write-Host "[$Level] $Message"
    try { Add-Content -Path $bootLogPath -Value $line -ErrorAction SilentlyContinue } catch {}
}

function Show-Error {
    param([string]$Title, [string]$Message)
    # Hatayi log dosyasina yaz
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $errorContent = @"
===========================================================
[$timestamp] HATA RAPORU
===========================================================
$Title
-----------------------------------------------------------
$Message
===========================================================
"@
    try { Add-Content -Path $errorLogPath -Value $errorContent -ErrorAction SilentlyContinue } catch {}
    Write-Log "$Title - $Message" "HATA"

    # Popup goster - birden fazla yontem dene
    $shown = $false

    # Yontem 1: Windows Forms (Constrained Language Mode'da calismayabilir)
    if (-not $shown) {
        try {
            Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
            [System.Windows.Forms.MessageBox]::Show(
                "$Message`n`nDetay icin:`n$errorLogPath",
                "TAV Egitim - $Title",
                [System.Windows.Forms.MessageBoxButtons]::OK,
                [System.Windows.Forms.MessageBoxIcon]::Error
            ) | Out-Null
            $shown = $true
        } catch {}
    }

    # Yontem 2: WScript.Shell Popup (COM, daha az kisitlama)
    if (-not $shown) {
        try {
            $wshell = New-Object -ComObject WScript.Shell -ErrorAction Stop
            $wshell.Popup("$Message`n`nDetay: $errorLogPath", 0, "TAV Egitim - $Title", 16) | Out-Null
            $shown = $true
        } catch {}
    }

    # Yontem 3: mshta (her Windows'ta var)
    if (-not $shown) {
        try {
            $escapedMsg = $Message -replace "'", "\'" -replace "`n", '\n'
            & mshta "javascript:var sh=new ActiveXObject('WScript.Shell');sh.Popup('$escapedMsg',0,'TAV Egitim - $Title',16);close()" 2>$null
            $shown = $true
        } catch {}
    }

    # Yontem 4: CMD'de goster
    if (-not $shown) {
        Write-Host ""
        Write-Host "============================================"
        Write-Host "  HATA: $Title"
        Write-Host "============================================"
        Write-Host "  $Message"
        Write-Host ""
        Write-Host "  Detay log: $errorLogPath"
        Write-Host "============================================"
    }
}

# =========================================================
#  CIM sorgusu yapabiliyor muyuz kontrol et
#  (Get-CimInstance modern, Get-WmiObject legacy fallback)
# =========================================================
$useCim = $true
try {
    Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop | Out-Null
} catch {
    $useCim = $false
    Write-Log "Get-CimInstance kullanilamiyor, Get-WmiObject'e geciliyor." "UYARI"
}

function Get-ProcessByName {
    param([string]$Filter)
    if ($useCim) {
        return Get-CimInstance Win32_Process -Filter $Filter -ErrorAction SilentlyContinue
    } else {
        return Get-WmiObject -Query "SELECT * FROM Win32_Process WHERE $Filter" -ErrorAction SilentlyContinue
    }
}

# =========================================================
#  Root yolunu normalize et (sondaki \ veya " temizle)
# =========================================================
$Root = $Root.Trim('"', ' ')
if (-not $Root.EndsWith('\')) { $Root = "$Root\" }

# =========================================================
#  Dosya kontrolleri
# =========================================================
$nodePath   = Join-Path $Root 'node.exe'
$serverPath = Join-Path $Root 'app\server.js'
$appDir     = Join-Path $Root 'app'

if (-not (Test-Path $nodePath)) {
    Show-Error "Dosya Bulunamadi" "node.exe bulunamadi!`nBeklenen konum: $nodePath`n`nCozum: node.exe dosyasini start.bat ile ayni klasore koyun."
    exit 1
}
if (-not (Test-Path $serverPath)) {
    Show-Error "Dosya Bulunamadi" "app\server.js bulunamadi!`nBeklenen konum: $serverPath`n`nCozum: Uygulamayi yeniden paketleyin."
    exit 1
}

# =========================================================
#  Node.exe'yi GIZLI baslatma
# =========================================================
Write-Log "Node.exe baslatiliyor (Port: $Port)..."

try {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName               = $nodePath
    $psi.Arguments              = 'server.js'
    $psi.WorkingDirectory       = $appDir
    $psi.UseShellExecute        = $false
    $psi.CreateNoWindow         = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError  = $true
    $psi.EnvironmentVariables['NODE_ENV']   = 'production'
    $psi.EnvironmentVariables['HOSTNAME']   = 'localhost'
    $psi.EnvironmentVariables['PORT']       = "$Port"
    $psi.EnvironmentVariables['JWT_SECRET'] = 'tav-egitim-paneli-local-jwt-secret-2024-secure-key'

    $nodeProc = [System.Diagnostics.Process]::Start($psi)
    $nodePid  = $nodeProc.Id
    Write-Log "Node.exe PID: $nodePid"
} catch {
    $errMsg = $_.Exception.Message

    # Antivirus engeli tespiti
    $avHint = ""
    if ($errMsg -match "access.*denied|erisim.*reddedildi|blocked|virus|quarantine") {
        $avHint = "`n`n*** ANTIVIRUS ENGELI TESPIT EDILDI ***`nnode.exe dosyasi antivirus/guvenlik yazilimi tarafindan engellenmis olabilir.`nCozum: IT departmaninizdan node.exe icin istisna (exception) tanimlanmasini isteyin."
    }

    Show-Error "Node.exe Baslatilamadi" "Node.exe calistirilirken hata olustu:`n$errMsg$avHint`n`nOlasi sebepler:`n- Antivirus/EDR yazilimi engeli`n- node.exe dosyasi bozuk`n- Yeterli bellek yok`n- Dosya izinleri yetersiz"
    exit 1
}

# =========================================================
#  Node.exe aninda crash oldu mu kontrol et
# =========================================================
Start-Sleep -Milliseconds 1500

if ($nodeProc.HasExited) {
    $exitCode = $nodeProc.ExitCode
    $stderr = ""
    $stdout = ""
    try {
        $stderr = $nodeProc.StandardError.ReadToEnd()
        $stdout = $nodeProc.StandardOutput.ReadToEnd()
    } catch {}

    $detail = "Exit code: $exitCode"
    if ($stderr) { $detail += "`n`nHata ciktisi:`n$stderr" }
    if ($stdout) { $detail += "`n`nCikti:`n$stdout" }

    try { Add-Content -Path $errorLogPath -Value "--- Node.exe STDOUT ---`n$stdout`n--- Node.exe STDERR ---`n$stderr" -ErrorAction SilentlyContinue } catch {}

    Show-Error "Sunucu Aninda Kapandi" "Node.exe basladiktan hemen sonra kapandi.`n`n$detail`n`nOlasi sebepler:`n- Port $Port baska bir uygulama tarafindan kullaniliyor`n- server.js dosyasi bozuk`n- .env dosyasi eksik veya hatali`n- local.db veritabani bozuk"
    exit 1
}

# =========================================================
#  Sunucunun hazir olmasini bekle (max 30 sn)
# =========================================================
Write-Log "Sunucu hazir olana kadar bekleniyor (max 30 sn)..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1

    # Her dongude node hala calisiyor mu kontrol et
    if ($nodeProc.HasExited) {
        $exitCode = $nodeProc.ExitCode
        $stderr = ""
        try { $stderr = $nodeProc.StandardError.ReadToEnd() } catch {}
        $detail = "Exit code: $exitCode"
        if ($stderr) { $detail += "`nHata: $stderr" }
        try { Add-Content -Path $errorLogPath -Value "--- Node.exe bekleme sirasinda kapandi ---`n$detail" -ErrorAction SilentlyContinue } catch {}

        Show-Error "Sunucu Beklenmedik Kapandi" "Node.exe baslatmadan $($i+1) saniye sonra kapandi.`n`n$detail`n`nOlasi sebepler:`n- Veritabani baglanti hatasi`n- Port catismasi`n- Bellek yetersizligi"
        exit 1
    }

    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:$Port/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            $ready = $true
            Write-Log "Sunucu hazir! ($($i+1) saniyede)"
            break
        }
    } catch {
        # Henuz hazir degil, bekle
    }
}

if (-not $ready) {
    $nodeStillRunning = -not $nodeProc.HasExited
    $detail = "Sunucu 30 saniye icerisinde http://localhost:$Port/api/health adresinden yanit vermedi."
    if ($nodeStillRunning) {
        $detail += "`n`nNode.exe calisiyor (PID: $nodePid) ama sunucu yanit vermiyor."
        $detail += "`n`nOlasi sebepler:`n- Guvenlik duvari localhost:$Port portunu engelliyor`n- Sunucu baslatmasi cok uzun suruyor`n- server.js icinde bir hata var"
        $detail += "`n`nCozum: IT departmaninizdan localhost:$Port icin`nguvenlik duvari istisnasi tanimlanmasini isteyin."
        Stop-Process -Id $nodePid -Force -ErrorAction SilentlyContinue
    } else {
        $exitCode = $nodeProc.ExitCode
        $detail += "`n`nNode.exe kapanmis (exit code: $exitCode)"
    }
    Show-Error "Sunucu Baslayamadi" $detail
    exit 1
}

# =========================================================
#  Tarayici bul (Edge veya Chrome)
# =========================================================
$browserPaths = @(
    (Join-Path $env:ProgramFiles       'Microsoft\Edge\Application\msedge.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'),
    (Join-Path $env:ProgramFiles       'Google\Chrome\Application\chrome.exe'),
    (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe')
)
$browser = $browserPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $browser) {
    Write-Log "Edge/Chrome bulunamadi, varsayilan tarayici aciliyor..." "UYARI"
    try {
        Start-Process "http://localhost:$Port"
    } catch {
        Show-Error "Tarayici Acilamadi" "Hicbir tarayici bulunamadi veya acilamadi.`n`nManuel olarak su adresi acin:`nhttp://localhost:$Port`n`nSunucu arka planda calismaya devam ediyor."
    }
    Write-Log "Tarayici izlenemiyor, heartbeat sistemi devrede."
    exit 0
}

# =========================================================
#  Tarayici profil dizini (TEMP erisilemezse app dizinine yaz)
# =========================================================
$profileDir = Join-Path $env:TEMP 'tav-egitim-browser'
try {
    if (-not (Test-Path $profileDir)) {
        New-Item -Path $profileDir -ItemType Directory -Force -ErrorAction Stop | Out-Null
    }
    # Yazma testi
    $testFile = Join-Path $profileDir '.write-test'
    Set-Content -Path $testFile -Value 'test' -ErrorAction Stop
    Remove-Item -Path $testFile -ErrorAction SilentlyContinue
} catch {
    Write-Log "TEMP dizinine yazilamiyor, app dizini kullaniliyor." "UYARI"
    $profileDir = Join-Path $Root 'app\browser-profile'
    if (-not (Test-Path $profileDir)) {
        New-Item -Path $profileDir -ItemType Directory -Force -ErrorAction SilentlyContinue | Out-Null
    }
}

# =========================================================
#  Tarayiciyi uygulama (app) modunda, ayri profilde ac
# =========================================================
$exeName    = [IO.Path]::GetFileNameWithoutExtension($browser)
$url        = "http://localhost:$Port"

Write-Log "Tarayici aciliyor: $url ($exeName app mode)"
try {
    Start-Process $browser -ArgumentList @("--user-data-dir=$profileDir", "--app=$url")
} catch {
    # App mode basarisiz olduysa normal tarayici ile dene
    Write-Log "App mode ile acilamadi, normal modda deneniyor..." "UYARI"
    try {
        Start-Process $browser -ArgumentList @($url)
    } catch {
        try {
            Start-Process $url
        } catch {
            Show-Error "Tarayici Acilamadi" "Tarayici baslatilamadi: $browser`nHata: $($_.Exception.Message)`n`nManuel olarak su adresi acin:`nhttp://localhost:$Port"
        }
    }
    Write-Log "Tarayici normal modda acildi, process izleme devre disi." "UYARI"
    Write-Log "Heartbeat sistemi devrede."
    exit 0
}

# Tarayicinin acilmasini bekle
Start-Sleep -Seconds 4

# =========================================================
#  Tarayici kapanana kadar izle
#  Get-CimInstance (modern) veya Get-WmiObject (legacy) kullanir
# =========================================================
Write-Log "Tarayici izleniyor. Kapaninca uygulama otomatik durur."
$watchErrors = 0
while ($true) {
    try {
        $procs = Get-ProcessByName "Name='$exeName.exe' AND CommandLine LIKE '%tav-egitim-browser%'"
        if (-not $procs) { break }
        $watchErrors = 0
    } catch {
        $watchErrors++
        Write-Log "Tarayici izleme hatasi ($watchErrors/5): $($_.Exception.Message)" "UYARI"
        if ($watchErrors -ge 5) {
            Write-Log "Tarayici izleme 5 kez basarisiz oldu, heartbeat'e guveniliyor." "UYARI"
            exit 0
        }
    }

    # Node hala calisiyor mu kontrol et (beklenmedik crash)
    if ($nodeProc.HasExited) {
        $exitCode = $nodeProc.ExitCode
        Write-Log "Node.exe beklenmedik sekilde kapandi! Exit code: $exitCode" "HATA"
        Show-Error "Sunucu Beklenmedik Kapandi" "Sunucu calisiyor olmasi gerekirken kapandi.`nExit code: $exitCode`n`nUygulamayi yeniden baslatmak icin start.bat'a cift tiklayin."
        # Tarayiciyi da kapat
        try {
            $procs = Get-ProcessByName "Name='$exeName.exe' AND CommandLine LIKE '%tav-egitim-browser%'"
            $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        } catch {}
        exit 1
    }

    Start-Sleep -Seconds 2
}

# =========================================================
#  Tarayici kapandi — node'u durdur
# =========================================================
Write-Log "Tarayici kapandi. Sunucu durduruluyor..."

try {
    if (-not $nodeProc.HasExited) {
        Stop-Process -Id $nodePid -Force -ErrorAction SilentlyContinue
        Write-Log "Node.exe (PID: $nodePid) durduruldu."
    } else {
        Write-Log "Node.exe zaten kapanmis."
    }
} catch {
    Write-Log "Node.exe durdurulurken hata: $($_.Exception.Message)" "UYARI"
}

# Kalan server.js calistiran node'lari da temizle
try {
    Get-ProcessByName "Name='node.exe' AND CommandLine LIKE '%server.js%'" |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
} catch {}

Write-Log "Kapatildi. Gorusuruz!"
exit 0
