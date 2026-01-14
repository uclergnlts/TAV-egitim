# TAV Eğitim Paneli

Havalimanı personeli için eğitim takip ve yönetim sistemi.

## 🚀 Özellikler

### Şef Paneli
- Toplu personel eğitim kaydı (Sicil No listesi ile)
- Eğitim seçimi ve otomatik detay doldurma
- Eğitmen atama
- Tarih/saat seçimi

### Admin Paneli
- **Dashboard:** Genel istatistikler
- **Personel Yönetimi:** CRUD, Import (Excel/CSV), Filtreleme, Sayfalama
- **Eğitim Yönetimi:** Eğitim kataloğu, alt başlıklar
- **Eğitmen Yönetimi:** CRUD, Import
- **Tanımlamalar:** Eğitim yerleri, belge türleri
- **Raporlar:**
  - Aylık Genel Tablo
  - Yıllık Pivot Tablo
  - Detaylı Katılım Raporu (21 sütun, Excel export)
- **Denetim Kayıtları:** Audit log görüntüleme
- **Veri Yükleme:** Personel ve Katılım import

## 🛠 Teknolojiler

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Turso (LibSQL/SQLite)
- **ORM:** Drizzle ORM
- **Auth:** JWT (jose)
- **Excel:** SheetJS (xlsx)

## 📦 Kurulum

```bash
# Dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm start
```

## 🔐 Environment Variables

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

## 👤 Varsayılan Kullanıcılar

| Rol | Sicil No | Şifre |
|-----|----------|-------|
| Admin | ADMIN001 | admin123 |
| Şef | SEF001 | sef123 |

## 📁 Proje Yapısı

```
app/
├── api/              # API Routes
│   ├── auth/         # Login, logout
│   ├── personnel/    # Personel CRUD
│   ├── trainings/    # Eğitim CRUD
│   ├── trainers/     # Eğitmen CRUD
│   ├── attendances/  # Katılım kayıtları
│   ├── reports/      # Raporlar
│   ├── definitions/  # Tanımlamalar
│   ├── import/       # Excel import
│   └── audit-logs/   # Denetim kayıtları
├── admin/            # Admin paneli sayfaları
├── chef/             # Şef paneli sayfaları
└── login/            # Giriş sayfası

lib/
├── auth.ts           # JWT authentication
├── audit.ts          # Audit logging utility
├── utils.ts          # Yardımcı fonksiyonlar
└── db/
    ├── schema.ts     # Drizzle şeması
    ├── index.ts      # Veritabanı bağlantısı
    └── seed.ts       # Seed data

doc/                  # Spesifikasyon dokümanları
scripts/              # One-off import scriptleri
```

## 🔒 Güvenlik

- JWT tabanlı authentication
- Rol bazlı yetkilendirme (ADMIN/CHEF)
- Şifre hash (bcryptjs)
- Audit logging (tüm kritik işlemler)
- Soft delete (veri kaybı önleme)

## 📊 Veritabanı Şeması

- `users` - Sistem kullanıcıları
- `personnel` - Personel bilgileri
- `trainings` - Eğitim kataloğu
- `training_topics` - Eğitim alt başlıkları
- `trainers` - Eğitmenler
- `attendances` - Katılım kayıtları (ana tablo)
- `training_locations` - Eğitim yerleri
- `document_types` - Belge türleri
- `audit_logs` - Denetim kayıtları

## 🌐 Deployment

### Vercel (Önerilen)
1. GitHub'a push edin
2. Vercel'de import edin
3. Environment variables ekleyin
4. Deploy!

### Manuel
```bash
npm run build
npm start
```

## 📝 Lisans

Private - TAV ESB

## 👨‍💻 Geliştirici

Üçler Gönültaş
