# Yıllık Eğitim Çizelgesi – Geniş Görünüm (FINAL)

Bu doküman, Excel’de kullanılan **geniş yıllık eğitim çizelgesinin** web uygulamasındaki birebir karşılığını tanımlar.

> Bu ekran, 08-YEARLY-PIVOT-TABLE.md’nin **geniş, bloklu ve alt toplamlı** versiyonudur.

---

## 1) Amaç

Bu ekran:
- Eğitimleri **gruplu (bloklu)** şekilde gösterir
- Ay ay katılım sayılarını gösterir
- Sağda eğitim bazlı toplamları gösterir
- En altta **ayların dağılım toplamını** ve **genel toplamı** gösterir

---

## 2) Veri Kaynağı

Bu ekran **sadece** şu tablodan üretilir:

> **06-DETAIL-TABLE-FINAL.md – Detay Katılım Tablosu**

Başka hiçbir özet tablo veya manuel veri **kullanılmaz.**

---

## 3) Filtreler

### Zorunlu
- **Yıl**

### Opsiyonel
- Proje Adı
- Grup
- Personel Durumu (Çalışan / Ayrıldı / İzinli / Pasif)

> Ay filtresi YOKTUR.

---

## 4) Tablo Yapısı (Geniş)

### Sütunlar (sabit sırayla)

1. Eğitim Adı  
2. Eğitim Kodu  
3. Eğitim Süresi (dk)  
4. Ocak  
5. Şubat  
6. Mart  
7. Nisan  
8. Mayıs  
9. Haziran  
10. Temmuz  
11. Ağustos  
12. Eylül  
13. Ekim  
14. Kasım  
15. Aralık  
16. **Toplam Katılım**  
17. **Toplam Dakika**

---

## 5) Satır Tipleri

### 5.1 Eğitim Satırı

Her eğitim için 1 satır:

- Eğitim Adı
- Eğitim Kodu
- Eğitim Süresi
- Ocak..Aralık (katılım sayıları)
- Toplam Katılım
- Toplam Dakika

---

### 5.2 Blok Başlık Satırı (Zorunlu)

Eğitimler **bloklar altında** gruplanır.

Örnek bloklar:
- **TEMEL EĞİTİMLER**
- **TAZELEME EĞİTİMLER**

Bu satırlar:
- Veri içermez
- Sadece görsel ayırıcıdır
- Kalın ve arka planlı gösterilir

---

### 5.3 En Alt Toplam Satırı (Zorunlu)

Tablonun en altında **tek bir genel toplam satırı** bulunur.

Bu satırda:

- Ocak..Aralık → her ayın toplam katılımı
- Toplam Katılım → tüm eğitimlerin toplam katılımı
- Toplam Dakika → tüm eğitimlerin toplam dakikası

---

## 6) Hücre Hesaplama Mantığı

### 6.1 Ay Hücresi (Eğitim x Ay)

HÜCRE = COUNT(*)
WHERE egitim_kodu = X
AND year = Y
AND month = M

yaml
Kodu kopyala

---

### 6.2 Eğitim Satırı – Toplam Katılım

TOPLAM_KATILIM = SUM(Ocak..Aralık)

yaml
Kodu kopyala

---

### 6.3 Eğitim Satırı – Toplam Dakika

TOPLAM_DAKIKA = TOPLAM_KATILIM x egitim_suresi_dk

yaml
Kodu kopyala

> egitim_suresi_dk = snapshot değerdir (değişmez)

---

### 6.4 En Alt Satır – Ay Dağılım Toplamı

OCAK_TOPLAM = SUM(tüm eğitimlerin Ocak hücresi)
SUBAT_TOPLAM = SUM(tüm eğitimlerin Şubat hücresi)
...
ARALIK_TOPLAM = SUM(tüm eğitimlerin Aralık hücresi)

yaml
Kodu kopyala

---

### 6.5 En Alt Satır – Genel Toplam

GENEL_TOPLAM_KATILIM = SUM(tüm eğitimlerin Toplam Katılım)
GENEL_TOPLAM_DAKIKA = SUM(tüm eğitimlerin Toplam Dakika)

yaml
Kodu kopyala

---

## 7) Blok Mantığı (TEMEL / TAZELEME)

Eğitimler şu kurala göre bloklanır:

### Tercih Edilen Yöntem:
- trainings.category alanı kullanılır:
  - "TEMEL"
  - "TAZELEME"

### Alternatif (zorunlu kalınırsa):
- Eğitim kodu "-T" içeriyorsa → TAZELEME
- Diğerleri → TEMEL

> Önerilen: **category alanı**

---

## 8) Davranış Kuralları

1. Bu ekran **sadece okunur**.
2. Kayıt ekleme YOK
3. Kayıt düzenleme YOK
4. Inline edit YOK

---

## 9) Drill-Down Davranışı

Kullanıcı:
- Herhangi bir ay hücresine tıklarsa (örn: M4 – Mayıs)

Sistem:
- **07-MONTHLY-GENERAL-TABLE.md** ekranına gider
- Filtreleri otomatik set eder:
  - Yıl
  - Ay
  - Eğitim Kodu

---

## 10) Yetki Kuralları

- Bu ekranı **SADECE ADMIN** görür.
- ŞEF bu ekrana **ASLA erişemez.**

(Referans: 04-ACCESS-CONTROL.md)

---

## 11) UI Kuralları

- Geniş tablo olduğu için yatay scroll zorunludur
- Ay kolonları sabit sırada olmalıdır (Ocak → Aralık)
- Blok başlık satırları:
  - Kalın
  - Arka plan rengi farklı
  - Tıklanamaz
- Toplam kolonları görsel olarak ay kolonlarından ayrılmalıdır
- En alt toplam satırı:
  - Kalın
  - Üstten çizgili (border-top)

---

## 12) Export

Admin bu tabloyu:

- Excel
- CSV

olarak dışa aktarabilir.

Export:
- Blok başlıkları dahil olmalıdır
- En alt toplam satırı dahil olmalıdır
- Filtreye %100 uygun olmalıdır

---

## 13) Bağlayıcılık

Bu doküman:
- UI
- API
- Backend sorguları

için **bağlayıcıdır.**

Geniş yıllık tablo geliştirilirken:
> **Bu doküman dışına çıkılamaz.**