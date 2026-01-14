# Eğitim Takip Sistemi – Performans Notları & Optimizasyon Kuralları (FINAL)

Bu doküman, sistemin **yük altında bozulmaması**, raporların **hızlı açılması** ve
import işlemlerinin **sistemi kilitlememesi** için uygulanacak performans kurallarını tanımlar.

> Bu doküman bağlayıcıdır.  
> “Şimdilik böyle kalsın” yaklaşımı kabul edilmez.

---

## 1) Genel Performans Felsefesi

1. **Detay tablo büyür, raporlar ağırlaşır → bu normaldir**
2. Ama:
   - UI donmamalı
   - API timeout olmamalı
   - DB kilitlenmemeli

---

## 2) Ana Performans Risk Noktaları

Bu sistemde performansı en çok zorlayan 3 alan:

1. **Yıllık Pivot Tablolar**
2. **Geniş Yıllık Tablo (bloklu)**
3. **Toplu Import İşlemleri**

Bu 3 alan **özel optimizasyon ister.**

---

## 3) Veritabanı Performansı

### 3.1 Zorunlu Indexler

attendances tablosunda:

(year, month)
(training_id, year)
(personel_id, year)
(sicil_no)

yaml
Kodu kopyala

> Bu indexler **zorunludur.**  
> Yoksa pivot ekranı çöker.

---

### 3.2 Query Kuralları

- SELECT * YASAK (raporlarda)
- Sadece gereken kolonlar çekilir
- Gereksiz join yapılmaz

---

## 4) Yıllık Pivot Performansı

### Problem:
GROUP BY training_id, month

yaml
Kodu kopyala
büyüdükçe yavaşlar.

---

### Çözüm 1 – Cache (Önerilen)

- Yıllık pivot sonuçları cache’lenir
- Cache key:
pivot:{year}:{proje}:{grup}

yaml
Kodu kopyala

- Cache süresi:
- 5 dakika
- veya yeni kayıt girilince invalidate

---

### Çözüm 2 – Pre-Aggregate (Opsiyonel)

İleri seviye:
- nightly job ile
- ayrı summary tabloya yazılabilir

Ama:
> Şimdilik **cache yeterli.**

---

## 5) Aylık Genel Tablo Performansı

- Server-side pagination zorunlu
- LIMIT / OFFSET kullanılır
- Frontend asla tüm veriyi tek seferde çekmez

---

## 6) Import Performansı

### 6.1 Chunk Mantığı

Import:

- 50 satır
- veya 100 satır

chunk’lar halinde işlenir.

Tek transaction’ta 1000 satır **YASAK.**

---

### 6.2 Async Import (Önerilen)

- Import job queue’ya atılır
- Kullanıcıya:
> “Import başlatıldı, tamamlanınca haber verilecek”

denir.

- UI polling veya websocket ile sonucu alır.

---

## 7) Frontend Performansı

### 7.1 Tablo Render

- 1000+ satır varsa:
- Virtual scroll
- veya pagination

Zorunlu.

---

### 7.2 Re-render Kontrolü

- Pivot tablolar memoize edilir
- Gereksiz state update YASAK

---

## 8) API Performansı

- Tüm rapor endpoint’lerinde:
- timeout: min 30s
- ama hedef: <2s

- N+1 query YASAK
- Her rapor endpoint’i için:
- tek optimize query

---

## 9) Audit Log Performansı

- Audit log yazımı:
- async olabilir
- ana işlemi bekletmez

Ama:
> Log başarısızsa **uyarı logu** yazılır.

---

## 10) Yasaklar

Aşağıdakiler **kesinlikle yasaktır:**

- Pivot tablosu frontend’de hesaplamak
- 10.000 satırı tek seferde UI’ya basmak
- Import’u tek transaction ile yapmak
- Cache kullanmadan pivot yazmak
- Indexsiz rapor yazmak

---

## 11) Ölçümleme (Monitoring)

Zorunlu metrikler:

- API response time
- DB query time
- Import süresi
- Pivot render süresi

Bu metrikler:
- loglanır
- gerektiğinde raporlanır

---

## 12) Hedef Performans Değerleri

| İşlem | Hedef |
|-------|-------|
| Aylık tablo açılış | < 1.5 sn |
| Yıllık pivot | < 2 sn |
| Geniş yıllık tablo | < 3 sn |
| Import 100 satır | < 5 sn |

---

## 13) Bağlayıcılık

Bu doküman:
- 11-DB-SCHEMA.md
- 08-YEARLY-PIVOT-TABLE.md
- 09-YEARLY-PIVOT-WIDE-FINAL.md
- 14-IMPORT-SPEC.md
- 18-AUDIT-LOGIC.md

ile %100 uyumlu olmak zorundadır.

Çelişki olursa:
> **19-PERFORMANCE-NOTES.md kazanır.**