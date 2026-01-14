/**
 * Seed Data Script - Turso/SQLite
 * Admin, Şef, Eğitmenler ve Örnek Eğitimler
 * 
 * Kullanım: npx tsx lib/db/seed.ts
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { hash } from "bcryptjs";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

async function seed() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        console.error("❌ TURSO_DATABASE_URL is not defined");
        process.exit(1);
    }

    const client = createClient({ url, authToken });
    const db = drizzle(client, { schema });

    console.log("🌱 Starting seed...\n");

    try {
        // ==================== 1. Kullanıcılar ====================
        console.log("👤 Creating users...");
        const adminPasswordHash = await hash("admin123", 10);
        const chefPasswordHash = await hash("sef123", 10);

        try {
            await db.insert(schema.users).values({
                sicilNo: "ADMIN001",
                fullName: "Sistem Yöneticisi",
                role: "ADMIN",
                passwordHash: adminPasswordHash,
                isActive: true,
            });
            console.log("   ✅ Admin created");
        } catch (e) { console.log("   ⏭️  Admin exists"); }

        try {
            await db.insert(schema.users).values({
                sicilNo: "SEF001",
                fullName: "Örnek Şef",
                role: "CHEF",
                passwordHash: chefPasswordHash,
                isActive: true,
            });
            console.log("   ✅ Chef created");
        } catch (e) { console.log("   ⏭️  Chef exists"); }

        // ==================== 2. Eğitmenler ====================
        console.log("\n🎓 Creating trainers...");
        const trainers = [
            { fullName: "Fatma Özkan", sicilNo: "EGT001" },
            { fullName: "Mehmet Yılmaz", sicilNo: "EGT002" },
            { fullName: "Ayşe Demir", sicilNo: "EGT003" },
            { fullName: "Ali Vural", sicilNo: "EGT004" },
        ];

        for (const trainer of trainers) {
            // Basit kontrol (sicilNo unique)
            const existing = await db.select().from(schema.trainers).where(sql`sicil_no = ${trainer.sicilNo}`).get();
            if (!existing) {
                await db.insert(schema.trainers).values({ fullName: trainer.fullName, sicilNo: trainer.sicilNo, isActive: true });
                console.log(`   ✅ Trainer: ${trainer.fullName}`);
            } else {
                console.log(`   ⏭️  Trainer ${trainer.fullName} exists`);
            }
        }

        // ==================== 3. Eğitimler ====================
        console.log("\n📚 Creating sample trainings...");

        const trainingsData = [
            {
                code: "M4", name: "Bilgi Tazeleme Eğitimi", durationMin: 40, category: "TEMEL",
                defaultLocation: "EGITIM_KURUMUNDA", defaultDocumentType: "EGITIM_KATILIM_CIZELGESI"
            },
            {
                code: "M40", name: "X-Ray Görüntü Analizi", durationMin: 60, category: "TEMEL",
                defaultLocation: "CIHAZ_BASINDA", defaultDocumentType: "SERTIFIKA"
            },
            {
                code: "T1", name: "Temel Güvenlik Eğitimi", durationMin: 120, category: "TEMEL",
                defaultLocation: "EGITIM_KURUMUNDA", defaultDocumentType: "SERTIFIKA"
            },
            {
                code: "T2", name: "Kriz Yönetimi", durationMin: 90, category: "TEMEL",
                defaultLocation: "EGITIM_KURUMUNDA", defaultDocumentType: "EGITIM_KATILIM_CIZELGESI"
            },
            {
                code: "T3", name: "İlk Yardım", durationMin: 180, category: "TEMEL",
                defaultLocation: "DIS_ALAN", defaultDocumentType: "SERTIFIKA"
            },
        ];

        for (const training of trainingsData) {
            try {
                await db.insert(schema.trainings).values({
                    code: training.code,
                    name: training.name,
                    durationMin: training.durationMin,
                    category: training.category as any,
                    defaultLocation: training.defaultLocation,
                    defaultDocumentType: training.defaultDocumentType as any,
                    isActive: true,
                });
                console.log(`   ✅ ${training.code}: ${training.name}`);
            } catch (e: any) {
                if (e.message?.includes("UNIQUE")) {
                    // Güncelleme yapalım (yeni alanlar için)
                    await db.update(schema.trainings)
                        .set({
                            defaultLocation: training.defaultLocation,
                            defaultDocumentType: training.defaultDocumentType as any
                        })
                        .where(sql`code = ${training.code}`);
                    console.log(`   🔄 ${training.code} updated`);
                } else throw e;
            }
        }

        // ==================== 4. M4 Alt Başlıkları ====================
        console.log("\n📑 Checks M4 topics...");
        const m4Training = await db.query.trainings.findFirst({
            where: (t, { eq }) => eq(t.code, "M4"),
        });

        if (m4Training) {
            const topics = ["Patlayıcı Tanıma", "Silah Tanıma", "Tehlikeli Madde Tanıma", "X-Ray Görüntü Okuma"];
            for (let i = 0; i < topics.length; i++) {
                try {
                    await db.insert(schema.trainingTopics).values({
                        trainingId: m4Training.id,
                        title: topics[i],
                        orderNo: i + 1,
                        isActive: true,
                    });
                    console.log(`   ✅ Topic: ${topics[i]}`);
                } catch (e) { console.log(`   ⏭️  Topic ${topics[i]} exists`); }
            }
        }

        // ==================== 5. Personeller ====================
        console.log("\n👥 Checks sample personnel...");
        const personnelData = [
            { sicilNo: "P001", fullName: "Ahmet Yılmaz", tcKimlikNo: "11111111110", gorevi: "X-Ray Operatörü", projeAdi: "TAV ESB", grup: "A" },
            { sicilNo: "P002", fullName: "Mehmet Kaya", tcKimlikNo: "22222222220", gorevi: "Kontrol Memuru", projeAdi: "TAV ESB", grup: "A" },
            { sicilNo: "P003", fullName: "Ayşe Demir", tcKimlikNo: "33333333330", gorevi: "X-Ray Operatörü", projeAdi: "TAV ESB", grup: "B" },
        ];

        for (const person of personnelData) {
            try {
                await db.insert(schema.personnel).values({ ...person, personelDurumu: "CALISAN" });
                console.log(`   ✅ ${person.sicilNo}`);
            } catch (e) { console.log(`   ⏭️  ${person.sicilNo} exists`); }
        }

        console.log("\n✅ Seed completed successfully!");

    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    }
}

seed();
