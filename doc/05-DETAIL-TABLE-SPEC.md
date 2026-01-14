# 05-DETAIL-TABLE-SPEC.md
# Detay Katılım Tablosu – Taslak Spesifikasyon

Bu doküman, sistemde tutulacak **detay katılım verisinin mantığını ve kapsamını** tanımlar.
Bu tablo, tüm aylık ve yıllık raporların **tek veri kaynağıdır**.

Not:
- Bu bir taslak/spesifikasyon dokümanıdır.
- Nihai alanlar ve kurallar için: **06-DETAIL-TABLE-FINAL.md** referans alınacaktır.

---

## 1) Amaç

Detay Katılım Tablosu:
- “Kim, hangi eğitimi, ne zaman, nerede, nasıl aldı?” sorusunun cevabıdır.
- Excel’de tek tek satır satır tutulan kayıtların **dijital karşılığıdır**.
- Aylık genel tablo ve yıllık pivot tabloların **ham verisidir**.

Her satır = **1 personel + 1 eğitim + 1 yıl**

---

## 2) Genel Yaklaşım

Bu tablo:
- Şefler tarafından doldurulur
- Admin tarafından raporlanır
- Sistem tarafından hesaplanır

Atama yoktur, planlama yoktur.  
Sadece gerçekleşmiş eğitimler tutulur.

---

## 3) Sütun Grupları

Alanlar mantıksal olarak 5 gruba ayrılır:

1. Personel Bilgileri  
2. Eğitim Bilgileri  
3. Zaman Bilgileri  
4. Belge & Detay Bilgileri  
5. Kayıt (Audit) Bilgileri  

---

## 4) Personel Bilgileri (Taslak)

- Sicil No  
- Ad Soyad  
- TC Kimlik No  
- Görevi  
- Proje Adı  
- Grup  
- Personel Durumu  

Açıklama:
- Personel bilgileri **personel tablosundan** gelir.
- Detay tabloda sadece snapshot olarak tutulabilir.

---

## 5) Eğitim Bilgileri (Taslak)

- Eğitim Kodu  
- Eğitim Adı  
- Eğitim Alt Başlığı (varsa)  
- Eğitim Süresi (dakika)  
- İç / Dış Eğitim  
- Eğitim Yeri  
  - Cihaz Başında  
  - Eğitim Kurumunda  
  - Diğer  

Açıklama:
- Eğitim bilgileri **eğitim kataloğundan** gelir.
- Süre, katılım anında snapshot alınır.

---

## 6) Zaman Bilgileri (Taslak)

- Eğitim Başlama Tarihi  
- Eğitim Bitiş Tarihi  
- Eğitim Başlama Saati  
- Eğitim Bitiş Saati  
- Yıl (otomatik)  
- Ay (otomatik)  

Açıklama:
- Yıl ve ay manuel girilmez.
- Başlama tarihinden otomatik hesaplanır.

---

## 7) Belge & Detay Bilgileri (Taslak)

- Sonuç Belgesi Türü  
  - Eğitim Katılım Çizelgesi  
  - Sertifika  
- Eğitim Detaylı Açıklama (serbest metin)

Açıklama:
- Belge türü seçmelidir.
- Detay alanı opsiyoneldir.

---

## 8) Kayıt (Audit) Bilgileri (Taslak)

- Veriyi Giren Sicil  
- Veriyi Giren Ad Soyad  
- Veri Giriş Tarihi  

Açıklama:
- Bu alanlar sistem tarafından otomatik doldurulur.
- Kullanıcı manuel değiştiremez.

---

## 9) İş Kuralları (Taslak Seviyesi)

1. Aynı personel aynı eğitimi aynı yıl içinde **2 kez alamaz**  
2. Atama yoktur, sadece gerçekleşen kayıt vardır  
3. Eğitim süresi dakika bazındadır  
4. Saat dönüşümü yoktur  
5. Vardiya tipi, terminal, bölge kodu yoktur  

---

## 10) Bu Dokümanın Rolü

Bu doküman:
- UI tasarımı için rehberdir
- Form alanlarının neden var olduğunu açıklar
- Veri modelinin mantığını anlatır

Ancak:
> **Gerçek bağlayıcı doküman: 06-DETAIL-TABLE-FINAL.md’dir.**

Geliştirme sırasında çakışma olursa **FINAL olan esas alınır.**

---

## 11) Bilinçli Olarak Olmayan Alanlar

Bu sistemde **bilinçli olarak olmayan** alanlar:

- Vardiya tipi  
- Terminal  
- Bölge kodu  
- Planlanan tarih  
- Atanan eğitmen  
- Hedef süre  

Sebep:
Bu sistem **planlama değil, gerçekleşen kayıt** sistemidir.