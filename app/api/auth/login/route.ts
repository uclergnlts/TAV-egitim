/**
 * Login API Endpoint
 * POST /api/auth/login
 * Referans: 13-API-SPEC.md
 */

import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sicil_no, password } = body;

        // Validasyon
        if (!sicil_no || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Sicil numarası ve şifre zorunludur",
                },
                { status: 400 }
            );
        }

        // Login işlemi
        console.log("Attempting login for:", sicil_no);
        const result = await login(sicil_no, password);
        console.log("Login result:", result);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: result.message,
                },
                { status: 401 }
            );
        }

        // Başarılı giriş
        await logAction({
            userId: result.user?.id!,
            userRole: result.user?.role as "ADMIN" | "CHEF",
            actionType: "LOGIN",
            entityType: "user",
            entityId: result.user?.id!,
            newValue: { login_time: new Date().toISOString() }
        });

        return NextResponse.json({
            success: true,
            message: result.message,
            role: result.user?.role,
            full_name: result.user?.fullName,
        });
    } catch (error: any) {
        console.error("Login API error details:", {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });

        return NextResponse.json(
            {
                success: false,
                message: "Beklenmeyen bir hata oluştu: " + (error?.message || "Bilinmeyen hata"),
            },
            { status: 500 }
        );
    }
}
