# Eğitim Süresi Snapshot Kuralı – FINAL

Bu doküman, eğitim süresinin nasıl ele alınacağını ve **neden asla değişmemesi gerektiğini** tanımlar.

Bu kural bağlayıcıdır.  
Aksi yönde geliştirme **hatalı kabul edilir.**

---

## 1) Problem Tanımı

Eğitim kataloglarında zamanla:
- Eğitim süresi değişebilir
- Eğitim içeriği güncellenebilir
- Eğitim revize edilebilir

Eğer raporlar **canlı olarak katalogdan süre çekerse**, geçmiş ayların ve yılların:

- Toplam dakika
- Yıllık toplamlar
- Genel toplamlar

**bozulur.**

Bu kabul edilemez.

---

## 2) Çözüm: Snapshot Mantığı

Katılım kaydı oluşturulurken:

attendances.egitim_suresi_dk = trainings.duration_min

yaml
Kodu kopyala

şeklinde **o anki değer kopyalanır.**

Bu işlem **zorunludur.**

---

## 3) Sonuç

- Eğitim kataloğunda süre değişse bile
- Eski katılım kayıtlarının süresi **DEĞİŞMEZ**
- Yıllık ve aylık raporlar **geriye dönük bozulmaz**
- Denetim ve raporlama güvenilir kalır

---

## 4) Yasaklar

Aşağıdakiler **kesinlikle yasaktır:**

- Raporlarda trainings.duration_min ile join yaparak süre almak
- attendances.egitim_suresi_dk alanını sonradan güncellemek
- Geçmiş kayıtları “düzeltmek” adına süreyi değiştirmek

---

## 5) Hesaplama Referansı

Tüm hesaplamalarda:

TOPLAM_DAKIKA = KATILIM_SAYISI x attendances.egitim_suresi_dk

yaml
Kodu kopyala

kullanılır.

Başka kaynak **kullanılamaz.**

---

## 6) Bağlayıcılık

Bu doküman:
- 10-KPI-RULES.md
- 11-DB-SCHEMA.md
- 07-MONTHLY-GENERAL-TABLE.md
- 08-YEARLY-PIVOT-TABLE.md
- 09-YEARLY-PIVOT-WIDE-FINAL.md

için **üst referanstır.**

Çelişki olursa:
> **12-DURATION-SNAPSHOT-RULE.md kazanır.**