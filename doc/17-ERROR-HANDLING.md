# Eğitim Takip Sistemi – Hata Yönetimi ve Davranış Kuralları (FINAL)

Bu doküman, sistemde oluşabilecek **tüm hata türlerinin nasıl ele alınacağını** tanımlar.

Amaç:
- Kullanıcıyı kilitlememek
- Veriyi bozmamak
- Sessiz hata üretmemek
- “Niye kaydetmedi?” sorusunu bitirmek

> Bu doküman bağlayıcıdır.  
> UI, Backend ve Import bu kurallara %100 uymak zorundadır.

---

## 1) Genel Prensipler

1. **Sessiz hata YOK**
2. **Yutulan hata YOK**
3. **Kullanıcıya anlaşılır mesaj zorunlu**
4. **Log’suz hata YOK**
5. **Hatalı veri DB’ye ASLA yazılmaz**

---

## 2) Hata Türleri

Sistemde 4 ana hata türü vardır:

1. **Validasyon Hataları**
2. **Yetki Hataları**
3. **İş Kuralı Hataları**
4. **Sistem / Teknik Hatalar**

---

## 3) Validasyon Hataları

### Örnekler:
- Zorunlu alan boş
- Tarih formatı yanlış
- Enum değeri geçersiz

### Davranış:

**Backend:**
400 Bad Request
{
success: false,
code: "VALIDATION_ERROR",
message: "Zorunlu alan eksik: baslama_tarihi"
}

yaml
Kodu kopyala

**Frontend:**
- Alan altına kırmızı uyarı
- Toast: “Lütfen zorunlu alanları doldurun”

---

## 4) Yetki Hataları

### Örnekler:
- Şef rapor endpoint’ine girdi
- Şef personel import denedi

### Davranış:

**Backend:**
403 Forbidden
{
success: false,
code: "FORBIDDEN",
message: "Bu işlem için yetkiniz yok"
}

yaml
Kodu kopyala

**Frontend:**
- Sayfa render edilmez
- “Yetkiniz yok” uyarısı
- Gerekirse /login’e yönlendirme

---

## 5) İş Kuralı Hataları

### En kritik grup – asla bypass edilmez

### Örnekler:
- Aynı personel aynı eğitimi aynı yıl içinde almaya çalıştı
- Var olmayan eğitim kodu girildi
- Var olmayan sicil no girildi

### Davranış:

**Backend:**
409 Conflict
{
success: false,
code: "BUSINESS_RULE_VIOLATION",
message: "Bu personel bu eğitimi bu yıl zaten almış."
}

yaml
Kodu kopyala

**Frontend:**
- Modal veya toast ile net mesaj
- Form reset edilmez
- Kullanıcı yönlendirilir

---

## 6) Sistem / Teknik Hatalar

### Örnekler:
- DB bağlantı koptu
- Timeout
- Beklenmeyen exception

### Davranış:

**Backend:**
500 Internal Server Error
{
success: false,
code: "INTERNAL_ERROR",
message: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."
}

yaml
Kodu kopyala

**Frontend:**
- Genel hata mesajı
- “Daha sonra tekrar deneyin” uyarısı
- Detay kullanıcıya gösterilmez

---

## 7) Import Hataları

Import özel bir konudur, **ayrı ele alınır.**

### Satır Bazlı Hata

- Sadece o satır reddedilir
- Diğer satırlar devam eder
- Hatalı satır:
  - import_errors tablosuna yazılır
  - UI’da listelenir

### Dosya Bazlı Hata

- Zorunlu kolon yoksa
- Format bozuksa

→ **Tüm import iptal edilir**

---

## 8) Hata Mesajı Standartları

Tüm hata mesajları:

- Türkçe
- Kısa
- Net
- Teknik jargon içermez

### İyi Örnek:
> “Bu personel bu eğitimi bu yıl zaten almış.”

### Kötü Örnek:
> “Unique constraint violation on attendances_personel_training_year_idx”

---

## 9) UI Davranış Kuralları

1. Hata olduğunda form **reset edilmez**
2. Kullanıcının girdiği veri **silinmez**
3. Hata alanı **kırmızı ile işaretlenir**
4. Genel hata **toast/modal** ile gösterilir

---

## 10) Loglama Kuralları

Her hata:

- timestamp
- user_id
- endpoint
- request payload (maskelenmiş)
- hata kodu
- hata mesajı

ile loglanır.

> Log olmadan hata kapatılamaz.

---

## 11) Yasaklar

Aşağıdakiler **kesinlikle yasaktır:**

- try/catch içinde hatayı boş bırakmak
- console.log ile geçiştirmek
- kullanıcıya “bir şeyler ters gitti” deyip bırakmak
- import hatasını sessiz geçmek

---

## 12) Hata Kodları Standart Seti

| Code | Anlam |
|------|-------|
| VALIDATION_ERROR | Alan / format hatası |
| FORBIDDEN | Yetkisiz erişim |
| BUSINESS_RULE_VIOLATION | İş kuralı ihlali |
| NOT_FOUND | Kayıt bulunamadı |
| INTERNAL_ERROR | Sistem hatası |

---

## 13) Bağlayıcılık

Bu doküman:
- 15-VALIDATION-RULES.md
- 6-PERMISSION-MATRIX.md
- 13-API-SPEC.md
- 14-IMPORT-SPEC.md

ile %100 uyumlu olmak zorundadır.

Çelişki olursa:
> **17-ERROR-HANDLING.md kazanır.**