/**
 * TAV Eğitim Paneli - Veritabanı Şeması (Turso/SQLite)
 * Referans: doc/11-DB-SCHEMA.md
 */

import {
    sqliteTable,
    text,
    integer,
    index,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// ==================== TABLES ====================

/**
 * 1) users - Sisteme giriş yapan kullanıcılar (Şef ve Admin)
 */
export const users = sqliteTable(
    "users",
    {
        id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
        sicilNo: text("sicil_no").notNull(),
        fullName: text("full_name").notNull(),
        role: text("role", { enum: ["CHEF", "ADMIN"] }).notNull(),
        passwordHash: text("password_hash").notNull(),
        isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
        updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    },
    (table) => ({
        sicilNoIdx: uniqueIndex("users_sicil_no_idx").on(table.sicilNo),
    })
);

/**
 * 2) personnel - Eğitim alan personel listesi
 */
export const personnel = sqliteTable(
    "personnel",
    {
        id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
        sicilNo: text("sicil_no").notNull(),
        fullName: text("full_name").notNull(),
        tcKimlikNo: text("tc_kimlik_no").notNull(),
        gorevi: text("gorevi").notNull(),
        projeAdi: text("proje_adi").notNull(),
        grup: text("grup").notNull(),
        personelDurumu: text("personel_durumu", {
            enum: ["CALISAN", "AYRILDI", "IZINLI", "PASIF"]
        }).default("CALISAN").notNull(),

        // Yeni eklenen alanlar
        cinsiyet: text("cinsiyet", { enum: ["ERKEK", "KADIN"] }),
        telefon: text("telefon"),
        dogumTarihi: text("dogum_tarihi"),
        adres: text("adres"),

        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
        updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    },
    (table) => ({
        sicilNoIdx: uniqueIndex("personnel_sicil_no_idx").on(table.sicilNo),
    })
);

/**
 * 3) trainers - Eğitmenler
 */
export const trainers = sqliteTable(
    "trainers",
    {
        id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
        sicilNo: text("sicil_no").notNull(),
        fullName: text("full_name").notNull(),
        isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    },
    (table) => ({
        sicilNoIdx: uniqueIndex("trainers_sicil_no_idx").on(table.sicilNo),
    })
);


/**
 * 4) trainings - Eğitim kataloğu
 */
export const trainings = sqliteTable(
    "trainings",
    {
        id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
        code: text("code").notNull(),
        name: text("name").notNull(),
        description: text("description"), // Opsiyonel
        durationMin: integer("duration_min").notNull(),
        category: text("category", {
            enum: ["TEMEL", "TAZELEME", "DIGER"]
        }).default("TEMEL").notNull(),

        // Yeni eklenen alanlar
        defaultLocation: text("default_location"),
        defaultDocumentType: text("default_document_type", {
            enum: ["EGITIM_KATILIM_CIZELGESI", "SERTIFIKA"]
        }),

        isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
        updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    },
    (table) => ({
        codeIdx: uniqueIndex("trainings_code_idx").on(table.code),
    })
);

/**
 * 5) training_topics - Eğitim alt başlıkları
 */
export const trainingTopics = sqliteTable(
    "training_topics",
    {
        id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
        trainingId: text("training_id").notNull().references(() => trainings.id),
        title: text("title").notNull(),
        orderNo: integer("order_no"),
        isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    },
    (table) => ({
        uniqueTitleIdx: uniqueIndex("training_topics_unique_idx").on(
            table.trainingId,
            table.title
        ),
    })
);

/**
 * 6) attendances - ANA TABLO - Detay katılım kayıtları
 */
export const attendances = sqliteTable(
    "attendances",
    {
        id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

        // Foreign keys
        personelId: text("personel_id").notNull().references(() => personnel.id),
        trainingId: text("training_id").notNull().references(() => trainings.id),
        trainingTopicId: text("training_topic_id").references(() => trainingTopics.id),
        trainerId: text("trainer_id").references(() => trainers.id), // Yeni eklendi

        // Personel snapshot
        sicilNo: text("sicil_no").notNull(),
        adSoyad: text("ad_soyad").notNull(),
        tcKimlikNo: text("tc_kimlik_no").notNull(),
        gorevi: text("gorevi").notNull(),
        projeAdi: text("proje_adi").notNull(),
        grup: text("grup").notNull(),
        personelDurumu: text("personel_durumu", {
            enum: ["CALISAN", "AYRILDI", "IZINLI", "PASIF"]
        }).notNull(),

        // Eğitim snapshot
        egitimKodu: text("egitim_kodu").notNull(),
        egitimAltBasligi: text("egitim_alt_basligi"),

        // Zaman bilgileri
        baslamaTarihi: text("baslama_tarihi").notNull(),
        bitisTarihi: text("bitis_tarihi").notNull(),
        baslamaSaati: text("baslama_saati").notNull(),
        bitisSaati: text("bitis_saati").notNull(),

        // Eğitim süresi SNAPSHOT
        egitimSuresiDk: integer("egitim_suresi_dk").notNull(),

        // Eğitim detayları
        egitimYeri: text("egitim_yeri").notNull(), // Enum kaldırıldı, serbest metin veya defaulttan gelecek
        icDisEgitim: text("ic_dis_egitim", { enum: ["IC", "DIS"] }).notNull(),
        sonucBelgesiTuru: text("sonuc_belgesi_turu", {
            enum: ["EGITIM_KATILIM_CIZELGESI", "SERTIFIKA"]
        }).notNull(),
        egitimDetayliAciklama: text("egitim_detayli_aciklama"),

        // Veri giren bilgisi
        veriGirenSicil: text("veri_giren_sicil").notNull(),
        veriGirenAdSoyad: text("veri_giren_ad_soyad").notNull(),

        // Otomatik hesaplanan
        year: integer("year").notNull(),
        month: integer("month").notNull(),

        // Timestamps
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
        updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    },
    (table) => ({
        uniqueAttendanceIdx: uniqueIndex("attendances_unique_idx").on(
            table.personelId,
            table.trainingId,
            table.year
        ),
        yearMonthIdx: index("idx_att_year_month").on(table.year, table.month),
        trainingYearIdx: index("idx_att_training_year").on(table.trainingId, table.year),
        personelYearIdx: index("idx_att_personel_year").on(table.personelId, table.year),
        sicilIdx: index("idx_att_sicil").on(table.sicilNo),
    })
);

/**
 * 7) imports - Import işlemleri log
 */
export const imports = sqliteTable("imports", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    fileName: text("file_name").notNull(),
    rowCount: integer("row_count").notNull(),
    successCount: integer("success_count").notNull(),
    failCount: integer("fail_count").notNull(),
    importedBy: text("imported_by").notNull().references(() => users.id),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * 8) import_errors - Hatalı import satırları
 */
export const importErrors = sqliteTable("import_errors", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    importId: text("import_id").notNull().references(() => imports.id),
    rowNumber: integer("row_number").notNull(),
    errorMessage: text("error_message").notNull(),
    rawData: text("raw_data"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * 9) audit_logs - Audit kayıtları
 */
export const auditLogs = sqliteTable("audit_logs", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id),
    userRole: text("user_role", { enum: ["CHEF", "ADMIN"] }).notNull(),
    actionType: text("action_type", {
        enum: ["CREATE", "UPDATE", "DELETE", "IMPORT", "LOGIN"]
    }).notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    actionTime: text("action_time").default(sql`CURRENT_TIMESTAMP`).notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
});

