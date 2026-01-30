/**
 * Validation Middleware
 * Helper functions for validating API inputs with Zod
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

/**
 * Validate request body against a Zod schema
 */
export async function validateBody<T>(
    request: NextRequest,
    schema: ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string; details?: ZodError }> {
    try {
        const body = await request.json();
        const result = schema.safeParse(body);

        if (!result.success) {
            return {
                success: false,
                error: formatZodError(result.error),
                details: result.error,
            };
        }

        return { success: true, data: result.data };
    } catch {
        return {
            success: false,
            error: "Geçersiz JSON formatı",
        };
    }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(
    searchParams: URLSearchParams,
    schema: ZodSchema<T>
): { success: true; data: T } | { success: false; error: string; details?: ZodError } {
    // Convert URLSearchParams to plain object
    const params: Record<string, string | string[]> = {};
    
    for (const [key, value] of searchParams.entries()) {
        const existing = params[key];
        if (existing) {
            if (Array.isArray(existing)) {
                existing.push(value);
            } else {
                params[key] = [existing, value];
            }
        } else {
            params[key] = value;
        }
    }

    const result = schema.safeParse(params);

    if (!result.success) {
        return {
            success: false,
            error: formatZodError(result.error),
            details: result.error,
        };
    }

    return { success: true, data: result.data };
}

/**
 * Format Zod error into a user-friendly string
 */
function formatZodError(error: ZodError): string {
    const issues = error.issues;
    
    if (issues.length === 0) {
        return "Validasyon hatası";
    }

    if (issues.length === 1) {
        return issues[0].message;
    }

    // Multiple errors - join them
    return issues.map((issue, index) => `${index + 1}. ${issue.message}`).join("\n");
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(error: string, details?: ZodError) {
    return NextResponse.json(
        {
            success: false,
            message: error,
            errors: details?.issues.map(issue => ({
                path: issue.path.join("."),
                message: issue.message,
            })),
        },
        { status: 400 }
    );
}

/**
 * Higher-order function to wrap API handlers with validation
 */
export function withValidation<T>(
    schema: ZodSchema<T>,
    handler: (data: T, request: NextRequest) => Promise<NextResponse>
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        const validation = await validateBody(request, schema);

        if (!validation.success) {
            return validationErrorResponse(validation.error, validation.details);
        }

        return handler(validation.data, request);
    };
}

/**
 * Higher-order function for query parameter validation
 */
export function withQueryValidation<T>(
    schema: ZodSchema<T>,
    handler: (data: T, request: NextRequest) => Promise<NextResponse>
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        const { searchParams } = new URL(request.url);
        const validation = validateQuery(searchParams, schema);

        if (!validation.success) {
            return validationErrorResponse(validation.error, validation.details);
        }

        return handler(validation.data, request);
    };
}
