/**
 * Bulk Attendance Insert API
 * POST /api/attendances/bulk
 * Yetki: ŞEF (veya ADMIN)
 */

import { NextResponse } from "next/server";
import { db, attendances } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

// Tekil kayıt şeması (Validation için)
const attendanceItemSchema = z.object({
    sicil_no: z.string().min(1),
    training_id: z.string().min(1),
    training_topic_id: z.string().optional().nullable(),
    trainer_id: z.string().min(1),
    ic_dis_egitim: z.enum(["IC", "DIS"]),
    egitim_yeri: z.string().min(1),
    baslama_tarihi: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    bitis_tarihi: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    baslama_saati: z.string().regex(/^\d{2}:\d{2}$/),
    bitis_saati: z.string().regex(/^\d{2}:\d{2}$/),
    sonuc_belgesi_turu: z.string().optional(),
    egitim_detayli_aciklama: z.string().optional().default(""),
});

const bulkSchema = z.array(attendanceItemSchema);

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: "Yetkisiz erişim" }, { status: 401 });
        }

        const body = await req.json();

        // Zod Validation
        const validation = bulkSchema.safeParse(body);
        if (!validation.success) {
            console.error("Validation error:", validation.error);
            return NextResponse.json({ success: false, message: "Veri formatı hatalı", errors: validation.error.format() }, { status: 400 });
        }

        const records = validation.data;

        if (records.length === 0) {
            return NextResponse.json({ success: false, message: "Kayıt listesi boş olamaz" }, { status: 400 });
        }

        // 1. Veritabanından gerekli bilgileri çekelim
        // Unique Sicil Noları topla
        const uniqueSicils = Array.from(new Set(records.map(r => r.sicil_no)));

        // Personel bilgilerini çek
        const personnelList = await db.query.personnel.findMany({
            where: (p, { inArray }) => inArray(p.sicilNo, uniqueSicils)
        });

        const personnelMap = new Map(personnelList.map(p => [p.sicilNo, p]));

        // Training bilgilerini çek (Kod, Ad, Kategori vb snapshot için)
        const uniqueTrainingIds = Array.from(new Set(records.map(r => r.training_id)));
        const trainingList = await db.query.trainings.findMany({
            where: (t, { inArray }) => inArray(t.id, uniqueTrainingIds)
        });
        const trainingMap = new Map(trainingList.map(t => [t.id, t]));

        // Topic bilgilerini çek
        const uniqueTopicIds = Array.from(new Set(records.map(r => r.training_topic_id).filter(Boolean) as string[]));
        let topicMap = new Map();
        if (uniqueTopicIds.length > 0) {
            const topicList = await db.query.trainingTopics.findMany({
                where: (tt, { inArray }) => inArray(tt.id, uniqueTopicIds)
            });
            topicMap = new Map(topicList.map(tt => [tt.id, tt]));
        }

        // Trainer bilgilerini çek
        const uniqueTrainerIds = Array.from(new Set(records.map(r => r.trainer_id)));
        const trainerList = await db.query.trainers.findMany({
            where: (t, { inArray }) => inArray(t.id, uniqueTrainerIds)
        });
        const trainerMap = new Map(trainerList.map(t => [t.id, t]));

        const insertValues: any[] = [];
        const errors: string[] = [];

        // Kayıtları hazırla
        for (const record of records) {
            const person = personnelMap.get(record.sicil_no);
            if (!person) {
                errors.push(`Sicil Bulunamadı: ${record.sicil_no}`);
                continue;
            }

            const training = trainingMap.get(record.training_id);
            if (!training) {
                errors.push(`Eğitim Bulunamadı: ${record.training_id}`);
                continue;
            }

            const trainer = trainerMap.get(record.trainer_id);

            const topic = record.training_topic_id ? topicMap.get(record.training_topic_id) : null;

            // Süre hesabı
            const start = new Date(`${record.baslama_tarihi}T${record.baslama_saati}`);
            const end = new Date(`${record.bitis_tarihi}T${record.bitis_saati}`);
            const diffMs = end.getTime() - start.getTime();
            const diffMin = Math.round(diffMs / 60000);

            // Veri hazırlığı
            insertValues.push({
                personelId: person.id,
                trainingId: training.id,
                trainingTopicId: topic?.id || null,
                trainerId: trainer?.id || null,

                // Personel Snapshot
                sicilNo: person.sicilNo,
                adSoyad: person.fullName,
                tcKimlikNo: person.tcKimlikNo,
                gorevi: person.gorevi,
                projeAdi: person.projeAdi,
                grup: person.grup,
                personelDurumu: person.personelDurumu,

                // Eğitim Snapshot
                egitimKodu: training.code,
                egitimAltBasligi: topic?.title || null,

                // Zaman
                baslamaTarihi: record.baslama_tarihi,
                bitisTarihi: record.bitis_tarihi,
                baslamaSaati: record.baslama_saati,
                bitisSaati: record.bitis_saati,
                egitimSuresiDk: diffMin > 0 ? diffMin : 0,

                // Detaylar
                egitimYeri: record.egitim_yeri,
                icDisEgitim: record.ic_dis_egitim,
                sonucBelgesiTuru: record.sonuc_belgesi_turu || "EGITIM_KATILIM_CIZELGESI", // Varsayılan
                egitimDetayliAciklama: record.egitim_detayli_aciklama,

                // Meta
                veriGirenSicil: session.sicilNo,
                veriGirenAdSoyad: session.fullName,
                year: parseInt(record.baslama_tarihi.split("-")[0]),
                month: parseInt(record.baslama_tarihi.split("-")[1]),
            });
        }

        if (insertValues.length > 0) {
            // Bulk Insert
            try {
                await db.insert(attendances).values(insertValues);
            } catch (dbError: any) {
                console.error("DB Insert Error:", dbError);
                // Check unique constraint violations
                if (dbError.code === "SQLITE_CONSTRAINT" || dbError.message?.includes("UNIQUE")) {
                    return NextResponse.json({
                        success: false,
                        message: "Bazı kayıtlar zaten mevcut (Mükerrer Kayıt Hatası). Lütfen kontrol ediniz.",
                        errors: ["Aynı personel, aynı eğitim ve aynı yıl için birden fazla kayıt olamaz."]
                    }, { status: 400 });
                }
                throw dbError; // Diğer hatalar catch bloğuna düşsün
            }
        }

        return NextResponse.json({
            success: true,
            message: `${insertValues.length} kayıt başarıyla veri tabanına eklendi.`,
            data: {
                success_count: insertValues.length,
                error_count: errors.length,
                errors: errors
            }
        });

    } catch (error) {
        console.error("Bulk insert server error:", error);
        return NextResponse.json({ success: false, message: "Sunucu hatası" }, { status: 500 });
    }
}
