/**
 * Zod Doğrulama Şemaları
 * API input validasyonu için tüm entity şemaları
 */

import { z } from "zod";

// ============================================
// Ortak Validatörler
// ============================================

/** UUID formatı */
export const uuidSchema = z.string().uuid();

/** Sicil numarası (3-20 karakter, alfanümerik) */
export const sicilNoSchema = z
    .string()
    .min(3, "Sicil numarası en az 3 karakter olmalı")
    .max(20, "Sicil numarası en fazla 20 karakter olabilir")
    .regex(/^[A-Z0-9]+$/, "Sicil numarası sadece büyük harf ve rakam içerebilir");

/** TC Kimlik numarası (11 hane, sadece rakam) */
export const tcKimlikNoSchema = z
    .string()
    .length(11, "TC Kimlik numarası 11 haneli olmalı")
    .regex(/^[0-9]+$/, "TC Kimlik numarası sadece rakam içerebilir");

/** Telefon numarası */
export const phoneSchema = z
    .string()
    .regex(/^\+?[0-9\s-]{10,}$/, "Geçerli bir telefon numarası girin");

/** Tarih formatı (YYYY-MM-DD) */
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalı");

/** Saat formatı (HH:MM) */
export const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Saat HH:MM formatında olmalı");

// ============================================
// Kullanıcı Şemaları
// ============================================

/** Giriş formu şeması */
export const loginSchema = z.object({
    sicil_no: sicilNoSchema,
    password: z.string().min(4, "Şifre en az 4 karakter olmalı"),
});

/** Kullanıcı oluşturma şeması */
export const createUserSchema = z.object({
    sicil_no: sicilNoSchema,
    full_name: z.string().min(2, "Ad soyad en az 2 karakter olmalı").max(100),
    role: z.enum(["ADMIN", "CHEF"]),
    password: z.string().min(4, "Şifre en az 4 karakter olmalı"),
});

/** Kullanıcı güncelleme şeması */
export const updateUserSchema = z.object({
    id: uuidSchema,
    full_name: z.string().min(2).max(100).optional(),
    role: z.enum(["ADMIN", "CHEF"]).optional(),
    password: z.string().min(4).optional(),
    is_active: z.boolean().optional(),
});

// ============================================
// Personel Şemaları
// ============================================

/** Personel durum enum'ı */
export const personnelStatusEnum = z.enum(["CALISAN", "AYRILDI", "IZINLI", "PASIF"]);

/** Cinsiyet enum'ı */
export const genderEnum = z.enum(["ERKEK", "KADIN"]);

/** Personel oluşturma şeması */
export const createPersonnelSchema = z.object({
    sicilNo: sicilNoSchema,
    fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalı").max(100),
    tcKimlikNo: tcKimlikNoSchema,
    gorevi: z.string().min(1, "Görev alanı zorunlu").max(100),
    projeAdi: z.string().min(1, "Proje adı zorunlu").max(100),
    grup: z.string().min(1, "Grup zorunlu").max(50),
    personelDurumu: personnelStatusEnum.default("CALISAN"),
    cinsiyet: genderEnum.optional(),
    telefon: phoneSchema.optional().or(z.literal("")),
    dogumTarihi: dateSchema.optional().or(z.literal("")),
    adres: z.string().max(500).optional().or(z.literal("")),
});

/** Personel güncelleme şeması */
export const updatePersonnelSchema = z.object({
    id: uuidSchema,
    fullName: z.string().min(2).max(100).optional(),
    tcKimlikNo: tcKimlikNoSchema.optional(),
    gorevi: z.string().min(1).max(100).optional(),
    projeAdi: z.string().min(1).max(100).optional(),
    grup: z.string().min(1).max(50).optional(),
    personelDurumu: personnelStatusEnum.optional(),
    cinsiyet: genderEnum.optional().nullable(),
    telefon: phoneSchema.optional().or(z.literal("")).nullable(),
    dogumTarihi: dateSchema.optional().or(z.literal("")).nullable(),
    adres: z.string().max(500).optional().or(z.literal("")).nullable(),
});

/** Personel listeleme sorgu şeması */
export const personnelQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    query: z.string().max(100).optional(),
    sortBy: z.enum(["fullName", "sicilNo", "gorevi", "grup", "personelDurumu", "createdAt"]).default("fullName"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
    filterGrup: z.string().max(50).optional(),
    filterDurumu: personnelStatusEnum.optional(),
});

// ============================================
// Eğitim Şemaları
// ============================================

/** Eğitim kategorisi enum'ı */
export const trainingCategoryEnum = z.enum(["TEMEL", "TAZELEME", "DIGER"]);

/** Belge türü enum'ı */
export const documentTypeEnum = z.enum(["EGITIM_KATILIM_CIZELGESI", "SERTIFIKA"]);

/** İç/Dış eğitim enum'ı */
export const icDisEnum = z.enum(["IC", "DIS"]);

/** Eğitim oluşturma şeması */
export const createTrainingSchema = z.object({
    code: z.string().min(2, "Eğitim kodu en az 2 karakter olmalı").max(20),
    name: z.string().min(2, "Eğitim adı en az 2 karakter olmalı").max(200),
    description: z.string().max(1000).optional(),
    duration_min: z.coerce.number().int().positive().max(1440, "Eğitim süresi 24 saati geçemez"),
    category: trainingCategoryEnum.default("TEMEL"),
    default_location: z.string().max(100).optional(),
    default_document_type: documentTypeEnum.optional(),
});

