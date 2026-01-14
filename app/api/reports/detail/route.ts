
import { NextResponse } from "next/server";
import { db, attendances, trainings } from "@/lib/db";
import { eq, and, like, desc, gte, lte, or } from "drizzle-orm";
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

        // Join with trainings to get training name if needed, 
        // though attendances serves as main record.
        // Select strict fields required by 06-DETAIL-TABLE-FINAL.md (21 columns)
        const result = await db.select({
            // 2.1 Personel Bilgileri
            sicilNo: attendances.sicilNo,
            adSoyad: attendances.adSoyad,
            tcKimlikNo: attendances.tcKimlikNo,
            gorevi: attendances.gorevi,
            projeAdi: attendances.projeAdi,
            grup: attendances.grup,
            personelDurumu: attendances.personelDurumu,

            // 2.2 Eğitim Bilgileri
            egitimKodu: attendances.egitimKodu,
            egitimAltBasligi: attendances.egitimAltBasligi,

            // 2.3 Zaman Bilgileri
            baslamaTarihi: attendances.baslamaTarihi,
            bitisTarihi: attendances.bitisTarihi,
            baslamaSaati: attendances.baslamaSaati,
            bitisSaati: attendances.bitisSaati,

            // 2.4 Eğitim Detay Bilgileri
            egitimSuresiDk: attendances.egitimSuresiDk,
            egitimYeri: attendances.egitimYeri,
            icDisEgitim: attendances.icDisEgitim,

            // 2.5 Belge & Açıklama
            sonucBelgesiTuru: attendances.sonucBelgesiTuru,
            egitimDetayliAciklama: attendances.egitimDetayliAciklama,

            // 2.6 Kayıt (Audit) Bilgileri
            veriGirenSicil: attendances.veriGirenSicil,
            veriGirenAdSoyad: attendances.veriGirenAdSoyad,
            veriGirisTarihi: attendances.createdAt,
        })
            .from(attendances)
            .where(filters.length > 0 ? and(...filters) : undefined)
            .orderBy(desc(attendances.baslamaTarihi))
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
