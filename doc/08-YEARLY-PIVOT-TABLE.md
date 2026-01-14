# Yıllık Genel Pivot Tablo – FINAL Spesifikasyon (Dar Görünüm)

Bu doküman, seçilen **yıl** için eğitimlerin **ay ay katılım sayılarını** gösteren
yıllık pivot tablonun dar (standart) görünümünü tanımlar.

> Bu ekran Excel’deki yıllık çizelgenin web karşılığıdır.
> Geniş görünüm için: **09-YEARLY-PIVOT-WIDE-FINAL.md**

---

## 1) Amaç

Yıllık Genel Pivot Tablo:
- Bir yıl içinde **hangi eğitim kaç ayda kaç kişi tarafından alınmış** sorusunun cevabıdır.
- Eğitim bazlı yıllık performans ve yoğunluğu gösterir.
- Tüm toplamlar ve dağılımlar **otomatik hesaplanır.**

---

## 2) Veri Kaynağı

Bu ekran **sadece** aşağıdaki tablodan üretilir:

> **06-DETAIL-TABLE-FINAL.md – Detay Katılım Tablosu**

Başka hiçbir özet tablo, manuel veri veya cache **kullanılmaz.**

---

## 3) Filtreler

### Zorunlu
- **Yıl**

### Opsiyonel
- Proje Adı
- Grup
- Personel Durumu (Çalışan / Ayrıldı / İzinli / Pasif)

> Ay filtresi **YOKTUR.**  
> Çünkü bu ekran yılın tamamını kapsar.

---

## 4) Tablo Yapısı (Dar Görünüm)

### Satırlar
- Eğitim Adı
- Eğitim Kodu
- Eğitim Süresi (dk)

### Sütunlar
- Ocak
- Şubat
- Mart
- Nisan
- Mayıs
- Haziran
- Temmuz
- Ağustos
- Eylül
- Ekim
- Kasım
- Aralık
- **Toplam Katılım**
- **Toplam Dakika**

---

## 5) Hücre Hesaplama Mantığı

### Ay Hücresi (Eğitim x Ay)

HÜCRE_DEGERI = COUNT(*)
WHERE egitim_kodu = X
AND year = Y
AND month = M

yaml
Kodu kopyala

> Bu değer: o ay o eğitimi alan kişi sayısıdır.

---

### Toplam Katılım (Satır Sonu)

TOPLAM_KATILIM = SUM(Ocak..Aralık)

yaml
Kodu kopyala

---

### Toplam Dakika (Satır Sonu)

TOPLAM_DAKIKA = TOPLAM_KATILIM x egitim_suresi_dk

yaml
Kodu kopyala

> egitim_suresi_dk = snapshot değer (kayıt anındaki süre)

---

## 6) En Alt Toplam Satırı (Özet Satırı)

Tablonun en altında **tek bir toplam satırı** yer alır.

Bu satırda:

### Ay Toplamları

OCAK_TOPLAM = SUM(tüm eğitimlerin Ocak hücresi)
SUBAT_TOPLAM = SUM(tüm eğitimlerin Şubat hücresi)
...
ARALIK_TOPLAM = SUM(tüm eğitimlerin Aralık hücresi)

yaml
Kodu kopyala

---

### Genel Toplam Katılım

GENEL_TOPLAM_KATILIM = SUM(tüm eğitimlerin Toplam Katılım)

yaml
Kodu kopyala

---

### Genel Toplam Dakika

GENEL_TOPLAM_DAKIKA = SUM(tüm eğitimlerin Toplam Dakika)

yaml
Kodu kopyala

---

## 7) Davranış Kuralları

1. Bu ekran **edit ekranı değildir.**
2. Bu ekranda **kayıt ekleme yoktur.**
3. Bu ekranda **kayıt düzenleme yoktur.**
4. Bu ekran **sadece okuma + export** içindir.

---

## 8) Drill-Down (Opsiyonel Ama Önerilir)

Kullanıcı:
- Herhangi bir hücreye (örn: M4 – Mayıs) tıklarsa

Sistem:
- İlgili **ay + eğitim kodu** için
- **Aylık Genel Tablo (07-MONTHLY-GENERAL-TABLE.md)** görünümüne yönlendirir
- Filtreler otomatik set edilir.

---

## 9) Yetki Kuralları

- Bu ekranı **SADECE ADMIN** görür.
- ŞEF bu ekrana **ASLA erişemez.**

(Detay: 04-ACCESS-CONTROL.md)

---

## 10) UI Kuralları

- Tablo yatay scroll desteklemelidir.
- Ay kolonları sabit sırada olmalıdır (Ocak → Aralık).
- Sayılar sağa hizalı gösterilmelidir.
- Toplam kolonları görsel olarak ay kolonlarından ayrılmalıdır.

---

## 11) Export

Admin bu tabloyu:

- Excel
- CSV

formatında dışa aktarabilir.

Export edilen veri:
- Ekrandaki yıl filtresiyle %100 uyumlu olmalıdır.
- En alt toplam satırı **dahil** edilmelidir.

---

## 12) Bağlayıcılık

Bu doküman:
- UI
- API
- Backend sorguları

için **bağlayıcıdır.**

Yıllık pivot tablo geliştirilirken:
> **Bu doküman dışına çıkılamaz.**