/** Eğitim güncelleme şeması */
export const updateTrainingSchema = z.object({
    id: uuidSchema,
    code: z.string().min(2).max(20).optional(),
    name: z.string().min(2).max(200).optional(),
    description: z.string().max(1000).optional().nullable(),
    duration_min: z.coerce.number().int().positive().max(1440).optional(),
    category: trainingCategoryEnum.optional(),
    default_location: z.string().max(100).optional().nullable(),
    default_document_type: documentTypeEnum.optional().nullable(),
    isActive: z.boolean().optional(),
});

// ============================================
// Eğitim Konusu Şemaları
// ============================================

/** Eğitim konusu oluşturma şeması */
export const createTrainingTopicSchema = z.object({
    trainingId: uuidSchema,
    title: z.string().min(1, "Başlık zorunlu").max(200),
    orderNo: z.coerce.number().int().nonnegative().optional(),
});

/** Eğitim konusu güncelleme şeması */
export const updateTrainingTopicSchema = z.object({
    id: uuidSchema,
    title: z.string().min(1).max(200).optional(),
    orderNo: z.coerce.number().int().nonnegative().optional(),
    isActive: z.boolean().optional(),
});

// ============================================
// Eğitmen Şemaları
// ============================================

/** Eğitmen oluşturma şeması */
export const createTrainerSchema = z.object({
    sicilNo: sicilNoSchema,
    fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalı").max(100),
});

/** Eğitmen güncelleme şeması */
export const updateTrainerSchema = z.object({
    id: uuidSchema,
    sicilNo: sicilNoSchema.optional(),
    fullName: z.string().min(2).max(100).optional(),
    isActive: z.boolean().optional(),
});

// ============================================
// Katılım Şemaları
// ============================================

/** Katılım oluşturma şeması */
export const createAttendanceSchema = z.object({
    sicil_nos: z.array(sicilNoSchema).min(1, "En az bir personel seçilmeli"),
    training_id: uuidSchema,
    training_topic_id: uuidSchema.optional(),
    trainer_id: uuidSchema,
    ic_dis_egitim: icDisEnum,
    egitim_yeri: z.string().min(1, "Eğitim yeri zorunlu").max(100),
    baslama_tarihi: dateSchema,
    bitis_tarihi: dateSchema,
    baslama_saati: timeSchema,
    bitis_saati: timeSchema,
    sonuc_belgesi_turu: documentTypeEnum,
    egitim_detayli_aciklama: z.string().max(1000).optional(),
}).refine((data) => {
    // Bitiş tarihi başlangıç tarihinden önce olamaz
    return data.bitis_tarihi >= data.baslama_tarihi;
}, {
    message: "Bitiş tarihi başlangıç tarihinden önce olamaz",
    path: ["bitis_tarihi"],
});

/** Katılım sorgu şeması */
export const attendanceQuerySchema = z.object({
    search: z.string().max(100).optional(),
    trainingCode: z.string().max(20).optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    grup: z.string().max(50).optional(),
    personelDurumu: personnelStatusEnum.optional(),
});

// ============================================
// Import Şemaları
// ============================================

/** Personel import satır şeması */
export const personnelImportRowSchema = z.object({
    sicilNo: sicilNoSchema,
    fullName: z.string().min(2).max(100),
    tcKimlikNo: tcKimlikNoSchema.optional(),
    gorevi: z.string().max(100).optional(),
    projeAdi: z.string().max(100).optional(),
    grup: z.string().max(50).optional(),
    personelDurumu: personnelStatusEnum.optional(),
    cinsiyet: genderEnum.optional(),
    telefon: phoneSchema.optional(),
    dogumTarihi: dateSchema.optional(),
    adres: z.string().max(500).optional(),
});

/** Katılım import satır şeması */
export const attendanceImportRowSchema = z.object({
    sicilNo: sicilNoSchema,
    egitimKodu: z.string().min(2).max(20),
    baslamaTarihi: dateSchema,
    bitisTarihi: dateSchema.optional(),
    baslamaSaati: timeSchema.optional(),
    bitisSaati: timeSchema.optional(),
    egitimYeri: z.string().max(100).optional(),
    icDisEgitim: icDisEnum.optional(),
    sonucBelgesiTuru: documentTypeEnum.optional(),
    egitmenSicil: sicilNoSchema.optional(),
});

/** Genel import veri şeması */
export const importDataSchema = z.object({
    data: z.array(z.record(z.string(), z.any())).min(1, "En az bir kayıt olmalı").max(10000, "En fazla 10000 kayıt import edilebilir"),
});

// ============================================
// Tanım Şemaları
// ============================================

/** Tanım oluşturma şeması (grup, lokasyon, belge) */
export const createDefinitionSchema = z.object({
    name: z.string().min(1, "İsim zorunlu").max(100),
    description: z.string().max(500).optional(),
});

/** Tanım güncelleme şeması */
export const updateDefinitionSchema = z.object({
    id: uuidSchema,
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    isActive: z.boolean().optional(),
});

// ============================================
// Rapor Sorgu Şemaları
// ============================================

/** Aylık rapor sorgu şeması */
export const monthlyReportQuerySchema = z.object({
    year: z.coerce.number().int().min(2020).max(2100).default(new Date().getFullYear()),
    month: z.coerce.number().int().min(1).max(12).default(new Date().getMonth() + 1),
});

/** Yıllık rapor sorgu şeması */
export const yearlyReportQuerySchema = z.object({
    year: z.coerce.number().int().min(2020).max(2100).default(new Date().getFullYear()),
});

// ============================================
// Tip Export'ları
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreatePersonnelInput = z.infer<typeof createPersonnelSchema>;
export type CreateTrainingInput = z.infer<typeof createTrainingSchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type PersonnelQueryInput = z.infer<typeof personnelQuerySchema>;
