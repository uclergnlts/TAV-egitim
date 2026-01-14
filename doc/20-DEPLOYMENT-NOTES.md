# Eğitim Takip Sistemi – Deployment & Yayına Alma Notları (FINAL)

Bu doküman, projenin **geliştirmeden canlı ortama** nasıl taşınacağını,
hangi ortamlarda nasıl konfigüre edileceğini ve release sürecini tanımlar.

> Bu doküman bağlayıcıdır.  
> “Sonra bakarız” yaklaşımı kabul edilmez.

---

## 1) Ortamlar (Environments)

Sistemde 3 ortam vardır:

1. **DEV** – Geliştirme
2. **STAGING** – Test / Ön Prod
3. **PROD** – Canlı

Her ortamın:
- Ayrı DB’si
- Ayrı env dosyası
- Ayrı domain’i olmalıdır

---

## 2) Önerilen Stack

### Frontend
- Next.js (Vercel önerilir)

### Backend
- Node.js (API Routes / Express / Nest fark etmez)

### Database
- PostgreSQL (önerilen)
- MySQL (alternatif)

### Cache
- Redis (opsiyonel ama önerilir)

---

## 3) Environment Variables

Her ortamda şu değişkenler **zorunludur:**

DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD

JWT_SECRET

REDIS_URL (opsiyonel)

APP_ENV=dev|staging|prod

yaml
Kodu kopyala

> Bu değerler **repo’ya asla yazılmaz.**

---

## 4) Build Süreci

### Frontend (Next.js)

npm install
npm run build
npm run start

yaml
Kodu kopyala

Vercel kullanılıyorsa:
- build command: `npm run build`
- output: `.next`

---

### Backend

npm install
npm run build
npm run start

nginx
Kodu kopyala

veya
docker build
docker run

yaml
Kodu kopyala

---

## 5) Database Migration

Migration **zorunludur.**

Önerilen:
- Prisma
- TypeORM
- Knex

Kurallar:
1. Migration dosyası olmadan prod’a çıkılmaz
2. Manuel SQL prod’da çalıştırılmaz

---

## 6) İlk Kurulum Akışı (Prod)

1. DB oluştur
2. Migration çalıştır
3. Admin kullanıcı ekle (seed)
4. Eğitim kataloglarını ekle
5. Personel listesini import et
6. Sistem test
7. Canlıya aç

---

## 7) Domain & SSL

- HTTPS zorunlu
- Let’s Encrypt veya Cloudflare SSL
- HTTP → HTTPS redirect zorunlu

---

## 8) Logging & Monitoring

Zorunlu:

- API logları
- Error logları
- Import logları

Önerilen araçlar:
- Sentry
- LogRocket
- Grafana + Prometheus

---

## 9) Backup Politikası

DB için:

- Günlük otomatik backup
- En az 7 gün saklama
- Prod dışına kopya

> Backup yoksa sistem **yok hükmündedir.**

---

## 10) Rollback Stratejisi

Her deploy sonrası:

- Bir önceki versiyon **geri alınabilir** olmalı
- Vercel → otomatik
- Docker → önceki image

Rollback süresi:
> **< 5 dakika hedef**

---

## 11) Release Kuralları

1. Direkt prod’a push YASAK
2. Önce staging
3. Test
4. Onay
5. Prod

---

## 12) Yasaklar

Aşağıdakiler **kesinlikle yasaktır:**

- Prod DB üzerinde manuel update
- Prod’da debug mod
- .env dosyasını git’e atmak
- Tek ortamla çalışmak
- Backup almadan deploy

---

## 13) Güvenlik Notları

- JWT secret güçlü olmalı
- Admin panel IP restriction (opsiyonel ama önerilir)
- Rate limit aktif olmalı
- Brute force koruması olmalı

---

## 14) Performans Sonrası Kontrol Listesi

Deploy sonrası kontrol:

- [ ] Login çalışıyor mu
- [ ] Katılım eklenebiliyor mu
- [ ] Aylık tablo açılıyor mu
- [ ] Yıllık pivot hızlı mı
- [ ] Import çalışıyor mu
- [ ] Audit log yazılıyor mu

Hepsi OK olmadan:
> **“Canlıya aldık” denmez.**

---

## 15) Bağlayıcılık

Bu doküman:
- 19-PERFORMANCE-NOTES.md
- 17-ERROR-HANDLING.md
- 18-AUDIT-LOGIC.md
- 13-API-SPEC.md

ile %100 uyumlu olmak zorundadır.

Çelişki olursa:
> **20-DEPLOYMENT-NOTES.md kazanır.**