# Eğitim Takip Sistemi – API Spesifikasyonu (FINAL)

Bu doküman, sistemde kullanılacak **tüm API endpoint’lerini**, request/response yapılarını ve yetki kurallarını tanımlar.

> Bu doküman bağlayıcıdır.  
> UI ve Backend bu dokümana %100 uymak zorundadır.

---

# GENEL KURALLAR

- Tüm endpoint’ler JSON döner
- Tüm endpoint’ler auth ister (login hariç)
- Rol kontrolü backend’de yapılır
- Hata formatı standarttır:

{
success: false,
message: "Hata açıklaması"
}

lua
Kodu kopyala

Başarılı cevap formatı:

{
success: true,
data: ...
}

yaml
Kodu kopyala

---

# 1) AUTH

## POST /api/auth/login

Kullanıcı giriş yapar.

### Request
{
"sicil_no": "12345",
"password": "******"
}

shell
Kodu kopyala

### Response
{
"success": true,
"token": "jwt_token",
"role": "CHEF" | "ADMIN",
"full_name": "Ahmet Yılmaz"
}

yaml
Kodu kopyala

---

# 2) PERSONEL

## GET /api/personnel/search?query=12345

Sicil no veya ad soyad ile personel arama.  
**Yetki:** ŞEF, ADMIN

### Response
{
"success": true,
"data": [
{
"id": "uuid",
"sicil_no": "12345",
"full_name": "Ahmet Yılmaz",
"tc_kimlik_no": "11111111111",
"gorevi": "X-Ray Operatörü",
"proje_adi": "TAV ESB",
"grup": "A",
"personel_durumu": "CALISAN"
}
]
}

yaml
Kodu kopyala

---

## POST /api/personnel  (ADMIN)

Yeni personel ekler.

### Request
{
"sicil_no": "12346",
"full_name": "Mehmet Kaya",
"tc_kimlik_no": "22222222222",
"gorevi": "Kontrol Memuru",
"proje_adi": "TAV ESB",
"grup": "B",
"personel_durumu": "CALISAN"
}

yaml
Kodu kopyala

---

## POST /api/personnel/import  (ADMIN)

Excel/CSV import.

### Request
- multipart/form-data
- file: excel dosyası

### Response
{
"success": true,
"total_rows": 120,
"success_count": 115,
"fail_count": 5
}

yaml
Kodu kopyala

---

# 3) EĞİTİM KATALOĞU

## GET /api/trainings  (ŞEF, ADMIN)

Eğitim listesi.

### Response
{
"success": true,
"data": [
{
"id": "uuid",
"code": "M4",
"name": "Bilgi Tazeleme Eğitimi",
"duration_min": 40,
"category": "TEMEL",
"has_topics": true
}
]
}

yaml
Kodu kopyala

---

## POST /api/trainings  (ADMIN)

Yeni eğitim ekler.

### Request
{
"code": "M40",
"name": "X-Ray Görüntü Analizi",
"description": "Detaylı eğitim",
"duration_min": 60,
"category": "TAZELEME"
}

yaml
Kodu kopyala

---

## PUT /api/trainings/{id}  (ADMIN)

Eğitim günceller.

---

## POST /api/trainings/{id}/topics  (ADMIN)

Alt başlık ekler.

### Request
{
"title": "Patlayıcı Tanıma"
}

yaml
Kodu kopyala

---

# 4) KATILIM (ANA KISIM)

## POST /api/attendances  (ŞEF)

Yeni katılım kaydı oluşturur.

### Request
{
"personel_id": "uuid",
"training_id": "uuid",
"training_topic_id": "uuid | null",
"ic_dis_egitim": "IC",
"egitim_yeri": "CIHAZ_BASINDA",
"baslama_tarihi": "2026-05-12",
"bitis_tarihi": "2026-05-12",
"baslama_saati": "09:00",
"bitis_saati": "09:40",
"sonuc_belgesi_turu": "EGITIM_KATILIM_CIZELGESI",
"egitim_detayli_aciklama": "Rutin tazeleme"
}

yaml
Kodu kopyala

### Backend Otomatik Yapar:
- year, month set eder
- egitim_suresi_dk snapshot alır
- sicil, ad, proje vs snapshot alır
- unique(personel, eğitim, yıl) kontrol eder

---

## GET /api/attendances/my  (ŞEF)

Şef kendi girdiği kayıtları görür.

---

## DELETE /api/attendances/{id}  (ADMIN)

Kayıt siler.

---

# 5) RAPORLAR

## GET /api/reports/monthly?year=2026&month=5  (ADMIN)

Aylık genel tablo.

### Response
{
"success": true,
"data": {
"rows": [ ... ],
"total_participation": 120,
"total_minutes": 4800
}
}

yaml
Kodu kopyala

---

## GET /api/reports/yearly-pivot?year=2026  (ADMIN)

Yıllık pivot (dar görünüm).

---

## GET /api/reports/yearly-pivot-wide?year=2026  (ADMIN)

Yıllık pivot (geniş görünüm, bloklu).

---

# 6) EXPORT

## GET /api/export/monthly?year=2026&month=5  (ADMIN)

Aylık tablo Excel.

---

## GET /api/export/yearly?year=2026  (ADMIN)

Yıllık tablo Excel.

---

# 7) IMPORT LOG

## GET /api/imports  (ADMIN)

Import geçmişi.

---

# 8) YETKİ ÖZETİ

| Endpoint | ŞEF | ADMIN |
|---------|-----|-------|
| /api/auth/login | ✅ | ✅ |
| /api/personnel/search | ✅ | ✅ |
| /api/personnel/import | ❌ | ✅ |
| /api/trainings | ✅ | ✅ |
| /api/attendances | ✅ | ❌ |
| /api/reports/* | ❌ | ✅ |
| /api/export/* | ❌ | ✅ |

---

# 9) HATA DURUMLARI

- Duplicate kayıt:
"Bu personel bu eğitimi bu yıl zaten almış."

diff
Kodu kopyala

- Yetkisiz erişim:
403 - Bu işlem için yetkiniz yok

diff
Kodu kopyala

- Eksik alan:
"Zorunlu alan eksik: baslama_tarihi"

yaml
Kodu kopyala

---

# 10) Bağlayıcılık

Bu doküman:
- 03-UI-FLOWS.md
- 04-ACCESS-CONTROL.md
- 06-DETAIL-TABLE-FINAL.md
- 11-DB-SCHEMA.md

ile %100 uyumlu olmak zorundadır.

Çelişki olursa:
> **13-API-SPEC.md kazanır.**