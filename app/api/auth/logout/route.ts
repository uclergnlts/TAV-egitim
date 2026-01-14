/**
 * Logout API Endpoint
 * POST /api/auth/logout
 */

import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        await logout();

        // Form submissions require a redirect, not JSON
        return NextResponse.redirect(new URL("/login", request.url));
    } catch (error) {
        console.error("Logout API error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Beklenmeyen bir hata oluştu",
            },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    return POST(request);
}
