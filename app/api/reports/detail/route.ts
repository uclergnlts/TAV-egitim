
import { NextRequest, NextResponse } from "next/server";
import { db, attendances, trainings, trainers } from "@/lib/db";
import { eq, and, like, desc, gte, lte, or, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { checkRateLimit, getClientIP, RateLimitPresets } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
    try {
        // Rate limiting kontrolü
        const clientIP = getClientIP(request);
        const rateLimitResult = checkRateLimit(`reports:detail:${clientIP}`, RateLimitPresets.export);
        
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: "Çok fazla rapor isteği. Lütfen bir süre bekleyin." 
                },
                { 
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
                    }
                }
            );
        }

        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const trainingCode = searchParams.get("trainingCode") || "";
        const startDate = searchParams.get("startDate") || "";
        const endDate = searchParams.get("endDate") || "";
        const grup = searchParams.get("grup") || "";
        const personelDurumu = searchParams.get("personelDurumu") || "";
        const withTotal = searchParams.get("withTotal") === "1";
        const pageParam = parseInt(searchParams.get("page") || "1", 10);
        const limitParam = parseInt(searchParams.get("limit") || "2000", 10);
        const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
        const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 2000)) : 2000;
        const offset = (page - 1) * limit;

        const filters = [];

        if (search) {
            const normalizedSearch = search.trim();
            const isNumericSearch = /^\d+$/.test(normalizedSearch);

            filters.push(
                isNumericSearch
                    ? or(
                        eq(attendances.sicilNo, normalizedSearch),
                        eq(attendances.tcKimlikNo, normalizedSearch),
                        like(attendances.sicilNo, `${normalizedSearch}%`),
                        like(attendances.tcKimlikNo, `${normalizedSearch}%`)
                    )
                    : or(
                        like(attendances.adSoyad, `${normalizedSearch}%`),
                        like(attendances.adSoyad, `% ${normalizedSearch}%`),
                        like(attendances.sicilNo, `${normalizedSearch}%`)
                    )
            );
        }

        if (trainingCode) {
            const normalizedCode = trainingCode.trim();
            filters.push(
                or(
                    eq(attendances.egitimKoduYeni, normalizedCode),
                    eq(attendances.egitimKodu, normalizedCode),
                    like(attendances.egitimKoduYeni, `${normalizedCode}%`),
                    like(attendances.egitimKodu, `${normalizedCode}%`)
                )
            );
        }

        if (startDate) {
            filters.push(gte(attendances.baslamaTarihi, startDate));
        }

        if (endDate) {
            filters.push(lte(attendances.baslamaTarihi, endDate));
        }

        if (grup) {
            filters.push(eq(attendances.grup, grup));
        }

        if (personelDurumu) {
            filters.push(eq(attendances.personelDurumu, personelDurumu as "CALISAN" | "AYRILDI" | "IZINLI" | "PASIF"));
        }

        // Join with trainers to get trainer name
        // Select strict fields required by 06-DETAIL-TABLE-FINAL.md (21 columns)
        const result = await db.select({
            id: attendances.id,
            // 1. Personel Bilgileri
            sicilNo: attendances.sicilNo,
            adSoyad: attendances.adSoyad,
            tcKimlikNo: attendances.tcKimlikNo,
            yerlesim: attendances.yerlesim,
            organizasyon: attendances.organizasyon,
            sirketAdi: attendances.sirketAdi,
            gorevi: attendances.gorevi,
            vardiyaTipi: attendances.vardiyaTipi,
            projeAdi: attendances.projeAdi,
            grup: attendances.grup,
            terminal: attendances.terminal,
            bolgeKodu: attendances.bolgeKodu,

            // 2. Eğitim Bilgileri
            egitimKodu: attendances.egitimKodu,
            egitimKoduYeni: attendances.egitimKoduYeni,
            egitimAltBasligi: attendances.egitimAltBasligi,

            // 3. Zaman Bilgileri
            baslamaTarihi: attendances.baslamaTarihi,
            bitisTarihi: attendances.bitisTarihi,
            egitimSuresiDk: attendances.egitimSuresiDk,
            baslamaSaati: attendances.baslamaSaati,
            bitisSaati: attendances.bitisSaati,

            // 4. Eğitim Detay Bilgileri
            egitimYeri: attendances.egitimYeri,
            egitmenAdi: trainers.fullName,
            sonucBelgesiTuru: attendances.sonucBelgesiTuru,
            icDisEgitim: attendances.icDisEgitim,
            egitimDetayliAciklama: attendances.egitimDetayliAciklama,
            egitimTestSonucu: attendances.egitimTestSonucu,
            tazelemePlanlamaTarihi: attendances.tazelemePlanlamaTarihi,

            // 5. Kayıt (Audit) Bilgileri
            veriGirenSicil: attendances.veriGirenSicil,
            veriGirenAdSoyad: attendances.veriGirenAdSoyad,
            veriGirisTarihi: sql<string>`coalesce(${attendances.veriGirisTarihi}, ${attendances.createdAt})`,

            // 6. Personel Durumu
            personelDurumu: attendances.personelDurumu,
        })
            .from(attendances)
            .leftJoin(trainers, eq(attendances.trainerId, trainers.id))
            .where(filters.length > 0 ? and(...filters) : undefined)
            .orderBy(
                sql`CASE ${attendances.personelDurumu} WHEN 'CALISAN' THEN 0 WHEN 'IZINLI' THEN 1 WHEN 'PASIF' THEN 2 WHEN 'AYRILDI' THEN 3 ELSE 4 END`,
                desc(attendances.baslamaTarihi),
                attendances.adSoyad
            )
            .limit(limit)
            .offset(offset);

        let total: number | null = null;
        if (withTotal) {
            const totalCountRows = await db
                .select({ count: sql<number>`count(*)` })
                .from(attendances)
                .where(filters.length > 0 ? and(...filters) : undefined);
            total = Number(totalCountRows[0]?.count ?? 0);
        }

        return NextResponse.json({
            success: true,
            data: result,
            pagination: {
                total,
                page,
                limit,
                totalPages: total === null ? null : Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error("Error fetching detailed report:", error);
        return NextResponse.json({ success: false, message: "Rapor alınamadı" }, { status: 500 });
    }
}
