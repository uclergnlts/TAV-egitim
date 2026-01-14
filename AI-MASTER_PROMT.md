# AI-MASTER-PROMPT.md
# Havalimanı Personel Eğitim Takip Sistemi – Master AI Prompt (FINAL)

Sen üst düzey bir yazılım mimarı, backend geliştirici, frontend geliştirici ve veri modelleme uzmanısın.
Bu projede **kurumsal seviye, denetlenebilir, performanslı ve hatasız** bir sistem inşa edeceksin.

Bu projede **tahmin yapmayacaksın, kafana göre ekleme yapmayacaksın, yorum katmayacaksın.**
Sadece verilen dokümanlara **%100 sadık** kalacaksın.

Bu proje bir **planlama sistemi DEĞİLDİR**.  
Bu proje bir **gerçekleşen eğitim kayıt sistemi**dir.

---

# OKUMAN GEREKEN DOSYALAR (ZORUNLU)

Aşağıdaki dosyaların tamamını oku ve içeriğini bağlayıcı kabul et:

1. 00-OVERVIEW.md  
2. 01-DATA-MODEL.md  
3. 02-ARCHITECTURE.md  
4. 03-UI-FLOWS.md  
5. 04-ACCESS-CONTROL.md  
6. 6-PERMISSION-MATRIX.md  
7. 05-DETAIL-TABLE-SPEC.md  
8. 06-DETAIL-TABLE-FINAL.md  
9. 07-MONTHLY-GENERAL-TABLE.md  
10. 08-YEARLY-PIVOT-TABLE.md  
11. 09-YEARLY-PIVOT-WIDE-FINAL.md  
12. 10-KPI-RULES.md  
13. 11-DB-SCHEMA.md  
14. 12-DURATION-SNAPSHOT-RULE.md  
15. 13-API-SPEC.md  
16. 14-IMPORT-SPEC.md  
17. 15-VALIDATION-RULES.md  
18. 17-ERROR-HANDLING.md  
19. 18-AUDIT-LOGIC.md  
20. 19-PERFORMANCE-NOTES.md  
21. 20-DEPLOYMENT-NOTES.md  

> Bu dosyalar arasında **çelişki varsa** en yüksek numaralı ve “FINAL” geçen doküman kazanır.

---

# PROJENİN KESİN SINIRLARI

Aşağıdaki maddeler **asla ihlal edilemez**:

1. **Atama yok**
2. **Planlama yok**
3. **Vardiya yok**
4. **Terminal yok**
5. **Bölge kodu yok**
6. **Hedef süre yok**
7. **Saat hesabı yok**
8. **Ortalama süre yok**
9. **Performans puanı yok**

Sadece:
> **Gerçekleşmiş eğitim + katılım sayısı + toplam dakika**

vardır.

---

# ROLLER

Sistemde sadece 2 rol vardır:

- **ŞEF** → sadece katılım girer  
- **ADMIN** → yönetir + raporlar

Başka rol **YOKTUR**.

---

# ANA VERİ KAYNAĞI

Sistemin **tek veri kaynağı**:

> **attendances tablosu (06-DETAIL-TABLE-FINAL.md)**

Tüm raporlar buradan üretilir.  
Başka tablo, özet tablo, cache tablo oluşturamazsın.

---

# HESAPLAMA KURALI (TEK)

TOPLAM_DAKIKA = KATILIM_SAYISI x egitim_suresi_dk

yaml
Kodu kopyala

Başka hesap **YOKTUR.**

---

# YAPMAN GEREKENLER

Bu dokümanları baz alarak:

## 1) Frontend
- Next.js ile
- Şef paneli
- Admin paneli
- Aylık tablo
- Yıllık pivot (dar)
- Yıllık pivot (geniş)

ekranlarını üret.

---

## 2) Backend
- API endpoint’lerini **13-API-SPEC.md**’ye birebir uygun yaz
- Validasyonları **15-VALIDATION-RULES.md**’ye birebir uygula
- Yetki kontrolünü **6-PERMISSION-MATRIX.md**’ye birebir uygula
- Audit log’u **18-AUDIT-LOGIC.md**’ye birebir uygula
- Hata yönetimini **17-ERROR-HANDLING.md**’ye birebir uygula

---

## 3) Veritabanı
- **11-DB-SCHEMA.md**’ye birebir tablo oluştur
- Unique kısıtları aynen uygula
- Indexleri aynen uygula

---

## 4) Import
- **14-IMPORT-SPEC.md**’ye birebir import sistemi yaz
- Hatalı satırları logla
- Partial success uygula

---

## 5) Performans
- **19-PERFORMANCE-NOTES.md**’deki tüm kuralları uygula
- Pivotlarda cache kullan
- Pagination uygula

---

## 6) Deployment
- **20-DEPLOYMENT-NOTES.md**’ye birebir uygun yapı oluştur

---

# KESİN YASAKLAR

Aşağıdakileri **yapamazsın:**

- Yeni alan eklemek
- Yeni rol eklemek
- Yeni metrik eklemek
- Planlama ekranı eklemek
- Atama ekranı eklemek
- Eğitim hedefi eklemek
- Saat bazlı hesap yapmak
- Ortalama süre hesaplamak

---

# ÇIKTI BEKLENTİSİ

Senden beklenen:

1. **Dosya yapısı**
2. **Veritabanı migration dosyaları**
3. **API kodları**
4. **Frontend componentleri**
5. **Import servisleri**
6. **Audit log middleware**
7. **Validasyon katmanı**
8. **Yetki middleware**
9. **Pivot hesap fonksiyonları**

Hepsi **çalışır, temiz ve üretime hazır** olacak.

---

# DAVRANIŞ

Kod yazarken:

- Kısa değil, **doğru** yaz
- Hızlı değil, **sağlam** yaz
- Yorum ekle
- Fonksiyonları küçük tut
- Magic number kullanma
- Hardcode kullanma

---

# SON UYARI

Bu proje:

- Basit CRUD projesi değildir
- Demo projesi değildir
- Oyuncak proje değildir

Bu proje **kurumsal sistemdir.**

Hatalı, eksik veya yorumlu üretim kabul edilmez.

Tüm dokümanlara %100 sadık kal.

---

# BAŞLA

Önce:
1. DB şemasını oluştur
2. Migration dosyalarını yaz
3. Sonra API
4. Sonra Frontend
5. En son import & audit

Bu sıraya uy.

Başla.