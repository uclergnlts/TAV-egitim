/**
 * Personel Arama API
 * GET /api/personnel/search?query=...
 * Referans: 13-API-SPEC.md
 * Yetki: ŞEF, ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { db, personnel } from "@/lib/db";
import { or, like } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        // Oturum kontrolü
        const session = await getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, message: "Oturum açmanız gerekiyor" },
                { status: 401 }
            );
        }

        // Query parametresi al
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get("query") || "";

        if (query.length < 2) {
            return NextResponse.json({
                success: true,
                data: [],
            });
        }

        // Personel ara (sicil_no veya ad_soyad ile)
        // SQLite like is case-insensitive for ASCII by default
        const results = await db
            .select({
                id: personnel.id,
                sicil_no: personnel.sicilNo,
                full_name: personnel.fullName,
                tc_kimlik_no: personnel.tcKimlikNo,
                gorevi: personnel.gorevi,
                proje_adi: personnel.projeAdi,
                grup: personnel.grup,
                personel_durumu: personnel.personelDurumu,
            })
            .from(personnel)
            .where(
                or(
                    like(personnel.sicilNo, `%${query}%`),
                    like(personnel.fullName, `%${query}%`)
                )
            )
            .limit(20);

        return NextResponse.json({
            success: true,
            data: results,
        });
    } catch (error) {
        console.error("Personnel search error:", error);
        return NextResponse.json(
            { success: false, message: "Bir hata oluştu" },
            { status: 500 }
        );
    }
}
