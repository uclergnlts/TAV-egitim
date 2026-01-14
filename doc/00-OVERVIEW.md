# 00-OVERVIEW.md
# Havalimanı Personel Eğitim Takip Sistemi

## Amaç

Bu projenin amacı, havalimanında çalışan personelin yıllık zorunlu eğitimlere **katılımını** web tabanlı bir sistem üzerinden takip etmektir.

Sistem:
- **Atama / planlama yapmaz**
- Sadece **gerçekleşen eğitim katılımlarını** kayıt altına alır
- Excel ile tutulan yıllık ve aylık çizelgelerin **birebir dijital karşılığıdır**

---

## Kapsam

Sistem aşağıdaki ihtiyaçları karşılar:

1. Şefler tarafından personel eğitim katılımı girilmesi  
2. Admin tarafından eğitim kataloglarının ve personel listesinin yönetilmesi  
3. Aylık genel tablo (seçilen ayın tüm kayıtları)  
4. Yıllık genel pivot tablo (Eğitim x Ay)  
5. Toplam katılım ve toplam dakika hesaplarının otomatik yapılması  

---

## Temel Kavramlar

### Personel
Eğitim alan havalimanı personelidir.  
Sicil no üzerinden tanımlanır.

### Eğitim
Yıllık zorunlu eğitimlerdir.  
Her eğitim:
- Eğitim kodu (örn: M4)
- Eğitim adı
- Eğitim açıklaması
- Eğitim süresi (dakika)
- Alt başlıklar (varsa)

içerir.

### Katılım
Bir personelin bir eğitimi aldığına dair kayıttır.  
Her katılım = 1 satır veri demektir.

---

## Roller

### ŞEF
- Sisteme giriş yapar
- Personel için eğitim katılım kaydı girer
- Sadece veri giriş ekranlarını kullanır

### ADMIN
- Eğitim kataloglarını yönetir
- Personel listesini yönetir (import + manuel)
- Aylık ve yıllık tüm raporları görür
- Genel toplamları ve istatistikleri takip eder

---

## Kritik İş Kuralları (Final ve Değişmez)

1. **Aynı personel aynı eğitimi aynı yıl içinde sadece 1 kez alabilir.**  
2. **Atama yoktur.** Sistem sadece gerçekleşen katılımları tutar.  
3. **Ay bilgisi manuel girilmez.** Eğitim başlangıç tarihinden otomatik hesaplanır.  
4. **Toplam dakika hesabı:**  
5. **Saat dönüşümü yoktur.** Her şey dakika bazındadır.  
6. **Kişi başı ortalama, katılım başına ortalama gibi KPI’lar yoktur.**  
7. **Eğitim süresi snapshot alınır.** Sonradan değişse bile geçmiş kayıtlar etkilenmez.  
8. **Vardiya tipi, terminal, bölge kodu gibi alanlar sistemde yoktur.**

---

## Çıktı Ekranları

### 1) Aylık Genel Tablo
- Seçilen ay + yıl için tüm katılım kayıtları listelenir
- Toplam katılım sayısı
- Toplam dakika hesaplanır

### 2) Yıllık Genel Pivot Tablo
- Satır: Eğitimler
- Sütun: Ocak – Aralık
- Hücre: O ay o eğitimi alan kişi sayısı
- Sağda:
- Toplam katılım
- Toplam dakika
- En altta:
- Ayların toplamı
- Genel toplam dakika

---

## Proje Felsefesi

Bu sistem:
- Excel’e bağımlılığı bitirmek
- Manuel hesap hatalarını sıfırlamak
- Denetim ve raporlamayı kolaylaştırmak
- Şef ve yönetici iş yükünü azaltmak

amacıyla tasarlanmıştır.

Tüm mimari, veri modeli ve ekranlar bu dokümana uygun olmak zorundadır.
Bu dosya, projenin **ana referansıdır (single source of truth)**.
