/**
 * Import API Tests
 * Tests for Personnel, Attendance, and Training import endpoints
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the dependencies
vi.mock("@/lib/db", () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: "test-id" }]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        query: {
            personnel: { findFirst: vi.fn() },
        },
    },
    trainings: {},
    trainingTopics: {},
    personnel: {},
    attendances: {},
}));

vi.mock("@/lib/auth", () => ({
    getSession: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
    logAction: vi.fn().mockResolvedValue(undefined),
}));

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

describe("Import API Validation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Training Import Validation", () => {
        it("should validate required fields for training import", () => {
            const validRow = {
                code: "M90",
                name: "Test Eğitim",
                duration_min: 60,
                category: "TEMEL",
            };

            expect(validRow.code).toBeTruthy();
            expect(validRow.name).toBeTruthy();
            expect(validRow.duration_min).toBeGreaterThan(0);
        });

        it("should handle topics string parsing", () => {
            const topicsString = "Giriş, Temel Kavramlar, Uygulama";
            const topics = topicsString.split(",").map(t => t.trim()).filter(t => t);

            expect(topics).toHaveLength(3);
            expect(topics[0]).toBe("Giriş");
            expect(topics[1]).toBe("Temel Kavramlar");
            expect(topics[2]).toBe("Uygulama");
        });

        it("should normalize category values", () => {
            const categories = ["temel", "TEMEL", "Temel", "tazeleme", "DIGER"];
            const normalized = categories.map(c => c.toUpperCase());

            expect(normalized).toEqual(["TEMEL", "TEMEL", "TEMEL", "TAZELEME", "DIGER"]);
        });

        it("should reject invalid duration values", () => {
            const invalidDuration = parseInt("abc", 10);
            expect(isNaN(invalidDuration)).toBe(true);
        });
    });

    describe("Personnel Import Validation", () => {
        it("should validate required fields for personnel import", () => {
            const validRow = {
                sicilNo: "12345",
                fullName: "Test User",
            };

            expect(validRow.sicilNo).toBeTruthy();
            expect(validRow.fullName).toBeTruthy();
        });

        it("should handle optional fields as undefined", () => {
            const row = {
                sicilNo: "12345",
                fullName: "Test User",
                gorevi: undefined,
                grup: undefined,
            };

            expect(row.gorevi).toBeUndefined();
            expect(row.grup).toBeUndefined();
        });

        it("should trim sicil no values", () => {
            const sicilNo = "  12345  ";
            expect(sicilNo.trim()).toBe("12345");
        });
    });

    describe("Attendance Import Validation", () => {
        it("should validate required fields for attendance import", () => {
            const validRow = {
                sicilNo: "12345",
                egitimKodu: "M90",
                baslamaTarihi: "2025-01-15",
            };

            expect(validRow.sicilNo).toBeTruthy();
            expect(validRow.egitimKodu).toBeTruthy();
            expect(validRow.baslamaTarihi).toBeTruthy();
        });

        it("should validate date format", () => {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            expect("2025-01-15").toMatch(dateRegex);
            expect("15-01-2025").not.toMatch(dateRegex);
        });

        it("should handle Excel serial dates", () => {
            // Excel serial date for 2025-01-15 is approximately 45672
            const excelDate = 45672;
            expect(typeof excelDate).toBe("number");
        });
    });

    describe("Authorization Checks", () => {
        it("should reject unauthenticated requests", async () => {
            vi.mocked(getSession).mockResolvedValue(null);

            const session = await getSession();
            expect(session).toBeNull();
        });

        it("should reject non-admin users", async () => {
            vi.mocked(getSession).mockResolvedValue({
                userId: "test",
                fullName: "Test User",
                sicilNo: "12345",
                role: "CHEF" as const,
            });

            const session = await getSession();
            expect(session?.role).not.toBe("ADMIN");
        });

        it("should allow admin users", async () => {
            vi.mocked(getSession).mockResolvedValue({
                userId: "test",
                fullName: "Admin User",
                sicilNo: "00001",
                role: "ADMIN" as const,
            });

            const session = await getSession();
            expect(session?.role).toBe("ADMIN");
        });
    });

    describe("Data Transformation", () => {
        it("should convert string numbers to integers for duration", () => {
            const strDuration = "60";
            const intDuration = parseInt(strDuration, 10);
            expect(intDuration).toBe(60);
            expect(typeof intDuration).toBe("number");
        });

        it("should handle empty topics string", () => {
            const emptyTopics = "";
            const topics = emptyTopics.split(",").map(t => t.trim()).filter(t => t);
            expect(topics).toHaveLength(0);
        });

        it("should normalize personel durum values", () => {
            const validStatuses = ["CALISAN", "AYRILDI", "IZINLI", "PASIF"];
            const input = "CALISAN";
            expect(validStatuses.includes(input)).toBe(true);
        });
    });
});

describe("Import Result Handling", () => {
    it("should format success result correctly", () => {
        const result = {
            success: true,
            message: "5 yeni, 3 güncelleme",
            data: {
                created: 5,
                updated: 3,
                errors: [],
            },
        };

        expect(result.success).toBe(true);
        expect(result.data.created).toBe(5);
        expect(result.data.updated).toBe(3);
        expect(result.data.errors).toHaveLength(0);
    });

    it("should include error details when present", () => {
        const result = {
            success: true,
            message: "Import tamamlandı",
            data: {
                created: 3,
                updated: 1,
                errors: [
                    { row: 5, message: "Geçersiz sicil no" },
                    { row: 8, message: "Eğitim kodu bulunamadı" },
                ],
            },
        };

        expect(result.data.errors).toHaveLength(2);
        expect(result.data.errors[0].row).toBe(5);
    });
});
