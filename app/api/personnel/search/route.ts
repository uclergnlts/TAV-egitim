/**
 * Personel Arama API
 * GET /api/personnel/search?query=...
 * Yetki: ŞEF, ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { db, personnel } from "@/lib/db";
import { or, like, eq } from "drizzle-orm";
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
        const query = (searchParams.get("query") || "").trim();

        if (query.length < 2) {
            return NextResponse.json({
                success: true,
                data: [],
            });
        }

        // Personel ara (sicil_no veya ad_soyad ile)
        // SQLite like is case-insensitive for ASCII by default
        const isNumeric = /^\d+$/.test(query);

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
                isNumeric
                    ? or(
                        eq(personnel.sicilNo, query),
                        eq(personnel.tcKimlikNo, query),
                        like(personnel.sicilNo, `${query}%`),
                        like(personnel.tcKimlikNo, `${query}%`)
                    )
                    : or(
                        like(personnel.fullName, `${query}%`),
                        like(personnel.fullName, `% ${query}%`),
                        like(personnel.sicilNo, `${query}%`)
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
