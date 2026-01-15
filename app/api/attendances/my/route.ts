/**
 * Şef Kendi Kayıtları API
 * GET /api/attendances/my
 * Yetki: ŞEF
 */

import { NextResponse } from "next/server";
import { db, attendances } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        // Oturum kontrolü
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Oturum açmanız gerekiyor" },
                { status: 401 }
            );
        }

        // Sadece ŞEF kendi kayıtlarını görebilir
        if (session.role !== "CHEF") {
            return NextResponse.json(
                { success: false, message: "Bu işlem için yetkiniz yok" },
                { status: 403 }
            );
        }

        // Şefin girdiği kayıtları getir
        const myAttendances = await db
            .select({
                id: attendances.id,
                sicil_no: attendances.sicilNo,
                ad_soyad: attendances.adSoyad,
                egitim_kodu: attendances.egitimKodu,
                egitim_suresi_dk: attendances.egitimSuresiDk,
                baslama_tarihi: attendances.baslamaTarihi,
                veri_giris_tarihi: attendances.createdAt,
            })
            .from(attendances)
            .where(eq(attendances.veriGirenSicil, session.sicilNo))
            .orderBy(desc(attendances.createdAt))
            .limit(100);

        return NextResponse.json({
            success: true,
            data: myAttendances,
        });
    } catch (error) {
        console.error("My attendances error:", error);
        return NextResponse.json(
            { success: false, message: "Bir hata oluştu" },
            { status: 500 }
        );
    }
}
