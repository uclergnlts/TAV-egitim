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
    adiSoyadi?: string;
    tcKimlikNo?: string;
    gorevi?: string;
    projeAdi?: string;
    calismaGrubu?: string;
    egitimKodu: string;
    egitimKoduYeni?: string;
    baslamaTarihi: string;
    bitisTarihi?: string;
    baslamaSaati?: string;
    bitisSaati?: string;
    egitimYeri?: string;
    icDisEgitim?: string;
    sonucBelgesiTuru?: string;
    egitmenSicil?: string;
    yerlesim?: string;
    organizasyon?: string;
    sirketAdi?: string;
    vardiyaTipi?: string;
    terminal?: string;
    bolgeKodu?: string;
    egitimDetayAciklama?: string;
    egitimDetayAciklamaYeni?: string;
    egitimTestSonucu?: string;
    tazelemePlanlamaTarihi?: string;
    veriyiGirenSicil?: string;
    veriGirisTarihi?: string;
    personelDurumu?: "CALISAN" | "AYRILDI" | "IZINLI" | "PASIF";
}

interface ImportError {
    row: number;
    message: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export function normalizeDate(value: string | undefined): string {
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

export function normalizeTime(value: string | undefined, fallback: string): string {
    if (!value) return fallback;
    const s = String(value).trim();
    if (TIME_RE.test(s)) return s;
    const m = s.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return fallback;
    return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export function normalizeDateTime(value: string | undefined): string | null {
    if (!value) return null;
    const s = String(value).trim();
    if (!s) return null;

    const normalizedDate = normalizeDate(s);
    if (normalizedDate) {
        const parsed = new Date(`${normalizedDate}T00:00:00.000Z`);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }

    const direct = new Date(s);
    if (!Number.isNaN(direct.getTime())) return direct.toISOString();
    return null;
}

export function normalizeIcDis(value: string | undefined): "IC" | "DIS" {
    const s = (value ?? "").toLowerCase();
    if (s.includes("dis") || s.includes("dış") || s === "d") {
        return "DIS";
    }
    return "IC";
}

export function normalizeDocumentType(value: string | undefined): "EGITIM_KATILIM_CIZELGESI" | "SERTIFIKA" | undefined {
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
            createdPersonnel: 0,
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
                    results.errors.push({ row: rowNo, message: "Sicil No, Eğitim Kodu veya Başlama Tarihi eksik/geçersiz" });
                    continue;
                }

                let personelData = await db.query.personnel.findFirst({
                    where: eq(personnel.sicilNo, sicilNo),
                });
                if (!personelData) {
                    await db.insert(personnel).values({
                        sicilNo,
                        fullName: String(row.adiSoyadi ?? "").trim() || `Sicil ${sicilNo}`,
                        tcKimlikNo: String(row.tcKimlikNo ?? "").trim() || "00000000000",
                        gorevi: String(row.gorevi ?? "").trim() || "BILINMIYOR",
                        projeAdi: String(row.projeAdi ?? "").trim() || "BILINMIYOR",
                        grup: String(row.calismaGrubu ?? "").trim() || "GENEL",
                        personelDurumu: row.personelDurumu || "CALISAN",
                    });
                    personelData = await db.query.personnel.findFirst({
                        where: eq(personnel.sicilNo, sicilNo),
                    });
                    if (!personelData) {
                        results.errors.push({ row: rowNo, message: `${sicilNo}: Personel bulunamadı` });
                        continue;
                    }
                    results.createdPersonnel++;
                }

                const trainingData = await db.query.trainings.findFirst({
                    where: eq(trainings.code, egitimKodu),
                });
                if (!trainingData) {
                    results.errors.push({ row: rowNo, message: `${sicilNo}: Eğitim kodu (${egitimKodu}) bulunamadı` });
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
                    adSoyad: String(row.adiSoyadi ?? "").trim() || personelData.fullName,
                    tcKimlikNo: String(row.tcKimlikNo ?? "").trim() || personelData.tcKimlikNo,
                    yerlesim: row.yerlesim || null,
                    organizasyon: row.organizasyon || null,
                    sirketAdi: row.sirketAdi || null,
                    gorevi: String(row.gorevi ?? "").trim() || personelData.gorevi,
                    vardiyaTipi: row.vardiyaTipi || null,
                    projeAdi: String(row.projeAdi ?? "").trim() || personelData.projeAdi,
                    grup: String(row.calismaGrubu ?? "").trim() || personelData.grup,
                    terminal: row.terminal || null,
                    bolgeKodu: row.bolgeKodu || null,
                    personelDurumu: row.personelDurumu || personelData.personelDurumu,

                    egitimKodu: trainingData.code,
                    egitimKoduYeni: row.egitimKoduYeni || trainingData.code,

                    baslamaTarihi,
                    bitisTarihi,
                    baslamaSaati,
                    bitisSaati,

                    egitimSuresiDk: trainingData.durationMin,
                    egitimYeri: row.egitimYeri || trainingData.defaultLocation || "Bilinmiyor",
                    icDisEgitim: normalizeIcDis(row.icDisEgitim),
                    sonucBelgesiTuru: normalizedDocType,
                    egitimDetayliAciklama: row.egitimDetayAciklamaYeni || row.egitimDetayAciklama || null,
                    egitimTestSonucu: row.egitimTestSonucu || null,
                    tazelemePlanlamaTarihi: row.tazelemePlanlamaTarihi || null,

                    veriGirenSicil: row.veriyiGirenSicil || session.sicilNo,
                    veriGirenAdSoyad: session.fullName,
                    veriGirisTarihi: normalizeDateTime(row.veriGirisTarihi) || new Date().toISOString(),

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
            message: `${results.created} kayıt oluşturuldu, ${results.skipped} kayıt atlandı, ${results.createdPersonnel} personel otomatik oluşturuldu.`,
            data: results,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Bilinmeyen hata";
        return NextResponse.json({ success: false, message: `Import hatası: ${message}` }, { status: 500 });
    }
}


