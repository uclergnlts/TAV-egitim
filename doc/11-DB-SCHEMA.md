# 11-DB-SCHEMA.md
# Eğitim Takip Sistemi – Veritabanı Şeması (FINAL)

Bu doküman, sistemin **gerçek veritabanı yapısını** tanımlar.  
Tüm tablolar, alanlar, ilişkiler ve kısıtlar burada netleştirilmiştir.

> Bu doküman, DB için **tek doğru referanstır**.  
> Çelişki durumunda bu doküman kazanır.

---

# 1) users
Sisteme giriş yapan kullanıcılar (Şef ve Admin)

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | UUID (PK) | Benzersiz ID |
| sicil_no | varchar | Kullanıcı sicil numarası (unique) |
| full_name | varchar | Ad Soyad |
| role | enum | CHEF / ADMIN |
| password_hash | varchar | Şifre (veya SSO token) |
| is_active | boolean | Aktif / Pasif |
| created_at | timestamp | Oluşturulma |
| updated_at | timestamp | Güncellenme |

---

# 2) personnel
Eğitim alan personel listesi

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | UUID (PK) | Benzersiz ID |
| sicil_no | varchar | Sicil numarası (unique) |
| full_name | varchar | Ad Soyad |
| tc_kimlik_no | varchar | TC Kimlik |
| gorevi | varchar | Görevi |
| proje_adi | varchar | Proje (örn: TAV ESB) |
| grup | varchar | A/B/C/D vb |
| personel_durumu | enum | CALISAN / AYRILDI / IZINLI / PASIF |
| created_at | timestamp | Oluşturulma |
| updated_at | timestamp | Güncellenme |

Index:
- unique(sicil_no)

---

# 3) trainings
Eğitim kataloğu

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | UUID (PK) | Benzersiz ID |
| code | varchar | Eğitim kodu (unique) |
| name | varchar | Eğitim adı |
| description | text | Açıklama |
| duration_min | int | Süre (dakika) |
| category | enum | TEMEL / TAZELEME / DIGER |
| is_active | boolean | Aktif / Pasif |
| created_at | timestamp | Oluşturulma |
| updated_at | timestamp | Güncellenme |

Index:
- unique(code)

---

# 4) training_topics
Eğitim alt başlıkları

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | UUID (PK) | Benzersiz ID |
| training_id | UUID (FK) | trainings.id |
| title | varchar | Alt başlık adı |
| order_no | int | Sıra (opsiyonel) |
| is_active | boolean | Aktif / Pasif |
| created_at | timestamp | Oluşturulma |

Constraint:
- unique(training_id, title)

---

# 5) attendances  ✅ ANA TABLO
Detay katılım kayıtları

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | UUID (PK) | Benzersiz ID |
| personel_id | UUID (FK) | personnel.id |
| training_id | UUID (FK) | trainings.id |
| training_topic_id | UUID (FK) | training_topics.id (nullable) |
| sicil_no | varchar | Snapshot |
| ad_soyad | varchar | Snapshot |
| tc_kimlik_no | varchar | Snapshot |
| gorevi | varchar | Snapshot |
| proje_adi | varchar | Snapshot |
| grup | varchar | Snapshot |
| personel_durumu | enum | Snapshot |
| egitim_kodu | varchar | Snapshot |
| egitim_alt_basligi | varchar | Snapshot |
| baslama_tarihi | date | Eğitim başlangıç |
| bitis_tarihi | date | Eğitim bitiş |
| baslama_saati | time | Başlangıç saati |
| bitis_saati | time | Bitiş saati |
| egitim_suresi_dk | int | Snapshot (değişmez) |
| egitim_yeri | enum | CIHAZ_BASINDA / EGITIM_KURUMUNDA / DIGER |
| ic_dis_egitim | enum | IC / DIS |
| sonuc_belgesi_turu | enum | EGITIM_KATILIM_CIZELGESI / SERTIFIKA |
| egitim_detayli_aciklama | text | Opsiyonel |
| veri_giren_sicil | varchar | Giriş yapan |
| veri_giren_ad_soyad | varchar | Giriş yapan |
| year | int | Otomatik |
| month | int | Otomatik |
| created_at | timestamp | Oluşturulma |
| updated_at | timestamp | Güncellenme |

---

# 6) imports (Opsiyonel)
Import işlemleri log tablosu

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | UUID (PK) | |
| file_name | varchar | Dosya adı |
| row_count | int | Toplam satır |
| success_count | int | Başarılı |
| fail_count | int | Hatalı |
| imported_by | UUID (FK) | users.id |
| created_at | timestamp | |

---

# 7) import_errors (Opsiyonel)
Hatalı import satırları

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | UUID (PK) | |
| import_id | UUID (FK) | imports.id |
| row_number | int | Excel satır no |
| error_message | text | Hata |
| raw_data | json | Ham satır |
| created_at | timestamp | |

---

# İLİŞKİLER

users 1 -------- n attendances
personnel 1 ---- n attendances
trainings 1 ---- n attendances
trainings 1 ---- n training_topics
training_topics 1 ---- n attendances (opsiyonel)

yaml
Kodu kopyala

---

# KRİTİK KISITLAR (ZORUNLU)

## 1) Unique Kural

unique(personel_id, training_id, year)

yaml
Kodu kopyala

> Aynı personel aynı eğitimi aynı yıl içinde 2 kez alamaz.

---

## 2) Ay & Yıl Otomatik

year = YEAR(baslama_tarihi)
month = MONTH(baslama_tarihi)

yaml
Kodu kopyala

Manuel set edilemez.

---

## 3) Süre Snapshot

egitim_suresi_dk = trainings.duration_min (kayıt anında)

yaml
Kodu kopyala

Sonradan trainings tablosu değişse bile attendances değişmez.

---

## 4) Olmayan Alanlar

Bu DB’de **bilinçli olarak olmayan** alanlar:

- vardiya_tipi
- terminal
- bolge_kodu
- planlanan_tarih
- hedef_sure

---

# INDEX ÖNERİLERİ

- idx_att_year_month (year, month)
- idx_att_training_year (training_id, year)
- idx_att_personel_year (personel_id, year)
- idx_att_sicil (sicil_no)

---

# RAPOR ÜRETİMİ REFERANSI

## Aylık Genel Tablo
SELECT * FROM attendances
WHERE year = :Y AND month = :M

shell
Kodu kopyala

## Yıllık Pivot
SELECT training_id, month, COUNT(*)
FROM attendances
WHERE year = :Y
GROUP BY training_id, month

yaml
Kodu kopyala

---

# BAĞLAYICILIK

Bu doküman:
- 06-DETAIL-TABLE-FINAL.md
- 07-MONTHLY-GENERAL-TABLE.md
- 08-YEARLY-PIVOT-TABLE.md
- 09-YEARLY-PIVOT-WIDE-FINAL.md

için **alt yapı referansıdır**.

DB tarafında yapılacak her değişiklik:
> **Bu dokümana göre yapılmak zorundadır.**