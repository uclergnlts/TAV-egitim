/**
 * Error Handler Tests
 */

import { describe, it, expect, vi } from "vitest";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
    ApiError,
    handleError,
    handleZodError,
    handleDatabaseError,
    handleNotFoundError,
    handleForbiddenError,
    successResponse,
    errorResponse,
    withErrorHandler,
} from "@/lib/errorHandler";

describe("Error Handler", () => {
    describe("ApiError", () => {
        it("should create ApiError with default status code", () => {
            const error = new ApiError("Test error");
            expect(error.message).toBe("Test error");
            expect(error.statusCode).toBe(500);
            expect(error.name).toBe("ApiError");
        });

        it("should create ApiError with custom status code", () => {
            const error = new ApiError("Not found", 404, "NOT_FOUND");
            expect(error.statusCode).toBe(404);
            expect(error.code).toBe("NOT_FOUND");
        });

        it("should create ApiError with validation errors", () => {
            const errors = [{ path: "email", message: "Invalid email" }];
            const error = new ApiError("Validation failed", 400, "VALIDATION_ERROR", errors);
            expect(error.errors).toEqual(errors);
        });
    });

    describe("handleZodError", () => {
        it("should format ZodError correctly", () => {
            const schema = z.object({
                name: z.string().min(1),
                age: z.number().positive(),
            });

            try {
                schema.parse({ name: "", age: -1 });
            } catch (error) {
                if (error instanceof ZodError) {
                    const result = handleZodError(error);
                    expect(result.success).toBe(false);
                    expect(result.code).toBe("VALIDATION_ERROR");
                    expect(result.errors).toBeDefined();
                    expect(result.errors?.length).toBeGreaterThan(0);
                }
            }
        });
    });

    describe("handleDatabaseError", () => {
        it("should handle unique constraint error", () => {
            const error = new Error("UNIQUE constraint failed: users.email");
            const result = handleDatabaseError(error);
            expect(result.success).toBe(false);
            expect(result.code).toBe("DUPLICATE_ERROR");
            expect(result.message).toContain("email");
        });

        it("should handle foreign key constraint error", () => {
            const error = new Error("FOREIGN KEY constraint failed");
            const result = handleDatabaseError(error);
            expect(result.success).toBe(false);
            expect(result.code).toBe("FOREIGN_KEY_ERROR");
        });

        it("should handle generic database error", () => {
            const error = new Error("Some database error");
            const result = handleDatabaseError(error);
            expect(result.success).toBe(false);
            expect(result.code).toBe("DATABASE_ERROR");
        });
    });

    describe("handleNotFoundError", () => {
        it("should return not found error with custom resource", () => {
            const result = handleNotFoundError("Personnel");
            expect(result.success).toBe(false);
            expect(result.code).toBe("NOT_FOUND");
            expect(result.message).toBe("Personnel bulunamadı");
        });

        it("should return not found error with default resource", () => {
            const result = handleNotFoundError();
            expect(result.message).toBe("Kayıt bulunamadı");
        });
    });

    describe("handleForbiddenError", () => {
        it("should return forbidden error", () => {
            const result = handleForbiddenError();
            expect(result.success).toBe(false);
            expect(result.code).toBe("FORBIDDEN");
            expect(result.message).toBe("Bu işlem için yetkiniz yok");
        });
    });

    describe("handleError", () => {
        it("should handle ZodError", async () => {
            const schema = z.object({ name: z.string() });
            try {
                schema.parse({});
            } catch (error) {
                const response = handleError(error);
                expect(response).toBeInstanceOf(NextResponse);
                expect(response.status).toBe(400);
            }
        });

        it("should handle ApiError", () => {
            const error = new ApiError("Custom error", 418, "TEAPOT");
            const response = handleError(error);
            expect(response.status).toBe(418);
        });

        it("should handle database constraint error", () => {
            const error = new Error("UNIQUE constraint failed: users.email");
            const response = handleError(error);
            expect(response.status).toBe(409);
        });

        it("should handle generic Error", () => {
            const error = new Error("Generic error");
            const response = handleError(error);
            expect(response.status).toBe(500);
        });

        it("should handle unknown error", () => {
            const response = handleError("string error");
            expect(response.status).toBe(500);
        });
    });

    describe("successResponse", () => {
        it("should create success response with data", () => {
            const data = { id: 1, name: "Test" };
            const response = successResponse(data);
            expect(response).toBeInstanceOf(NextResponse);
        });

        it("should create success response with message", () => {
            const data = { id: 1 };
            const response = successResponse(data, "Created successfully");
            expect(response).toBeInstanceOf(NextResponse);
        });
    });

    describe("errorResponse", () => {
        it("should create error response", () => {
            const response = errorResponse("Something went wrong", 400, "BAD_REQUEST");
            expect(response).toBeInstanceOf(NextResponse);
            expect(response.status).toBe(400);
        });

        it("should create error response with default status", () => {
            const response = errorResponse("Server error");
            expect(response.status).toBe(500);
        });
    });

    describe("withErrorHandler", () => {
        it("should return handler result when no error", async () => {
            const handler = vi.fn().mockResolvedValue(new NextResponse('{"success":true}'));
            const wrapped = withErrorHandler(handler);
            
            const result = await wrapped();
            expect(handler).toHaveBeenCalled();
            expect(result).toBeInstanceOf(NextResponse);
        });

        it("should handle error when handler throws", async () => {
            const handler = vi.fn().mockRejectedValue(new Error("Handler error"));
            const wrapped = withErrorHandler(handler);
            
            const result = await wrapped();
            expect(result.status).toBe(500);
        });
    });
});
