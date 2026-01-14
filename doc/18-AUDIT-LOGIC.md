# Eğitim Takip Sistemi – Audit & İz Kayıt Mantığı (FINAL)

Bu doküman, sistemdeki tüm **kritik işlemlerin izlenmesini (audit log)**,  
kim tarafından, ne zaman, ne şekilde yapıldığının kayıt altına alınmasını tanımlar.

Amaç:
- Denetim izlenebilirliği sağlamak
- Geriye dönük inceleme yapabilmek
- “Kim girdi, kim sildi, kim değiştirdi?” sorularını bitirmek

> Bu doküman bağlayıcıdır.  
> Tüm modüller bu kurala uymak zorundadır.

---

## 1) Audit Mantığı – Genel Prensip

Sistemde şu işlemler **mutlaka loglanır:**

1. Katılım ekleme
2. Katılım silme
3. Katılım düzenleme (opsiyonel)
4. Personel ekleme / silme / güncelleme
5. Eğitim ekleme / silme / güncelleme
6. Import işlemleri
7. Login / logout işlemleri

---

## 2) Audit Log Tablosu

### Tablo Adı: audit_logs

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | UUID (PK) | Benzersiz ID |
| user_id | UUID | İşlemi yapan kullanıcı |
| user_role | enum | CHEF / ADMIN |
| action_type | varchar | CREATE / UPDATE / DELETE / IMPORT / LOGIN |
| entity_type | varchar | attendance / personnel / training / import |
| entity_id | UUID | İşlem yapılan kayıt |
| action_time | timestamp | İşlem zamanı |
| old_value | json | Eski veri (varsa) |
| new_value | json | Yeni veri |
| ip_address | varchar | Kullanıcı IP |
| user_agent | varchar | Tarayıcı bilgisi |

---

## 3) Hangi İşlem Nasıl Loglanır?

### 3.1 Katılım Ekleme

action_type = "CREATE"
entity_type = "attendance"
entity_id = attendances.id
new_value = tüm kayıt
old_value = null

yaml
Kodu kopyala

---

### 3.2 Katılım Silme

action_type = "DELETE"
entity_type = "attendance"
entity_id = attendances.id
old_value = silinen kayıt
new_value = null

yaml
Kodu kopyala

---

### 3.3 Personel Güncelleme

action_type = "UPDATE"
entity_type = "personnel"
entity_id = personnel.id
old_value = eski veri
new_value = yeni veri

yaml
Kodu kopyala

---

### 3.4 Eğitim Güncelleme

action_type = "UPDATE"
entity_type = "training"
entity_id = trainings.id
old_value = eski veri
new_value = yeni veri

yaml
Kodu kopyala

---

### 3.5 Import İşlemi

action_type = "IMPORT"
entity_type = "attendance" veya "personnel"
entity_id = import.id
old_value = null
new_value = { success_count, fail_count }

yaml
Kodu kopyala

---

### 3.6 Login

action_type = "LOGIN"
entity_type = "user"
entity_id = users.id
old_value = null
new_value = { login_time }

yaml
Kodu kopyala

---

## 4) Kim Log Görebilir?

- **Sadece ADMIN** audit logları görebilir.
- ŞEF asla audit log ekranına erişemez.

---

## 5) Audit Log Ekranı (Admin)

Ekran: `/admin/audit-logs`

### Filtreler:
- Kullanıcı
- Rol
- İşlem Türü
- Tarih Aralığı
- Entity Türü

### Kolonlar:
- Tarih
- Kullanıcı
- Rol
- İşlem Türü
- Entity
- Açıklama

---

## 6) Kritik Kurallar

1. Audit log **asla silinmez**
2. Audit log **asla güncellenmez**
3. Audit log **asla kullanıcıdan gizlenmez**
4. Audit log **manuel girilemez**
5. Audit log **backend tarafından otomatik yazılır**

---

## 7) Güvenlik

- old_value ve new_value alanlarında:
  - Şifre
  - Token
  - Gizli bilgi

**asla tutulmaz.**

Gerekirse maskeleme yapılır.

---

## 8) Performans

- Audit log yazımı async olabilir
- Ama **başarısız olursa işlem iptal edilmez**
- Ancak log yazılamazsa **uyarı logu** düşülür

---

## 9) Yasaklar

Aşağıdakiler **kesinlikle yasaktır:**

- Audit logu kapatmak
- Performans için logu iptal etmek
- “Buna gerek yok” deyip silmek
- Şefe audit ekranı açmak

---

## 10) Bağlayıcılık

Bu doküman:
- 17-ERROR-HANDLING.md
- 6-PERMISSION-MATRIX.md
- 13-API-SPEC.md
- 11-DB-SCHEMA.md

ile %100 uyumlu olmak zorundadır.

Çelişki olursa:
> **18-AUDIT-LOGIC.md kazanır.**