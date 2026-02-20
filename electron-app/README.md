# TAV Eğitim Sistemi - Electron Masaüstü Uygulaması

Bu klasör, Next.js projesini Electron ile masaüstü uygulamasına dönüştürmek için gerekli dosyaları içerir.

## Kurulum

1. Electron bağımlılıklarını yükleyin:
```bash
cd electron-app
npm install
```

## Geliştirme

Geliştirme modunda çalıştırmak için:

```bash
# Ana projeyi başlatın (ayrı terminal)
cd ..
npm run dev

# Electron uygulamasını başlatın
cd electron-app
npm run dev
```

## Build (İmzasız)

İmzalanmamış .exe oluşturmak için:

```bash
cd electron-app
npm run build:win:unsigned
```

Bu komut:
1. Next.js projesini build eder
2. Electron uygulamasını paketler
3. `../dist` klasörüne .exe dosyalarını oluşturur

## Build (İmzalı)

İmzalı .exe oluşturmak için:

### 1. Sertifika Hazırlığı

- Code Signing Certificate'ı `electron-app/assets/certificate.pfx` olarak kaydedin
- Sertifika şifresini ortam değişkeni olarak ayarlayın:

**Windows (CMD):**
```cmd
set CERT_PASSWORD=your-certificate-password
```

**Windows (PowerShell):**
```powershell
$env:CERT_PASSWORD="your-certificate-password"
```

**Linux/Mac:**
```bash
export CERT_PASSWORD=your-certificate-password
```

### 2. Build Komutu

```bash
cd electron-app
npm run build:win
```

## Çıktı Dosyaları

Build işlemi tamamlandığında `../dist` klasöründe şu dosyalar oluşur:

- `TAV Eğitim Sistemi-1.0.0-x64.exe` - NSIS installer (kurulum programı)
- `TAV Eğitim Sistemi-Portable-1.0.0.exe` - Portable versiyon (kurulum gerektirmez)

## Sertifika Alımı

Code Signing Certificate almak için:

1. **DigiCert** - https://www.digicert.com/code-signing
2. **Sectigo** - https://sectigo.com/ssl-certificates-tls/code-signing
3. **GlobalSign** - https://www.globalsign.com/en/code-signing-certificate

**Önerilen:** EV (Extended Validation) Code Signing Certificate - Daha güvenilir ve Smart Screen uyarısını azaltır.

## İmzalama Kontrolü

Oluşturulan .exe dosyasının imzalı olup olmadığını kontrol etmek için:

**Windows PowerShell:**
```powershell
Get-AuthenticodeSignature "dist\TAV Eğitim Sistemi-1.0.0-x64.exe"
```

**Komut Satırı:**
```cmd
signtool verify /pa "dist\TAV Eğitim Sistemi-1.0.0-x64.exe"
```

## Sorun Giderme

### Build Hatası: "Cannot find module"
```bash
cd electron-app
rm -rf node_modules package-lock.json
npm install
```

### İmzalama Hatası: "The specified password is incorrect"
Sertifika şifresini doğru ayarladığınızdan emin olun:
```cmd
echo %CERT_PASSWORD%
```

### Smart Screen Uyarısı
İmzalı .exe dosyaları ilk çalıştırmada Smart Screen uyarısı verebilir. Bu normaldir:
- Kullanıcılar "Daha fazla bilgi" → "Yine de çalıştır" diyebilir
- Uygulama yaygınlaştıkça uyarı azalır
- EV sertifikası bu uyarıyı azaltır

## Yapılandırma

`package.json` dosyasında şu ayarları değiştirebilirsiniz:

- `productName` - Uygulama adı
- `appId` - Uygulama ID'si
- `version` - Versiyon numarası
- `build.win.target` - Build hedefleri (nsis, portable)
- `build.nsis` - NSIS installer ayarları

## Güvenlik

Bu Electron uygulaması şu güvenlik önlemlerini içerir:

- ✅ `nodeIntegration: false` - Renderer process'te Node.js erişimi kapalı
- ✅ `contextIsolation: true` - Context isolation aktif
- ✅ `enableRemoteModule: false` - Remote module kapalı
- ✅ Preload script ile güvenli API erişimi
- ✅ External link güvenliği

## Lisans

MIT License
