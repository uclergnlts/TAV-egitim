/**
 * Aylık Rapor API
 * GET /api/reports/monthly?year=2026&month=5
 * Yetki: ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { db, attendances } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        // Oturum kontrolü - Sadece ADMIN
        const session = await getSession();
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Bu işlem için yetkiniz yok" },
                { status: 403 }
            );
        }

        // Query parametreleri
        const searchParams = request.nextUrl.searchParams;
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

        // Validasyon
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            return NextResponse.json(
                { success: false, message: "Geçersiz yıl veya ay parametresi" },
                { status: 400 }
            );
        }

        // Aylık kayıtları getir (07-MONTHLY-GENERAL-TABLE.md'ye göre)
        const rows = await db
            .select({
                id: attendances.id,
                sicil_no: attendances.sicilNo,
                ad_soyad: attendances.adSoyad,
                tc_kimlik_no: attendances.tcKimlikNo,
                gorevi: attendances.gorevi,
                proje_adi: attendances.projeAdi,
                grup: attendances.grup,
                egitim_kodu: attendances.egitimKodu,
                egitim_alt_basligi: attendances.egitimAltBasligi,
                baslama_tarihi: attendances.baslamaTarihi,
                bitis_tarihi: attendances.bitisTarihi,
                baslama_saati: attendances.baslamaSaati,
                bitis_saati: attendances.bitisSaati,
                egitim_suresi_dk: attendances.egitimSuresiDk,
                egitim_yeri: attendances.egitimYeri,
                ic_dis_egitim: attendances.icDisEgitim,
                sonuc_belgesi_turu: attendances.sonucBelgesiTuru,
                egitim_detayli_aciklama: attendances.egitimDetayliAciklama,
                veri_giren_sicil: attendances.veriGirenSicil,
                veri_giren_ad_soyad: attendances.veriGirenAdSoyad,
                veri_giris_tarihi: attendances.createdAt,
                personel_durumu: attendances.personelDurumu,
            })
            .from(attendances)
            .where(and(eq(attendances.year, year), eq(attendances.month, month)))
            .orderBy(attendances.baslamaTarihi, attendances.baslamaSaati, attendances.adSoyad);

        // Toplamlar
        const totals = await db
            .select({
                total_participation: sql<number>`CAST(count(*) AS INTEGER)`,
                total_minutes: sql<number>`CAST(coalesce(sum(${attendances.egitimSuresiDk}), 0) AS INTEGER)`,
            })
            .from(attendances)
            .where(and(eq(attendances.year, year), eq(attendances.month, month)));

        return NextResponse.json({
            success: true,
            data: {
                rows,
                total_participation: totals[0]?.total_participation || 0,
                total_minutes: totals[0]?.total_minutes || 0,
            },
        });
    } catch (error) {
        console.error("Monthly report error:", error);
        return NextResponse.json(
            { success: false, message: "Bir hata oluştu" },
            { status: 500 }
        );
    }
}
