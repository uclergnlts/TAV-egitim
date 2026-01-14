# 10-KPI-RULES.md
# KPI ve Toplam Hesaplama Kuralları (FINAL)

Bu doküman, sistemdeki **tek geçerli metrikleri** ve **hesaplama kurallarını** tanımlar.

> Bu sistemde KPI azdır, nettir ve tartışmasızdır.

---

## 1) Geçerli Tek Ana Metrik

### TOPLAM_DAKIKA

TOPLAM_DAKIKA = KATILIM_SAYISI x EGITIM_SURESI_DK

yaml
Kodu kopyala

- egitim_suresi_dk = snapshot değerdir (değişmez)
- Saat dönüşümü YOKTUR
- Dakika → saat çevirisi YOKTUR

---

## 2) Aylık Metrikler

### Aylık Toplam Katılım
AYLIK_TOPLAM_KATILIM = COUNT(attendance satırı)

shell
Kodu kopyala

### Aylık Toplam Dakika
AYLIK_TOPLAM_DAKIKA = SUM(egitim_suresi_dk)

yaml
Kodu kopyala

---

## 3) Yıllık Metrikler

### Eğitim Bazlı Yıllık Toplam Katılım
YILLIK_TOPLAM_KATILIM = SUM(Ocak..Aralık)

shell
Kodu kopyala

### Eğitim Bazlı Yıllık Toplam Dakika
YILLIK_TOPLAM_DAKIKA = YILLIK_TOPLAM_KATILIM x egitim_suresi_dk

yaml
Kodu kopyala

---

## 4) En Alt Genel Toplamlar

### Genel Toplam Katılım
GENEL_TOPLAM_KATILIM = SUM(tüm eğitimlerin YILLIK_TOPLAM_KATILIM değeri)

shell
Kodu kopyala

### Genel Toplam Dakika
GENEL_TOPLAM_DAKIKA = SUM(tüm eğitimlerin YILLIK_TOPLAM_DAKIKA değeri)

yaml
Kodu kopyala

---

## 5) Bilinçli Olarak OLMAYAN Metrikler

Bu sistemde **kesinlikle olmayan** metrikler:

- Kişi başı ortalama süre
- Katılım başına ortalama süre
- Saat bazlı toplam
- Hedef süre / planlanan süre
- Performans puanı
- Yüzdelik başarı oranı

Sebep:
> Bu sistem **performans ölçmez**, **planlama yapmaz**, **sadece gerçekleşen eğitimi sayar.**

---

## 6) Hesaplama Yeri

- Tüm hesaplamalar **backend tarafında** yapılır.
- Frontend **hesap yapmaz**, sadece render eder.

---

## 7) Bağlayıcılık

Bu doküman:
- 07-MONTHLY-GENERAL-TABLE.md
- 08-YEARLY-PIVOT-TABLE.md
- 09-YEARLY-PIVOT-WIDE-FINAL.md

için **üst referanstır.**

Çelişki olursa:
> **10-KPI-RULES.md kazanır.**