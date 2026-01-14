# 04-ACCESS-CONTROL.md
# Eğitim Takip Sistemi – Yetkilendirme & Erişim Kontrolü

Bu doküman, sistemdeki rollerin **hangi ekranlara, hangi işlemlere erişebileceğini** net şekilde tanımlar.

Amaç:
- Güvenlik açıklarını engellemek
- Rol karmaşasını önlemek
- AI’nin yanlış yetki vermesini engellemek

---

## 1) Roller

Sistemde sadece **2 rol vardır**:

1. **ŞEF**
2. **ADMIN**

Başka rol yoktur. (Müdür, izleyici, süper user vs YOK)

---

## 2) Rol Tanımları

### 2.1 ŞEF

Şef = **Veri Giriş Kullanıcısı**

Yetkileri:
- Sisteme giriş yapar
- Personel için eğitim katılım kaydı girer
- Kendi girdiği kayıtları görür (opsiyonel ekran)
- Kendi girdiği kayıtları düzenleyebilir (opsiyonel)
- Kendi girdiği kayıtları silebilir (opsiyonel)

Kısıtlar:
- Eğitim kataloğunu göremez/düzenleyemez
- Personel listesi yönetemez
- Aylık / yıllık raporları göremez
- Başka şeflerin girdiği kayıtları göremez
- Toplamları, istatistikleri göremez

---

### 2.2 ADMIN

Admin = **Yönetici + Rapor Kullanıcısı**

Yetkileri:
- Sisteme giriş yapar
- Tüm kayıtları görür
- Tüm raporları görür
- Eğitim kataloğunu yönetir
- Personel listesini yönetir
- Import yapar
- Genel toplamları görür
- Gerekirse kayıtları düzenler / siler

Kısıtlar:
- Yok (tam yetki)

---

## 3) Ekran Bazlı Yetki Matrisi

| Ekran / Modül | ŞEF | ADMIN |
|--------------|-----|-------|
| /login | ✅ | ✅ |
| /chef | ✅ | ❌ |
| /chef/history | ✅ (sadece kendi) | ❌ |
| /admin | ❌ | ✅ |
| /admin/dashboard | ❌ | ✅ |
| /admin/trainings | ❌ | ✅ |
| /admin/personnel | ❌ | ✅ |
| /admin/reports/monthly | ❌ | ✅ |
| /admin/reports/yearly | ❌ | ✅ |
| /admin/details | ❌ | ✅ |

---

## 4) API Bazlı Yetki Kuralları

### ŞEF Yetkileri

| Endpoint | İzin |
|---------|------|
| POST /api/attendances | ✅ |
| GET /api/attendances/my | ✅ |
| PUT /api/attendances/{id} | Opsiyonel |
| DELETE /api/attendances/{id} | Opsiyonel |
| GET /api/personnel/search | ✅ |
| GET /api/trainings/list | ✅ |

---

### ADMIN Yetkileri

| Endpoint | İzin |
|---------|------|
| GET /api/attendances | ✅ |
| GET /api/reports/monthly | ✅ |
| GET /api/reports/yearly | ✅ |
| POST /api/trainings | ✅ |
| PUT /api/trainings/{id} | ✅ |
| POST /api/personnel | ✅ |
| POST /api/personnel/import | ✅ |
| DELETE /api/personnel/{id} | ✅ |
| DELETE /api/attendances/{id} | ✅ |

---

## 5) Backend Yetkilendirme Kuralları

Yetki kontrolü:
- **Frontend’e güvenilmez**
- Tüm kontroller **backend seviyesinde** yapılır

Her request:
1. Token doğrulanır
2. Kullanıcı rolü alınır
3. Endpoint rol matrisi ile karşılaştırılır
4. Uygunsa devam
5. Değilse:
403 Forbidden
{
success: false,
message: "Bu işlem için yetkiniz yok"
}

yaml
Kodu kopyala

---

## 6) Kritik Güvenlik Kuralları

1. Şef, **kendi girdiği kayıt dışında hiçbir kaydı göremez**
2. Şef, **rapor ekranlarına asla erişemez**
3. Admin, **her şeyi görür**
4. Rol bilgisi token içinde taşınır
5. Rol frontend state’inden değil, backend’den okunur

---

## 7) Yetki Felsefesi

- Şef = gir
- Admin = yönet + gör
- Arası yok
- İstisna yok
- “Şuna da açılsın” yok

Bu sistemde **yetki net, keskin ve tartışmasızdır.**

---

## 8) Not

Bu doküman bağlayıcıdır.  
Yeni rol eklemek istendiğinde önce bu doküman güncellenmelidir.  
Aksi durumda sistem mimarisi bozulmuş sayılır.