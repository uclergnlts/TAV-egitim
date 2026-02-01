/**
 * API Hata Yönetimi
 * Standart hata yapısı ve yardımcı fonksiyonlar
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

// ============================================
// Tip Tanımları
// ============================================

/** Standart API hata yanıt yapısı */
export interface ApiErrorResponse {
    success: false;
    message: string;
    code?: string;
    errors?: Array<{
        path: string;
        message: string;
    }>;
    stack?: string; // Sadece geliştirme ortamında
}

// ============================================
// Özel Hata Sınıfı
// ============================================

/** API için özel hata sınıfı */
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code?: string,
        public errors?: Array<{ path: string; message: string }>
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// ============================================
// Hata İşleyicileri
// ============================================

/** Zod validasyon hatalarını işler */
export function handleZodError(error: ZodError): ApiErrorResponse {
    return {
        success: false,
        message: "Validasyon hatası",
        code: "VALIDATION_ERROR",
        errors: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
        })),
    };
}

/** Veritabanı hatalarını işler */
export function handleDatabaseError(error: Error): ApiErrorResponse {
    // Benzersiz alan hatası (duplicate)
    if (error.message.includes("UNIQUE constraint failed")) {
        const match = error.message.match(/UNIQUE constraint failed: (\w+)\.(\w+)/);
        const field = match ? match[2] : "field";

        return {
            success: false,
            message: `Bu ${field} zaten kullanımda`,
            code: "DUPLICATE_ERROR",
        };
    }

    // Foreign key hatası
    if (error.message.includes("FOREIGN KEY constraint failed")) {
        return {
            success: false,
            message: "İlişkili kayıt bulunamadı",
            code: "FOREIGN_KEY_ERROR",
        };
    }

    // Genel veritabanı hatası
    return {
        success: false,
        message: "Veritabanı hatası oluştu",
        code: "DATABASE_ERROR",
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    };
}

/** Kimlik doğrulama hatalarını işler */
export function handleAuthError(error: Error): ApiErrorResponse {
    return {
        success: false,
        message: error.message || "Kimlik doğrulama hatası",
        code: "AUTH_ERROR",
    };
}

/** Yetki hatalarını işler (403) */
export function handleForbiddenError(): ApiErrorResponse {
    return {
        success: false,
        message: "Bu işlem için yetkiniz yok",
        code: "FORBIDDEN",
    };
}

/** Bulunamadı hatalarını işler (404) */
export function handleNotFoundError(resource: string = "Kayıt"): ApiErrorResponse {
    return {
        success: false,
        message: `${resource} bulunamadı`,
        code: "NOT_FOUND",
    };
}

// ============================================
// Genel Hata Yönetimi
// ============================================

/** Tüm hata tiplerini yakalar ve yanıt döner */
export function handleError(error: unknown): NextResponse {
    console.error("API Error:", error);

    // Zod validasyon hatası
    if (error instanceof ZodError) {
        return NextResponse.json(handleZodError(error), { status: 400 });
    }

    // Özel API hatası
    if (error instanceof ApiError) {
        const response: ApiErrorResponse = {
            success: false,
            message: error.message,
            code: error.code,
            errors: error.errors,
        };

        if (process.env.NODE_ENV === "development" && error.stack) {
            response.stack = error.stack;
        }

        return NextResponse.json(response, { status: error.statusCode });
    }

    // Standart Error
    if (error instanceof Error) {
        // Veritabanı kısıtlama hatası
        if (error.message.includes("constraint failed")) {
            return NextResponse.json(handleDatabaseError(error), { status: 409 });
        }

        const response: ApiErrorResponse = {
            success: false,
            message: error.message || "Bir hata oluştu",
            code: "INTERNAL_ERROR",
        };

        if (process.env.NODE_ENV === "development") {
            response.stack = error.stack;
        }

        return NextResponse.json(response, { status: 500 });
    }

    // Bilinmeyen hata
    return NextResponse.json(
        {
            success: false,
            message: "Bilinmeyen bir hata oluştu",
            code: "UNKNOWN_ERROR",
        },
        { status: 500 }
    );
}

/**
 * API handler'ı hata yönetimi ile sarar
 * Otomatik try-catch uygular
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T
): T {
    return (async (...args: Parameters<T>): Promise<NextResponse> => {
        try {
            return await handler(...args);
        } catch (error) {
            return handleError(error);
        }
    }) as T;
}

// ============================================
// Yanıt Yardımcıları
// ============================================

/** Başarılı yanıt döner */
export function successResponse<T>(data: T, message?: string): NextResponse {
    return NextResponse.json({
        success: true,
        data,
        ...(message && { message }),
    });
}

/** Hata yanıtı döner */
export function errorResponse(
    message: string,
    statusCode: number = 500,
    code?: string
): NextResponse {
    return NextResponse.json(
        {
            success: false,
            message,
            code,
        },
        { status: statusCode }
    );
}
