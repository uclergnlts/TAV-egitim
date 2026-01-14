# Eğitim Takip Sistemi – Validasyon Kuralları (FINAL)

Bu doküman, sistemdeki tüm **form girişleri, API istekleri ve import işlemleri** için geçerli olan
validasyon (doğrulama) kurallarını tanımlar.

> Bu kurallar bağlayıcıdır.  
> UI, Backend ve Import bu kurallara %100 uymak zorundadır.

---

## 1) Genel Prensipler

1. Validasyon **önce frontend**, **esas olarak backend** tarafında yapılır.
2. Frontend sadece kullanıcı deneyimi içindir, **asıl güvenlik backend’dedir.**
3. Hatalı veri:
   - DB’ye **ASLA yazılmaz**
   - Açık ve net hata mesajı döner
4. Import sırasında da **aynı kurallar geçerlidir.**

---

## 2) Ortak Alan Validasyonları

### sicil_no
- Boş olamaz
- String
- Maks 50 karakter

---

### ad_soyad
- Boş olamaz
- String
- Maks 150 karakter

---

### tc_kimlik_no
- Boş olamaz
- 11 haneli
- Sadece rakam

---

### gorevi
- Boş olamaz
- String
- Maks 150 karakter

---

### proje_adi
- Boş olamaz
- String
- Maks 100 karakter

---

### grup
- Boş olamaz
- String
- Maks 20 karakter

---

## 3) Eğitim Alanı Validasyonları

### egitim_kodu
- Boş olamaz
- trainings tablosunda **var olmalı**
- Case-insensitive eşleşme yapılabilir

---

### egitim_alt_basligi
- Eğer eğitim alt başlık içeriyorsa:
  - Boş olamaz
  - training_topics içinde olmalı
- Eğitimde alt başlık yoksa:
  - NULL olabilir

---

### egitim_suresi_dk
- Integer
- 0’dan büyük olmalı
- trainings tablosundan snapshot alınır
- Manuel girilemez

---

## 4) Tarih & Saat Validasyonları

### baslama_tarihi
- Boş olamaz
- YYYY-MM-DD formatında olmalı

---

### bitis_tarihi
- Boş olamaz
- YYYY-MM-DD formatında olmalı
- baslama_tarihi >= bitis_tarihi olamaz (aynı gün olabilir)

---

### baslama_saati
- Boş olamaz
- HH:MM formatında olmalı

---

### bitis_saati
- Boş olamaz
- HH:MM formatında olmalı
- baslama_saati >= bitis_saati olamaz

---

## 5) Enum Alan Validasyonları

### egitim_yeri
Sadece:
- CIHAZ_BASINDA
- EGITIM_KURUMUNDA
- DIGER

---

### ic_dis_egitim
Sadece:
- IC
- DIS

---

### sonuc_belgesi_turu
Sadece:
- EGITIM_KATILIM_CIZELGESI
- SERTIFIKA

---

### personel_durumu
Sadece:
- CALISAN
- AYRILDI
- IZINLI
- PASIF

---

## 6) Katılım (Attendance) İş Kuralı Validasyonları

Bu kurallar **kritiktir ve asla bypass edilemez.**

---

### 6.1 Aynı Yıl Aynı Eğitim Kontrolü

IF exists(attendance WHERE personel_id = X AND training_id = Y AND year = Z)
THEN hata: "Bu personel bu eğitimi bu yıl zaten almış."

yaml
Kodu kopyala

---

### 6.2 Personel Var mı?

IF personnel not found
THEN hata: "Personel bulunamadı."

yaml
Kodu kopyala

---

### 6.3 Eğitim Var mı?

IF training not found
THEN hata: "Eğitim bulunamadı."

yaml
Kodu kopyala

---

### 6.4 Yıl & Ay Otomatik

year = YEAR(baslama_tarihi)
month = MONTH(baslama_tarihi)

yaml
Kodu kopyala

- Manuel set edilirse → HATA

---

## 7) Import Validasyonları (Özet)

Import sırasında:

1. Zorunlu kolon yoksa → tüm import RED
2. Satır bazlı hata varsa → sadece o satır RED
3. Hatalı satır:
   - import_errors tablosuna yazılır
   - DB’ye yazılmaz

---

## 8) Frontend Validasyonları (UX Odaklı)

Frontend tarafında:

- Boş alan uyarısı
- Format uyarısı (tarih, saat)
- Enum dropdown zorunluluğu
- Anlık hata mesajı

Ama:
> **Frontend validasyonu güvenlik değildir.**
> Asıl güven backend’dedir.

---

## 9) Hata Mesajı Standartları

Hata mesajları:

- Kısa
- Net
- Kullanıcıyı yönlendiren

Örnekler:

- "Zorunlu alan eksik: baslama_tarihi"
- "Bu personel bu eğitimi bu yıl zaten almış."
- "Geçersiz egitim_yeri değeri"
- "Personel bulunamadı"

---

## 10) Yasaklar

Aşağıdakiler **kesinlikle yasaktır:**

- Hatalı veriyi “idare eder” diye kaydetmek
- Duplicate kaydı zorla yazmak
- Import sırasında validasyonu atlamak
- UI’da gizleyip backend’de kontrol etmemek

---

## 11) Bağlayıcılık

Bu doküman:
- 06-DETAIL-TABLE-FINAL.md
- 11-DB-SCHEMA.md
- 13-API-SPEC.md
- 14-IMPORT-SPEC.md

ile %100 uyumlu olmak zorundadır.

Çelişki olursa:
> **15-VALIDATION-RULES.md kazanır.**