/**
 * 10) training_locations - Eğitim Yerleri Tanımları
 */
export const trainingLocations = sqliteTable("training_locations", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

/**
 * 11) document_types - Belge Türleri Tanımları
 */
export const documentTypes = sqliteTable("document_types", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ==================== RELATIONS ====================

export const usersRelations = relations(users, ({ many }) => ({
    attendances: many(attendances),
    imports: many(imports),
    auditLogs: many(auditLogs),
}));

export const personnelRelations = relations(personnel, ({ many }) => ({
    attendances: many(attendances),
}));

export const trainersRelations = relations(trainers, ({ many }) => ({
    attendances: many(attendances),
}));

export const trainingsRelations = relations(trainings, ({ many }) => ({
    attendances: many(attendances),
    topics: many(trainingTopics),
}));

export const trainingTopicsRelations = relations(
    trainingTopics,
    ({ one, many }) => ({
        training: one(trainings, {
            fields: [trainingTopics.trainingId],
            references: [trainings.id],
        }),
        attendances: many(attendances),
    })
);

export const attendancesRelations = relations(attendances, ({ one }) => ({
    personnel: one(personnel, {
        fields: [attendances.personelId],
        references: [personnel.id],
    }),
    training: one(trainings, {
        fields: [attendances.trainingId],
        references: [trainings.id],
    }),
    trainingTopic: one(trainingTopics, {
        fields: [attendances.trainingTopicId],
        references: [trainingTopics.id],
    }),
    trainer: one(trainers, {
        fields: [attendances.trainerId],
        references: [trainers.id],
    }),
}));

export const importsRelations = relations(imports, ({ one, many }) => ({
    importedByUser: one(users, {
        fields: [imports.importedBy],
        references: [users.id],
    }),
    errors: many(importErrors),
}));

export const importErrorsRelations = relations(importErrors, ({ one }) => ({
    import: one(imports, {
        fields: [importErrors.importId],
        references: [imports.id],
    }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id],
    }),
}));

// ==================== TYPES ====================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Personnel = typeof personnel.$inferSelect;
export type NewPersonnel = typeof personnel.$inferInsert;

export type Trainer = typeof trainers.$inferSelect;
export type NewTrainer = typeof trainers.$inferInsert;

export type Training = typeof trainings.$inferSelect;
export type NewTraining = typeof trainings.$inferInsert;

export type TrainingTopic = typeof trainingTopics.$inferSelect;
export type NewTrainingTopic = typeof trainingTopics.$inferInsert;

export type Attendance = typeof attendances.$inferSelect;
export type NewAttendance = typeof attendances.$inferInsert;

export type Import = typeof imports.$inferSelect;
export type NewImport = typeof imports.$inferInsert;

export type ImportError = typeof importErrors.$inferSelect;
export type NewImportError = typeof importErrors.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
