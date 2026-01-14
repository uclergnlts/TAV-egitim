# 03-UI-FLOWS.md
# Eğitim Takip Sistemi – UI Akışları

Bu doküman, Şef ve Admin kullanıcılarının sistem içinde **hangi ekranlardan geçtiğini, hangi sırayla ne yaptığını** tanımlar.

Amaç:  
AI ve geliştirici tarafın **ekranları kafasına göre değil, bu akışa göre** üretmesini sağlamak.

---

## 1) Giriş Akışı (Login Flow)

### Ekran: /login

Alanlar:
- Sicil No
- Şifre (veya OTP – sistem tercihine göre)

Buton:
- Giriş Yap

Akış:
Kullanıcı → Sicil No + Şifre → Giriş Yap
|
v
Backend auth kontrol
|
v
Rol kontrol:

ŞEF → /chef

ADMIN → /admin

markdown
Kodu kopyala

---

## 2) ŞEF Paneli – Ana Akış

Şefin tek amacı vardır: **katılım kaydı girmek.**  
Başka karmaşık ekran yoktur.

### Ekran: /chef

Bu ekran tek sayfa olabilir (form odaklı).

---

### 2.1 Şef Katılım Giriş Formu Akışı

Alan sırası ve akış **bilinçli olarak bu şekilde olmalıdır**:

1. **Sicil No** (input)
   - Girince otomatik personel bilgisi gelir:
     - Ad Soyad (readonly)
     - Görevi (readonly)
     - Proje Adı (readonly)
     - Grup (readonly)
     - Personel Durumu (readonly)

2. **Eğitim Kodu** (dropdown / autocomplete)
   - Seçilince:
     - Eğitim Adı gösterilir (readonly)
     - Eğitim Süresi (readonly)
     - Alt başlık varsa → alt başlık alanı aktif olur

3. **Eğitim Alt Başlığı** (opsiyonel, sadece varsa görünür)

4. **İç / Dış Eğitim** (radio veya select)
   - İç
   - Dış

5. **Eğitim Yeri** (select)
   - Cihaz Başında
   - Eğitim Kurumunda
   - Diğer

6. **Eğitim Başlama Tarihi** (date)
7. **Eğitim Bitiş Tarihi** (date)
8. **Eğitim Başlama Saati** (time)
9. **Eğitim Bitiş Saati** (time)

10. **Sonuç Belgesi Türü** (select)
    - Eğitim Katılım Çizelgesi
    - Sertifika

11. **Eğitim Detaylı Açıklama** (textarea – opsiyonel)

12. **Kaydet** (button)

---

### 2.2 Şef Form Validasyon Akışı

Kaydet butonuna basıldığında:

Frontend:

Boş alan var mı?

Tarih/saat formatı doğru mu?
|
v
Backend:

Personel var mı?

Eğitim var mı?

Aynı yıl aynı eğitim daha önce alınmış mı? (unique kontrol)

Eğitim süresi snapshot alınır

Ay / yıl hesaplanır
|
v
Başarılı → "Kayıt eklendi" mesajı
Hata → Hata mesajı göster

yaml
Kodu kopyala

---

### 2.3 Şef Kendi Kayıtlarını Görme (Opsiyonel ama önerilir)

Ekran: /chef/history

Şef sadece **kendi girdiği kayıtları** görür.

Filtreler:
- Tarih aralığı
- Eğitim kodu
- Sicil no

Kolonlar:
- Sicil No
- Ad Soyad
- Eğitim Kodu
- Eğitim Tarihi
- Veri Giriş Tarihi

---

## 3) ADMIN Paneli – Ana Akış

Admin paneli **rapor + yönetim merkezidir**.

Ekran: /admin

---

### 3.1 Admin Dashboard (Özet)

Ekran: /admin/dashboard

Kartlar:
- Bu ay toplam katılım
- Bu ay toplam dakika
- Bu yıl toplam katılım
- Bu yıl toplam dakika

Altında:
- Yıllık genel pivot tabloya geçiş linki
- Aylık genel tabloya geçiş linki

---

### 3.2 Eğitim Kataloğu Yönetimi

Ekran: /admin/trainings

Liste:
- Eğitim Kodu
- Eğitim Adı
- Süre (dk)
- Aktif/Pasif

Aksiyonlar:
- Yeni eğitim ekle
- Düzenle
- Pasif yap

Alt ekran:
- Alt başlık yönetimi

---

### 3.3 Personel Yönetimi

Ekran: /admin/personnel

Liste:
- Sicil No
- Ad Soyad
- Görevi
- Proje Adı
- Grup
- Durum

Aksiyonlar:
- Yeni personel ekle
- Excel/CSV import
- Düzenle
- Pasif yap

---

### 3.4 Aylık Genel Tablo

Ekran: /admin/reports/monthly

Filtreler:
- Yıl (select)
- Ay (select)
- Proje Adı (optional)
- Grup (optional)

Tablo:
- 07-MONTHLY-GENERAL-TABLE.md’ye birebir uygun

Altında:
- Toplam katılım
- Toplam dakika

---

### 3.5 Yıllık Genel Pivot Tablo

Ekran: /admin/reports/yearly

Filtre:
- Yıl (select)
- Proje Adı (optional)
- Grup (optional)

Tablo:
- 09-YEARLY-PIVOT-WIDE-FINAL.md’ye birebir uygun

Altında:
- Ayların toplamı
- Genel toplam dakika

---

### 3.6 Detay Liste

Ekran: /admin/details

Filtreler:
- Yıl
- Ay
- Sicil No
- Eğitim Kodu
- Proje Adı
- Grup

Tablo:
- 06-DETAIL-TABLE-FINAL.md’ye birebir uygun kolonlar

Aksiyon:
- Excel export

---

## 4) Ortak UI Kuralları

- Formlar sade, tek kolon, mobil uyumlu
- Şef ekranı: hızlı veri girişi odaklı
- Admin ekranı: tablo + filtre odaklı
- Hiçbir yerde atama/planlama ekranı yok
- Hiçbir yerde vardiya/terminal/bölge alanı yok

---

## 5) Navigasyon Haritası

/login
|
+--> /chef
| |
| +--> /chef/history
|
+--> /admin
|
+--> /admin/dashboard
+--> /admin/trainings
+--> /admin/personnel
+--> /admin/reports/monthly
+--> /admin/reports/yearly
+--> /admin/details

yaml
Kodu kopyala

---

## 6) UI Felsefesi

- Şef ekranı = hız
- Admin ekranı = kontrol
- Karmaşa yok
- Excel mantığı birebir korunur
- Fazlalık alan yok