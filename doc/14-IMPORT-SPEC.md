# Personel & Katılım Import Spesifikasyonu – FINAL

Bu doküman, sistemde yapılacak **Excel / CSV import işlemlerinin** kurallarını, kolon eşlemelerini ve hata davranışlarını tanımlar.

> Import sistemi, hataya toleranslı ama kurala sıfır toleranslıdır.

---

# 1) Genel Amaç

Import özelliği:
- Toplu personel yüklemek
- Toplu eğitim katılım kaydı yüklemek

için kullanılır.

Import:
- ADMIN yetkisindedir
- ŞEF import yapamaz

---

# 2) Desteklenen Dosya Formatları

- `.xlsx`
- `.csv`

Başka format **kabul edilmez.**

---

# 3) Import Türleri

Sistemde 2 tip import vardır:

1. **Personel Import**
2. **Katılım (Attendance) Import**

Bu iki işlem **ayrı endpoint ve ayrı parser** kullanır.

---

# 4) PERSONEL IMPORT

## 4.1 Zorunlu Kolonlar

Excel dosyasında **birebir bu kolon isimleri** aranır:

| Excel Kolon Adı | Sistem Alanı |
|------------------|--------------|
| sicil_no | sicil_no |
| ad_soyad | full_name |
| tc_kimlik_no | tc_kimlik_no |
| gorevi | gorevi |
| proje_adi | proje_adi |
| grup | grup |
| personel_durumu | personel_durumu |

> Büyük/küçük harf duyarsız olabilir ama isim birebir eşleşmelidir.

---

## 4.2 Personel Import Kuralları

1. sicil_no boş olamaz  
2. sicil_no sistemde varsa:
   - Güncelleme YAPILMAZ
   - Satır SKIP edilir
3. personel_durumu sadece şu değerleri alır:
   - CALISAN
   - AYRILDI
   - IZINLI
   - PASIF

Aksi değer → hata

---

## 4.3 Personel Import Sonucu

Import bitince:

Toplam Satır: 120
Başarılı: 115
Hatalı: 5

yaml
Kodu kopyala

şeklinde özet döner.

Hatalı satırlar **import_errors** tablosuna yazılır.

---

# 5) KATILIM (ATTENDANCE) IMPORT

Bu import, **06-DETAIL-TABLE-FINAL.md**’ye birebir uymak zorundadır.

---

## 5.1 Zorunlu Kolonlar

Excel dosyasında **birebir şu kolonlar olmalıdır:**

| Excel Kolon Adı | Sistem Alanı |
|------------------|--------------|
| sicil_no | sicil_no |
| egitim_kodu | egitim_kodu |
| egitim_alt_basligi | egitim_alt_basligi |
| baslama_tarihi | baslama_tarihi |
| bitis_tarihi | bitis_tarihi |
| baslama_saati | baslama_saati |
| bitis_saati | bitis_saati |
| egitim_yeri | egitim_yeri |
| ic_dis_egitim | ic_dis_egitim |
| sonuc_belgesi_turu | sonuc_belgesi_turu |
| egitim_detayli_aciklama | egitim_detayli_aciklama |

> Not: ad_soyad, proje_adi, grup vb sistemden snapshot alınır, Excel’de zorunlu değildir.

---

## 5.2 Katılım Import Kuralları

Her satır için sırasıyla:

1. sicil_no var mı?
   - Yok → hata

2. Personel sistemde var mı?
   - Yok → hata

3. egitim_kodu sistemde var mı?
   - Yok → hata

4. Aynı personel aynı eğitimi aynı yıl içinde almış mı?
   - Evet → hata (duplicate)

5. baslama_tarihi / bitis_tarihi formatı doğru mu?
   - Hayır → hata

6. baslama_saati / bitis_saati formatı doğru mu?
   - Hayır → hata

7. egitim_yeri şu değerlerden biri mi?
   - CIHAZ_BASINDA
   - EGITIM_KURUMUNDA
   - DIGER

   Değilse → hata

8. ic_dis_egitim:
   - IC
   - DIS

   Değilse → hata

9. sonuc_belgesi_turu:
   - EGITIM_KATILIM_CIZELGESI
   - SERTIFIKA

   Değilse → hata

---

## 5.3 Katılım Import Otomatik İşlemler

Başarılı satırda sistem otomatik:

- personel snapshot alır (ad, proje, grup vs)
- egitim_suresi_dk snapshot alır
- year ve month hesaplar
- veri_giren = import yapan admin olarak set eder
- created_at set eder

---

## 5.4 Katılım Import Örnek Satır

| sicil_no | egitim_kodu | egitim_alt_basligi | baslama_tarihi | bitis_tarihi | baslama_saati | bitis_saati | egitim_yeri | ic_dis_egitim | sonuc_belgesi_turu | egitim_detayli_aciklama |
|---------|-------------|--------------------|----------------|--------------|---------------|-------------|-------------|---------------|----------------------|-------------------------|
| 12345 | M4 | Patlayıcı Tanıma | 2026-05-12 | 2026-05-12 | 09:00 | 09:40 | CIHAZ_BASINDA | IC | EGITIM_KATILIM_CIZELGESI | Rutin tazeleme |

---

# 6) HATA DAVRANIŞI

- Hatalı satır **DB’ye yazılmaz**
- Diğer satırlar etkilenmez (partial success)
- Her hatalı satır:
  - satır no
  - hata mesajı
  - ham veri

şeklinde **import_errors** tablosuna yazılır.

---

# 7) Import Sonuç Ekranı

Admin import sonrası şunu görür:

- Toplam Satır
- Başarılı Satır
- Hatalı Satır
- “Hataları Gör” butonu

---

# 8) Yasaklar

Aşağıdakiler **kesinlikle yasaktır:**

- Import sırasında süreyi Excel’den almak
- Import sırasında year/month manuel almak
- Duplicate kayıt zorla yazmak
- Hatalı satırı sessizce atlamak

---

# 9) Güvenlik

- Import endpoint’i sadece **ADMIN** erişimine açıktır
- ŞEF import yapamaz
- Import işlemleri loglanır

---

# 10) Bağlayıcılık

Bu doküman:
- 06-DETAIL-TABLE-FINAL.md
- 11-DB-SCHEMA.md
- 13-API-SPEC.md

ile %100 uyumlu olmak zorundadır.

Çelişki olursa:
> **14-IMPORT-SPEC.md kazanır.**