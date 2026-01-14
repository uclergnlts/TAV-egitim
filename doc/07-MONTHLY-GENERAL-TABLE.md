# Aylık Genel Tablo – FINAL Spesifikasyon

Bu doküman, seçilen **ay + yıl** için gösterilecek olan **aylık genel tabloyu** tanımlar.  
Bu tablo, detay katılım tablosunun (06-DETAIL-TABLE-FINAL.md) **filtrelenmiş görünümüdür**.

> Bu ekran “özet” değil, **aylık detay liste + toplam** ekranıdır.

---

## 1) Amaç

Aylık Genel Tablo:
- Seçilen ayda **hangi personel hangi eğitimi almış** sorusunun cevabıdır.
- Şeflerin girdiği kayıtların yönetici tarafından **kontrol edildiği ana ekrandır**.
- Excel’deki “aylık genel tablo”nun **birebir dijital karşılığıdır**.

---

## 2) Veri Kaynağı

Bu ekran **sadece** aşağıdaki tablodan beslenir:

> **06-DETAIL-TABLE-FINAL.md – Detay Katılım Tablosu**

Başka hiçbir tablo, cache veya özet tablo kullanılmaz.

---

## 3) Filtreler (Zorunlu & Opsiyonel)

### Zorunlu Filtreler
1. **Yıl**
2. **Ay**

> Bu iki filtre seçilmeden tablo yüklenmez.

---

### Opsiyonel Filtreler
- Proje Adı
- Grup
- Eğitim Kodu
- Sicil No
- Personel Durumu (Çalışan / Ayrıldı / İzinli / Pasif)
- Veriyi Giren Sicil

---

## 4) Gösterilecek Kolonlar (FINAL)

Tabloda **kesinlikle** şu kolonlar yer alır:

1. sicil_no  
2. ad_soyad  
3. tc_kimlik_no  
4. gorevi  
5. proje_adi  
6. grup  
7. egitim_kodu  
8. egitim_alt_basligi  
9. egitim_baslama_tarihi  
10. egitim_bitis_tarihi  
11. egitim_baslama_saati  
12. egitim_bitis_saati  
13. egitim_suresi_dk  
14. egitim_yeri  
15. ic_dis_egitim  
16. sonuc_belgesi_turu  
17. egitim_detayli_aciklama  
18. veri_giren_sicil  
19. veri_giren_ad_soyad  
20. veri_giris_tarihi  
21. personel_durumu  

> Eksik kolon = HATA  
> Fazla kolon = HATA  

---

## 5) Sıralama

Varsayılan sıralama:

1. egitim_baslama_tarihi (ASC)
2. egitim_baslama_saati (ASC)
3. ad_soyad (ASC)

---

## 6) Hesaplamalar (Aylık)

### 6.1 Aylık Toplam Katılım

AYLIK_TOPLAM_KATILIM = COUNT(satır sayısı)

yaml
Kodu kopyala

Yani:
> Bu tabloda kaç satır varsa = o ayki toplam katılım

---

### 6.2 Aylık Toplam Dakika

AYLIK_TOPLAM_DAKIKA = SUM(egitim_suresi_dk)

yaml
Kodu kopyala

> Her satır = 1 katılım = 1 süre

---

## 7) En Alt Özet Alanı

Tablonun altında **sabit olarak** gösterilir:

- **Toplam Katılım:** X
- **Toplam Dakika:** Y

Başka metrik **gösterilmez**.

---

## 8) Yetki Kuralları

- Bu ekranı **SADECE ADMIN** görür.
- ŞEF bu ekrana **ASLA erişemez.**

(Detay: 04-ACCESS-CONTROL.md)

---

## 9) Davranış Kuralları

1. Bu ekran **edit ekranı değildir.**
2. Bu ekranda **kayıt ekleme yoktur.**
3. Bu ekranda **kayıt düzenleme yoktur.**
4. Bu ekran **sadece okuma + export** içindir.

---

## 10) Export

Admin bu tablodaki veriyi:

- Excel
- CSV

formatında dışa aktarabilir.

Export edilen dosya:
- Ekranda görünen filtreye %100 uygun olmalıdır.
- Gizli alan, ekstra alan içermemelidir.

---

## 11) UI Kuralları

- Tablo yatay scroll desteklemelidir.
- Kolon gizleme özelliği olabilir (opsiyonel)
- Satır sayısı fazla olabilir, pagination şarttır.
- Performans için server-side pagination önerilir.

---

## 12) Bağlayıcılık

Bu doküman:
- UI
- API
- Backend sorguları

için **bağlayıcıdır**.

Aylık genel tablo geliştirilirken:
> **Bu doküman dışına çıkılamaz.**