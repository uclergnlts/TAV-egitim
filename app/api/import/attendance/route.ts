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
import { checkRateLimit, getClientIP, RateLimitPresets } from "@/lib/rateLimit";

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

interface ImportError {
    row: number;
    message: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function normalizeDate(value: string | undefined): string {
    if (!value) return "";
    const s = String(value).trim();
    if (DATE_RE.test(s)) return s;
    const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!m) return "";
    
    let day = parseInt(m[1]);
    let month = parseInt(m[2]);
    let year = parseInt(m[3]);

    // Handle corrupted year format (e.g., 6024 -> 2024, 6025 -> 2025)
    if (year >= 6000 && year <= 6999) {
        year = year - 4000; // 6024 -> 2024, 6025 -> 2025
    }

    // Handle invalid day (0 or > 31)
    if (day === 0 || day > 31) {
        day = 1; // Default to 1st of month
    }

    // Handle invalid month (0 or > 12)
    if (month === 0 || month > 12) {
        month = 1; // Default to January
    }

    const d = String(day).padStart(2, "0");
    const mo = String(month).padStart(2, "0");
    const y = String(year);
    return `${y}-${mo}-${d}`;
}

function normalizeTime(value: string | undefined, fallback: string): string {
    if (!value) return fallback;
    const s = String(value).trim();
    if (TIME_RE.test(s)) return s;
    const m = s.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return fallback;
    return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function normalizeIcDis(value: string | undefined): "IC" | "DIS" {
    const s = (value ?? "").toLowerCase();
    if (s.includes("dis") || s.includes("dış") || s === "d") {
        return "DIS";
    }
    return "IC";
}

function normalizeDocumentType(value: string | undefined): "EGITIM_KATILIM_CIZELGESI" | "SERTIFIKA" | undefined {
    if (!value) return undefined;
    const s = value.toLowerCase();
    if (s.includes("sertifika")) return "SERTIFIKA";
    if (s.includes("katilim") || s.includes("katılım") || s.includes("cizelge") || s.includes("çizelge")) {
        return "EGITIM_KATILIM_CIZELGESI";
    }
    if (value === "EGITIM_KATILIM_CIZELGESI" || value === "SERTIFIKA") {
        return value;
    }
    return undefined;
}

export async function POST(request: NextRequest) {
    try {
        const clientIP = getClientIP(request);
        const rateLimitResult = checkRateLimit(`import:attendance:${clientIP}`, RateLimitPresets.export);

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { success: false, message: "Çok fazla import isteği. Lütfen bir süre bekleyin." },
                {
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
                        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
                        "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
                    },
                }
            );
        }

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
            errors: [] as ImportError[],
        };

        for (let i = 0; i < rows.length; i++) {
            const rowNo = i + 1;
            const row = rows[i];

            try {
                const sicilNo = String(row.sicilNo ?? "").trim();
                const egitimKodu = String(row.egitimKodu ?? "").trim();
                const baslamaTarihi = normalizeDate(row.baslamaTarihi);
                const bitisTarihi = normalizeDate(row.bitisTarihi) || baslamaTarihi;
                const baslamaSaati = normalizeTime(row.baslamaSaati, "09:00");
                const bitisSaati = normalizeTime(row.bitisSaati, "17:00");

                if (!sicilNo || !egitimKodu || !baslamaTarihi) {
                    results.errors.push({ row: rowNo, message: "Sicil No, Egitim Kodu veya Baslama Tarihi eksik/gecersiz" });
                    continue;
                }

                const personelData = await db.query.personnel.findFirst({
                    where: eq(personnel.sicilNo, sicilNo),
                });
                if (!personelData) {
                    results.errors.push({ row: rowNo, message: `${sicilNo}: Personel bulunamadi` });
                    continue;
                }

                const trainingData = await db.query.trainings.findFirst({
                    where: eq(trainings.code, egitimKodu),
                });
                if (!trainingData) {
                    results.errors.push({ row: rowNo, message: `${sicilNo}: Egitim kodu (${egitimKodu}) bulunamadi` });
                    continue;
                }

                const year = getYear(baslamaTarihi);
                const month = getMonth(baslamaTarihi);
                if (!Number.isFinite(year) || !Number.isFinite(month)) {
                    results.errors.push({ row: rowNo, message: `${sicilNo}: Tarih formati gecersiz` });
                    continue;
                }

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

                let trainerId: string | null = null;
                const trainerSicil = String(row.egitmenSicil ?? "").trim();
                if (trainerSicil) {
                    const trainerData = await db.query.trainers.findFirst({
                        where: eq(trainers.sicilNo, trainerSicil),
                    });
                    if (trainerData) trainerId = trainerData.id;
                }

                const normalizedDocType =
                    normalizeDocumentType(row.sonucBelgesiTuru) ||
                    trainingData.defaultDocumentType ||
                    "EGITIM_KATILIM_CIZELGESI";

                await db.insert(attendances).values({
                    personelId: personelData.id,
                    trainingId: trainingData.id,
                    trainerId,

                    sicilNo: personelData.sicilNo,
                    adSoyad: personelData.fullName,
                    tcKimlikNo: personelData.tcKimlikNo,
                    gorevi: personelData.gorevi,
                    projeAdi: personelData.projeAdi,
                    grup: personelData.grup,
                    personelDurumu: personelData.personelDurumu,

                    egitimKodu: trainingData.code,

                    baslamaTarihi,
                    bitisTarihi,
                    baslamaSaati,
                    bitisSaati,

                    egitimSuresiDk: trainingData.durationMin,
                    egitimYeri: row.egitimYeri || trainingData.defaultLocation || "Bilinmiyor",
                    icDisEgitim: normalizeIcDis(row.icDisEgitim),
                    sonucBelgesiTuru: normalizedDocType,

                    veriGirenSicil: session.sicilNo,
                    veriGirenAdSoyad: session.fullName,

                    year,
                    month,
                });

                results.created++;
            } catch (error) {
                const message = error instanceof Error ? error.message : "Bilinmeyen hata";
                results.errors.push({ row: rowNo, message });
            }
        }

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
            message: `${results.created} kayıt oluşturuldu, ${results.skipped} kayıt atlandı.`,
            data: results,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Bilinmeyen hata";
        return NextResponse.json({ success: false, message: `Import hatası: ${message}` }, { status: 500 });
    }
}

