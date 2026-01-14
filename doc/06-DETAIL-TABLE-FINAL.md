# Detay Katılım Tablosu – FINAL Spesifikasyon (Altın Standart)

Bu doküman, sistemde tutulacak **tek gerçek katılım verisini** tanımlar.  
Aylık genel tablo, yıllık pivot tablo ve tüm toplamlar **sadece bu tablodan** üretilir.

> Her satır = 1 personelin 1 eğitimi aldığı gerçek kayıt

Bu doküman bağlayıcıdır.  
Çakışma durumunda **bu doküman kazanır.**

---

## 1) Amaç

Detay Katılım Tablosu:
- “Kim, hangi eğitimi, ne zaman, nerede, nasıl aldı?” sorusunun tek cevabıdır.
- Excel’de satır satır tutulan kayıtların **birebir dijital karşılığıdır**.
- Planlama / atama içermez, **sadece gerçekleşmiş kayıt** tutar.

---

## 2) Zorunlu Alanlar (Kesin Olacak)

### 2.1 Personel Bilgileri

1. **sicil_no**  
2. **ad_soyad**  
3. **tc_kimlik_no**  
4. **gorevi**  
5. **proje_adi**  
6. **grup**  
7. **personel_durumu**
   - Çalışan
   - Ayrıldı
   - İzinli
   - Pasif

> Not: Bu alanlar personel tablosundan snapshot olarak alınır.

---

### 2.2 Eğitim Bilgileri

8. **egitim_kodu**  
9. **egitim_alt_basligi** (varsa, yoksa NULL)

---

### 2.3 Zaman Bilgileri

10. **egitim_baslama_tarihi**  
11. **egitim_bitis_tarihi**  
12. **egitim_baslama_saati**  
13. **egitim_bitis_saati**

> Not:
> - Yıl ve ay manuel girilmez.
> - Sistem, başlangıç tarihinden otomatik üretir.

---

### 2.4 Eğitim Detay Bilgileri

14. **egitim_suresi_dk**  → *snapshot, değişmez*  
15. **egitim_yeri**
    - Cihaz Başında  
    - Eğitim Kurumunda  
    - Diğer  
16. **ic_dis_egitim**
    - İç  
    - Dış  

---

### 2.5 Belge & Açıklama

17. **sonuc_belgesi_turu**
    - Eğitim Katılım Çizelgesi  
    - Sertifika  

18. **egitim_detayli_aciklama** (opsiyonel)

---

### 2.6 Kayıt (Audit) Bilgileri

19. **veri_giren_sicil**  
20. **veri_giren_ad_soyad**  
21. **veri_giris_tarihi**

> Bu alanlar sistem tarafından otomatik doldurulur.

---

## 3) Bilinçli Olarak OLMAYAN Alanlar

Bu sistemde **bilerek ve özellikle olmayan** alanlar:

- Vardiya tipi  
- Terminal  
- Bölge kodu  
- Planlanan tarih  
- Atanan eğitmen  
- Hedef süre  

Sebep:
> Bu sistem **planlama değil, gerçekleşen eğitim takibi** sistemidir.

---

## 4) İş Kuralları (Final)

1. **Aynı personel aynı eğitimi aynı yıl içinde sadece 1 kez alabilir**
unique(sicil_no, egitim_kodu, yil)

markdown
Kodu kopyala

2. **Atama yoktur.**
- Sadece gerçekleşmiş eğitim girilir.

3. **Ay ve yıl manuel girilmez.**
- egitim_baslama_tarihi üzerinden otomatik hesaplanır.

4. **Eğitim süresi snapshot’tır.**
- Kayıt anında alınır.
- Sonradan eğitim kataloğu değişse bile geçmiş kayıtlar değişmez.

5. **Saat dönüşümü yoktur.**
- Tüm hesaplar dakika bazındadır.

6. **Kişi başı ortalama, katılım başına ortalama yoktur.**
- Tek metrik: **Toplam Dakika**

---

## 5) Hesaplama Mantığı (Bu Tablo Üzerinden)

### Aylık Genel Tablo
Filtre: year = Y AND month = M
Liste: bu tablodaki satırlar
Toplam Katılım = satır sayısı
Toplam Dakika = SUM(egitim_suresi_dk)

yaml
Kodu kopyala

---

### Yıllık Pivot Tablo

#### Hücre (Eğitim x Ay):
COUNT(*) WHERE egitim_kodu = X AND month = M AND year = Y

shell
Kodu kopyala

#### Satır Toplam:
SUM(Ocak..Aralık)

shell
Kodu kopyala

#### Toplam Dakika:
Satır Toplam x egitim_suresi_dk

yaml
Kodu kopyala

---

### En Alt Genel Toplam

Genel Toplam Dakika = SUM(tüm eğitimlerin toplam dakikası)

yaml
Kodu kopyala

---

## 6) Veri Kaynağı Önceliği

Bu tabloda:
- Personel bilgisi → personnel tablosundan snapshot
- Eğitim bilgisi → trainings tablosundan snapshot
- Süre → kayıt anında alınır, **sonradan join yapılmaz**

---

## 7) UI ile İlişki

Şef ekranındaki tüm alanlar **birebir bu dokümana** göre oluşturulacaktır.

Eksik alan → HATA  
Fazla alan → HATA

Bu doküman UI, API ve DB için **tek referanstır.**

---

## 8) Bağlayıcılık

Bu doküman:
- UI-FLOWS.md
- DATA-MODEL.md
- DB-SCHEMA.md

üzerinde **üstünlüğe sahiptir.**

Çelişki olursa:
> **06-DETAIL-TABLE-FINAL.md kazanır.**
