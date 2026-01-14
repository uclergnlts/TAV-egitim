# 01-DATA-MODEL.md
# Eğitim Takip Sistemi – Veri Modeli (Kavramsal)

Bu doküman, sistemdeki tüm ana varlıkları (entity) ve aralarındaki ilişkileri tanımlar.
Fiziksel DB şeması için referans: **11-DB-SCHEMA.md**

Bu doküman “ne var, ne yok”u netleştirir.

---

## 1) Personel

Eğitim alan havalimanı personelidir.  
Sistemde **sicil no** üzerinden tanımlanır.

### Alanlar (Kavramsal)
- Sicil No (unique)
- Ad Soyad
- TC Kimlik No
- Görevi
- Proje Adı (örn: TAV ESB)
- Grup (A/B/C/D vb)
- Personel Durumu
  - Çalışan
  - Ayrıldı
  - İzinli
  - Pasif

### Kurallar
- Sicil No sistemde tektir.
- Personel durumu raporlarda filtrelenebilir.

---

## 2) Eğitim (Training)

Yıllık zorunlu eğitim tanımlarıdır.  
Admin tarafından yönetilir.

### Alanlar (Kavramsal)
- Eğitim Kodu (örn: M4, M40, T1-T)
- Eğitim Adı
- Eğitim Açıklaması
- Eğitim Süresi (dakika)
- Eğitim Türü (İç / Dış – varsayılan)
- Kategori (opsiyonel)
  - Temel
  - Tazeleme
  - Diğer

### Kurallar
- Eğitim kodu tektir.
- Eğitim süresi dakika bazındadır.
- Eğitim pasif yapılabilir ama silinmez.

---

## 3) Eğitim Alt Başlığı (Training Topic)

Bazı eğitimlerin alt kırılımları vardır (örn: M4 = 6 alt başlık).

### Alanlar
- Eğitim
- Alt Başlık Adı
- Sıra No (opsiyonel)

### Kurallar
- Alt başlık, ilgili eğitime bağlıdır.
- Alt başlık yoksa NULL olabilir.
- Alt başlık seçimi zorunlu olabilir (app-level kural).

---

## 4) Katılım (Attendance)  ✅ ANA VARLIK

Bir personelin bir eğitimi aldığına dair kayıttır.  
**Tüm raporlar, tablolar ve pivotlar buradan türetilir.**

### Alanlar (Kavramsal)

#### Personel Bilgisi
- Personel (sicil no üzerinden)

#### Eğitim Bilgisi
- Eğitim Kodu
- Eğitim Alt Başlığı (varsa)

#### Zaman Bilgisi
- Eğitim Başlama Tarihi
- Eğitim Bitiş Tarihi
- Eğitim Başlama Saati
- Eğitim Bitiş Saati
- Yıl (otomatik)
- Ay (otomatik)

#### Eğitim Bilgisi
- Eğitim Süresi (dakika)  → **snapshot**
- İç / Dış Eğitim
- Eğitim Yeri
  - Cihaz Başında
  - Eğitim Kurumunda
  - Diğer

#### Belge & Detay
- Sonuç Belgesi Türü
  - Eğitim Katılım Çizelgesi
  - Sertifika
- Eğitim Detaylı Açıklama

#### Kayıt Bilgisi
- Veriyi Giren Sicil
- Veriyi Giren Ad Soyad
- Veri Giriş Tarihi

---

## 5) Kullanıcı (System User)

Sisteme giriş yapan kişiler.

### Türler
- ŞEF
- ADMIN

### Alanlar
- Sicil No
- Ad Soyad
- Rol
- Aktif/Pasif

---

## 6) Eğitmen (Trainer)

Eğitim veren kişi bilgisidir. (opsiyonel kullanım)

### Alanlar
- Ad Soyad
- Aktif/Pasif

---

## 7) Import Kaydı (Opsiyonel)

Excel/CSV import işlemlerini izlemek için.

### Alanlar
- Dosya Adı
- Satır Sayısı
- Başarılı Kayıt Sayısı
- Hatalı Kayıt Sayısı
- Import Tarihi
- Import Yapan Kullanıcı

---

# İLİŞKİLER

Personel 1 --- n Katılım n --- 1 Eğitim
|
n
Eğitim Alt Başlığı (opsiyonel)

Kullanıcı (Şef) 1 --- n Katılım

---

# KRİTİK İŞ KURALLARI (Veri Model Seviyesi)

1. **Aynı personel aynı eğitimi aynı yıl içinde 1 kez alabilir.**

2. **Ay ve yıl manuel girilmez.**
- Eğitim başlangıç tarihinden otomatik hesaplanır.

3. **Eğitim süresi snapshot’tır.**
- Eğitim kataloğu değişse bile geçmiş katılım kayıtları değişmez.

4. **Atama yoktur.**
- Sadece gerçekleşmiş katılımlar tutulur.

5. **Vardiya tipi, terminal, bölge kodu yoktur.**
- Bu alanlar sistem dışıdır.

---

# NOT

Bu doküman:
- “Ne tutulur, ne tutulmaz”
- “Hangi veri nerede durur”
- “Hangi veri nereden türetilir”

sorularının **tek cevabıdır**.

Fiziksel tablo yapıları için **11-DB-SCHEMA.md** referans alınacaktır.
