/**
 * Session API Endpoint
 * GET /api/auth/session
 * Mevcut oturum bilgisini döner
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Oturum bulunamadı",
                    authenticated: false,
                },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            authenticated: true,
            user: {
                id: session.userId,
                sicil_no: session.sicilNo,
                full_name: session.fullName,
                role: session.role,
            },
        });
    } catch (error) {
        console.error("Session API error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Beklenmeyen bir hata oluştu",
                authenticated: false,
            },
            { status: 500 }
        );
    }
}
