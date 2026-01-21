
import { NextResponse } from "next/server";
import { db, attendances, trainings, trainers } from "@/lib/db";
import { eq, and, like, desc, gte, lte, or, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
    try {
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

        const filters = [];

        if (search) {
            filters.push(or(
                like(attendances.adSoyad, `%${search}%`),
                like(attendances.sicilNo, `%${search}%`)
            ));
        }

        if (trainingCode) {
            filters.push(like(attendances.egitimKodu, `%${trainingCode}%`));
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
            // 1. Personel Bilgileri
            sicilNo: attendances.sicilNo,
            adSoyad: attendances.adSoyad,
            tcKimlikNo: attendances.tcKimlikNo,
            gorevi: attendances.gorevi,
            projeAdi: attendances.projeAdi,
            grup: attendances.grup,

            // 2. Eğitim Bilgileri
            egitimKodu: attendances.egitimKodu,
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

            // 5. Kayıt (Audit) Bilgileri
            veriGirenSicil: attendances.veriGirenSicil,
            veriGirenAdSoyad: attendances.veriGirenAdSoyad,
            veriGirisTarihi: attendances.createdAt,

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
            .limit(2000);

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("Error fetching detailed report:", error);
        return NextResponse.json({ success: false, message: "Rapor alınamadı" }, { status: 500 });
    }
}
