/**
 * Personnel Lookup API
 * POST /api/personnel/lookup
 * Returns personnel details for given sicil numbers
 * Accessible by both CHEF and ADMIN
 */

import { NextRequest, NextResponse } from "next/server";
import { db, personnel } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { inArray } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: "Oturum açmanız gerekiyor" }, { status: 401 });
        }

        const body = await request.json();
        const sicilNos: string[] = body.sicil_nos || [];

        if (sicilNos.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Limit to prevent abuse
        if (sicilNos.length > 100) {
            return NextResponse.json({ success: false, message: "En fazla 100 sicil sorgulanabilir" }, { status: 400 });
        }

        // Fetch personnel by sicil numbers
        const result = await db.select({
            sicil_no: personnel.sicilNo,
            fullName: personnel.fullName,
            gorevi: personnel.gorevi,
            grup: personnel.grup,
        })
            .from(personnel)
            .where(inArray(personnel.sicilNo, sicilNos));

        return NextResponse.json({
            success: true,
            data: result,
        });

    } catch (error) {
        console.error("Personnel lookup error:", error);
        return NextResponse.json({ success: false, message: "Hata oluştu" }, { status: 500 });
    }
}
