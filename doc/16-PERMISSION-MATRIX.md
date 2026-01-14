Bu doküman, sistemdeki **tüm rollerin tüm modüller üzerindeki yetkilerini** tek tabloda gösterir.

Amaç:
- Yetki karmaşasını bitirmek
- UI ve API tarafında yanlış yetki açılmasını engellemek
- AI araçlarının yanlış rol kurgulamasını önlemek

> Bu doküman bağlayıcıdır.  
> Çelişki olursa **bu doküman kazanır.**

---

# 1) Roller

Sistemde **sadece 2 rol vardır**:

1. **ŞEF** – Veri giriş kullanıcısı  
2. **ADMIN** – Yönetici + Rapor kullanıcısı

Başka rol **YOKTUR.**

---

# 2) Modül Bazlı Yetki Matrisi

| Modül / Ekran | ŞEF | ADMIN |
|---------------|-----|-------|
| Login | ✅ | ✅ |
| Şef Paneli (Katılım Girişi) | ✅ | ❌ |
| Şef Kayıt Geçmişi | ✅ (sadece kendi) | ❌ |
| Admin Dashboard | ❌ | ✅ |
| Eğitim Kataloğu Yönetimi | ❌ | ✅ |
| Eğitim Alt Başlık Yönetimi | ❌ | ✅ |
| Personel Yönetimi | ❌ | ✅ |
| Personel Import | ❌ | ✅ |
| Aylık Genel Tablo | ❌ | ✅ |
| Yıllık Pivot (Dar) | ❌ | ✅ |
| Yıllık Pivot (Geniş) | ❌ | ✅ |
| Detay Katılım Listesi | ❌ | ✅ |
| Export (Excel/CSV) | ❌ | ✅ |
| Import Log Görüntüleme | ❌ | ✅ |

---

# 3) İşlem Bazlı Yetki Matrisi

| İşlem | ŞEF | ADMIN |
|-------|-----|-------|
| Sisteme giriş | ✅ | ✅ |
| Personel arama | ✅ | ✅ |
| Eğitim listesi görme | ✅ | ✅ |
| Katılım kaydı oluşturma | ✅ | ❌ |
| Katılım kaydı düzenleme | Opsiyonel | ✅ |
| Katılım kaydı silme | ❌ | ✅ |
| Eğitim ekleme | ❌ | ✅ |
| Eğitim güncelleme | ❌ | ✅ |
| Eğitim pasife alma | ❌ | ✅ |
| Personel ekleme | ❌ | ✅ |
| Personel güncelleme | ❌ | ✅ |
| Personel pasife alma | ❌ | ✅ |
| Personel import | ❌ | ✅ |
| Aylık rapor görüntüleme | ❌ | ✅ |
| Yıllık rapor görüntüleme | ❌ | ✅ |
| Excel export | ❌ | ✅ |

---

# 4) API Bazlı Yetki Matrisi

| Endpoint | ŞEF | ADMIN |
|---------|-----|-------|
| POST /api/auth/login | ✅ | ✅ |
| GET /api/personnel/search | ✅ | ✅ |
| GET /api/trainings | ✅ | ✅ |
| POST /api/attendances | ✅ | ❌ |
| GET /api/attendances/my | ✅ | ❌ |
| DELETE /api/attendances/{id} | ❌ | ✅ |
| POST /api/personnel | ❌ | ✅ |
| POST /api/personnel/import | ❌ | ✅ |
| POST /api/trainings | ❌ | ✅ |
| PUT /api/trainings/{id} | ❌ | ✅ |
| GET /api/reports/monthly | ❌ | ✅ |
| GET /api/reports/yearly-pivot | ❌ | ✅ |
| GET /api/reports/yearly-pivot-wide | ❌ | ✅ |
| GET /api/export/* | ❌ | ✅ |

---

# 5) Kritik Yetki Kuralları

1. **Şef asla rapor göremez.**  
2. **Şef asla başka şefin girdiği kaydı göremez.**  
3. **Şef asla eğitim veya personel yönetemez.**  
4. **Admin her şeyi görür ve yönetir.**  
5. **Frontend yetkiye güvenmez, backend kesin kontrol yapar.**

---

# 6) UI Davranış Kuralları

- Şef giriş yaptığında:
  - Admin menüleri **görünmez**
  - Rapor linkleri **görünmez**
  - Yönetim menüleri **görünmez**

- Admin giriş yaptığında:
  - Şef paneli **görünmez**

> Rol bazlı menü render zorunludur.

---

# 7) Backend Davranış Kuralları

Her API isteğinde:

1. Token çözülür
2. Rol okunur
3. Endpoint yetki matrisi ile karşılaştırılır
4. Uygun değilse:
403 Forbidden
"Bu işlem için yetkiniz yok"

yaml
Kodu kopyala

---

# 8) Yasaklar

Aşağıdakiler **kesinlikle yasaktır:**

- Rolü frontend state’inden okumak
- Rolü query param ile belirlemek
- “Gizledik ama backend açık” yaklaşımı
- Şefe rapor endpoint’i açmak

---

# 9) Bağlayıcılık

Bu doküman:
- 04-ACCESS-CONTROL.md
- 13-API-SPEC.md
- 15-VALIDATION-RULES.md

ile %100 uyumlu olmak zorundadır.

Çelişki olursa:
> **6-PERMISSION-MATRIX.md kazanır.**