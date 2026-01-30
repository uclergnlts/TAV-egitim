/**
 * API Error Handler
 * Standardized error handling for API routes
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
    success: false;
    message: string;
    code?: string;
    errors?: Array<{
        path: string;
        message: string;
    }>;
    stack?: string; // Only in development
}

/**
 * Custom API Error class
 */
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

/**
 * Handle Zod validation errors
 */
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

/**
 * Handle database errors
 */
export function handleDatabaseError(error: Error): ApiErrorResponse {
    // SQLite unique constraint error
    if (error.message.includes("UNIQUE constraint failed")) {
        const match = error.message.match(/UNIQUE constraint failed: (\w+)\.(\w+)/);
        const field = match ? match[2] : "field";
        
        return {
            success: false,
            message: `Bu ${field} zaten kullanımda`,
            code: "DUPLICATE_ERROR",
        };
    }

    // Foreign key constraint error
    if (error.message.includes("FOREIGN KEY constraint failed")) {
        return {
            success: false,
            message: "İlişkili kayıt bulunamadı",
            code: "FOREIGN_KEY_ERROR",
        };
    }

    // Generic database error
    return {
        success: false,
        message: "Veritabanı hatası oluştu",
        code: "DATABASE_ERROR",
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    };
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: Error): ApiErrorResponse {
    return {
        success: false,
        message: error.message || "Kimlik doğrulama hatası",
        code: "AUTH_ERROR",
    };
}

/**
 * Handle authorization errors
 */
export function handleForbiddenError(): ApiErrorResponse {
    return {
        success: false,
        message: "Bu işlem için yetkiniz yok",
        code: "FORBIDDEN",
    };
}

/**
 * Handle not found errors
 */
export function handleNotFoundError(resource: string = "Kayıt"): ApiErrorResponse {
    return {
        success: false,
        message: `${resource} bulunamadı`,
        code: "NOT_FOUND",
    };
}

/**
 * Generic error handler
 */
export function handleError(error: unknown): NextResponse {
    console.error("API Error:", error);

    // Zod validation error
    if (error instanceof ZodError) {
        return NextResponse.json(handleZodError(error), { status: 400 });
    }

    // Custom API error
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

    // Standard Error
    if (error instanceof Error) {
        // Check for database errors
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

    // Unknown error
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
 * Wrap API handler with error handling
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

/**
 * Success response helper
 */
export function successResponse<T>(data: T, message?: string): NextResponse {
    return NextResponse.json({
        success: true,
        data,
        ...(message && { message }),
    });
}

/**
 * Error response helper
 */
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
