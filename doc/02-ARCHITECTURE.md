# 02-ARCHITECTURE.md
# Eğitim Takip Sistemi – Sistem Mimarisi

Bu doküman, sistemin teknik mimarisini ve veri akışlarını tanımlar.  
Frontend, Backend, Veritabanı ve Roller arasındaki ilişkiyi netleştirir.

Amaç: AI kodlama araçlarının **ne nerede yapılacak** sorusunu düşünmeden doğrudan uygulayabilmesini sağlamak.

---

## 1) Genel Mimari

Sistem 3 ana katmandan oluşur:

[ Frontend (Web UI) ]
|
v
[ Backend (API / Business Logic) ]
|
v
[ Veritabanı (PostgreSQL / MySQL) ]

---

## 2) Roller ve Erişim Katmanları

### ŞEF
- Sadece **veri giriş ekranlarına** erişir
- Katılım kaydı oluşturur
- Kendi girdiği kayıtları görür

### ADMIN
- Eğitim kataloğu yönetir
- Personel yönetir
- Aylık ve yıllık raporları görür
- Genel toplamları izler

Rol kontrolü backend seviyesinde yapılır.

---

## 3) Frontend Mimarisi

Frontend modüler yapıda tasarlanır.

### Ana Modüller

#### a) Auth Modülü
- Login ekranı
- Rol bazlı yönlendirme
  - Şef → /chef
  - Admin → /admin

#### b) Şef Paneli
- Personel arama (sicil no)
- Eğitim seçimi
- Alt başlık seçimi (varsa)
- İç/Dış eğitim seçimi
- Eğitim yeri seçimi
- Tarih + saat girişleri
- Kaydet butonu

#### c) Admin Paneli
- Eğitim Kataloğu Yönetimi
- Personel Yönetimi (import + manuel)
- Aylık Genel Tablo
- Yıllık Genel Pivot Tablo
- Detay Liste

---

## 4) Backend Mimarisi

Backend katmanı 3 ana sorumluluğa sahiptir:

### 1. Auth & Role Control
- Kullanıcı doğrulama
- Rol bazlı yetkilendirme
- Endpoint koruması

### 2. Business Logic
- Katılım kayıt kuralları:
  - Aynı personel aynı eğitimi aynı yıl içinde 1 kez alabilir
- Ay & yıl otomatik hesaplama
- Eğitim süresi snapshot alma
- Toplam dakika hesapları

### 3. Data Access Layer
- DB CRUD işlemleri
- Pivot sorgular
- Aylık filtre sorguları

---

## 5) Veritabanı Katmanı

Veritabanı **tek gerçek kaynaktır (single source of truth)**.

Ana tablolar:
- personnel
- trainings
- training_topics
- attendances
- users

Tüm raporlar:
üzerinden üretilir.

---

## 6) Veri Akışları

### A) Şef Katılım Girişi Akışı

Şef UI
|
v
POST /api/attendances
|
v
Backend:

personel kontrol

eğitim kontrol

unique(year, personel, eğitim) kontrolü

süre snapshot al

ay/yıl hesapla
|
v
attendances tablosuna insert

---

### B) Aylık Genel Tablo Akışı

Admin UI
|
v
GET /api/reports/monthly?year=2026&month=5
|
v
Backend:

attendances WHERE year=Y AND month=M

join personnel + trainings
|
v
Liste + toplam dakika hesap


---

### C) Yıllık Pivot Tablo Akışı



Admin UI
|
v
GET /api/reports/yearly-pivot?year=2026
|
v
Backend:

attendances GROUP BY training_id, month

COUNT(*) hücre hesap

SUM -> satır toplam

satır_toplam x egitim_suresi_dk -> toplam dakika
|
v
Pivot JSON -> Frontend tablo render


---

## 7) Hesaplama Katmanı

Tüm hesaplamalar backend’de yapılır.

Frontend:
- Sadece render eder
- Sadece filtre gönderir
- Hesap yapmaz

Hesaplananlar:
- Aylık katılım sayısı
- Aylık toplam dakika
- Yıllık satır toplamları
- Yıllık genel toplam

---

## 8) Cache & Performans (Opsiyonel)

Yıllık pivot ağır olabilir.

Opsiyonel:
- Yearly pivot sonuçları cache’lenebilir (Redis / Memory)
- Cache key: year + proje + grup

---

## 9) Hata Yönetimi

Tüm backend hataları standart formatta döner:



{
success: false,
error_code: "...",
message: "..."
}


Frontend bu hataları toast/modal ile gösterir.

---

## 10) Genişletilebilirlik

Bu mimari:
- Çoklu havalimanı
- Çoklu proje
- Yeni eğitim türleri
- Yeni rapor ekranları

eklenmeye uygundur.

---

## 11) Mimari Prensipler

- **Atama yok**
- **Tek kaynak attendances**
- **Hesap backend’de**
- **UI sade, iş backend’de**
- **Kurallar DB + Backend seviyesinde**

Bu doküman, geliştirilecek tüm modüller için bağlayıcıdır.