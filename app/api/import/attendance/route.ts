/**
 * Attendance Import API
 * POST /api/import/attendance
 * Bulk import attendance records from Excel
 */

import { NextRequest, NextResponse } from "next/server";
import { db, attendances, personnel, trainings, trainers } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { getYear, getMonth } from "@/lib/utils";

interface AttendanceImportRow {
    sicilNo: string;
    egitimKodu: string;
    baslamaTarihi: string;
    bitisTarihi?: string;
    baslamaSaati?: string;
    bitisSaati?: string;
    egitimYeri?: string;
    icDisEgitim?: string;
    sonucBelgesiTuru?: string;
    egitmenSicil?: string;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ success: false, message: "Yetkisiz işlem" }, { status: 403 });
        }

        const body = await request.json();
        const rows: AttendanceImportRow[] = body.data;

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ success: false, message: "Veri bulunamadı" }, { status: 400 });
        }

        const results = {
            created: 0,
            skipped: 0,
            errors: [] as string[],
        };

        for (const row of rows) {
            try {
                if (!row.sicilNo || !row.egitimKodu || !row.baslamaTarihi) {
                    results.errors.push(`Geçersiz satır: Sicil No, Eğitim Kodu veya Başlama Tarihi eksik`);
                    continue;
                }

                // Find Personnel
                const personelData = await db.query.personnel.findFirst({
                    where: eq(personnel.sicilNo, row.sicilNo.toString().trim()),
                });

                if (!personelData) {
                    results.errors.push(`${row.sicilNo}: Personel bulunamadı`);
                    continue;
                }

                // Find Training
                const trainingData = await db.query.trainings.findFirst({
                    where: eq(trainings.code, row.egitimKodu.toString().trim()),
                });

                if (!trainingData) {
                    results.errors.push(`${row.sicilNo}: Eğitim kodu (${row.egitimKodu}) bulunamadı`);
                    continue;
                }

                const year = getYear(row.baslamaTarihi);
                const month = getMonth(row.baslamaTarihi);

                // Check Duplicate
                const existingAttendance = await db.query.attendances.findFirst({
                    where: and(
                        eq(attendances.personelId, personelData.id),
                        eq(attendances.trainingId, trainingData.id),
                        eq(attendances.year, year)
                    ),
                });

                if (existingAttendance) {
                    results.skipped++;
                    continue;
                }

                // Find Trainer (optional)
                let trainerId = null;
                if (row.egitmenSicil) {
                    const trainerData = await db.query.trainers.findFirst({
                        where: eq(trainers.sicilNo, row.egitmenSicil.toString().trim()),
                    });
                    if (trainerData) trainerId = trainerData.id;
                }

                // Insert
                await db.insert(attendances).values({
                    personelId: personelData.id,
                    trainingId: trainingData.id,
                    trainerId: trainerId,

                    sicilNo: personelData.sicilNo,
                    adSoyad: personelData.fullName,
                    tcKimlikNo: personelData.tcKimlikNo,
                    gorevi: personelData.gorevi,
                    projeAdi: personelData.projeAdi,
                    grup: personelData.grup,
                    personelDurumu: personelData.personelDurumu,

                    egitimKodu: trainingData.code,

                    baslamaTarihi: row.baslamaTarihi,
                    bitisTarihi: row.bitisTarihi || row.baslamaTarihi,
                    baslamaSaati: row.baslamaSaati || "09:00",
                    bitisSaati: row.bitisSaati || "17:00",

                    egitimSuresiDk: trainingData.durationMin,
                    egitimYeri: row.egitimYeri || trainingData.defaultLocation || "Bilinmiyor",
                    icDisEgitim: (row.icDisEgitim as any) || "IC",
                    sonucBelgesiTuru: (row.sonucBelgesiTuru || trainingData.defaultDocumentType || "EGITIM_KATILIM_CIZELGESI") as "EGITIM_KATILIM_CIZELGESI" | "SERTIFIKA",

                    veriGirenSicil: session.sicilNo,
                    veriGirenAdSoyad: session.fullName,

                    year,
                    month,
                });

                results.created++;

            } catch (err: any) {
                results.errors.push(`${row.sicilNo}: ${err.message}`);
            }
        }

        // Log Import Action
        await logAction({
            userId: session.userId,
            userRole: "ADMIN",
            actionType: "IMPORT",
            entityType: "import",
            entityId: `ATTENDANCE-IMPORT-${Date.now()}`,
            newValue: { created: results.created, skipped: results.skipped, errorCount: results.errors.length }
        });

        return NextResponse.json({
            success: true,
            message: `${results.created} kayıt oluşturuldu, ${results.skipped} kayıt atlandı (daha önce girilmiş).`,
            data: results
        });

    } catch (error: any) {
        console.error("Attendance import error:", error);
        return NextResponse.json({ success: false, message: "Import hatası: " + error.message }, { status: 500 });
    }
}
