/**
 * Login API Endpoint
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { checkRateLimit, getClientIP, RateLimitPresets } from "@/lib/rateLimit";
import { validateBody } from "@/lib/validationMiddleware";
import { loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
    try {
        // Rate limiting kontrolü (IP bazlı)
        const clientIP = getClientIP(request);
        const rateLimitResult = checkRateLimit(`login:${clientIP}`, RateLimitPresets.strict);
        
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Çok fazla giriş denemesi. Lütfen bir süre bekleyin.",
                },
                { 
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
                    }
                }
            );
        }

        // Zod validasyonu
        const validation = await validateBody(request, loginSchema);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, message: validation.error },
                { status: 400 }
            );
        }

        const { sicil_no, password } = validation.data;

        // Login işlemi
        const result = await login(sicil_no, password);

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
    } catch {
        return NextResponse.json(
            {
                success: false,
                message: "Beklenmeyen bir hata oluştu",
            },
            { status: 500 }
        );
    }
}
