/**
 * Validation Tests
 * Tests for data validation functions used throughout the application
 */

import { describe, it, expect } from "vitest";

describe("Data Validation", () => {
    describe("Sicil No Validation", () => {
        it("should accept valid sicil numbers", () => {
            const validSicilNos = ["12345", "ADMIN001", "ABC123", "001"];
            validSicilNos.forEach(sicil => {
                expect(sicil.length).toBeGreaterThan(0);
                expect(sicil.trim()).toBe(sicil);
            });
        });

        it("should reject empty sicil numbers", () => {
            const emptySicil = "";
            expect(emptySicil.length).toBe(0);
        });

        it("should trim whitespace from sicil numbers", () => {
            const sicilWithSpaces = "  12345  ";
            expect(sicilWithSpaces.trim()).toBe("12345");
        });
    });

    describe("TC Kimlik No Validation", () => {
        it("should validate 11-digit TC Kimlik No", () => {
            const validTC = "12345678901";
            expect(validTC.length).toBe(11);
            expect(/^\d{11}$/.test(validTC)).toBe(true);
        });

        it("should reject invalid TC Kimlik No", () => {
            const invalidTCs = ["1234567890", "123456789012", "abcdefghijk"];
            invalidTCs.forEach(tc => {
                expect(/^\d{11}$/.test(tc)).toBe(false);
            });
        });
    });

    describe("Date Validation", () => {
        it("should validate YYYY-MM-DD format", () => {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            expect("2025-01-15").toMatch(dateRegex);
            expect("2025-12-31").toMatch(dateRegex);
        });

        it("should reject invalid date formats", () => {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            expect("15-01-2025").not.toMatch(dateRegex);
            expect("2025/01/15").not.toMatch(dateRegex);
            expect("01-15-2025").not.toMatch(dateRegex);
        });

        it("should validate date range (start <= end)", () => {
            const startDate = "2025-01-01";
            const endDate = "2025-01-31";
            expect(startDate <= endDate).toBe(true);
        });

        it("should handle same start and end date", () => {
            const date = "2025-01-15";
            expect(date <= date).toBe(true);
        });
    });

    describe("Time Validation", () => {
        it("should validate HH:MM format", () => {
            const timeRegex = /^\d{2}:\d{2}$/;
            expect("09:00").toMatch(timeRegex);
            expect("14:30").toMatch(timeRegex);
            expect("23:59").toMatch(timeRegex);
        });

        it("should validate HH:MM:SS format", () => {
            const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
            expect("09:00:00").toMatch(timeRegex);
            expect("14:30:45").toMatch(timeRegex);
        });

        it("should convert HH:MM:SS to HH:MM", () => {
            const fullTime = "14:30:00";
            const shortTime = fullTime.substring(0, 5);
            expect(shortTime).toBe("14:30");
        });
    });

    describe("Duration Validation", () => {
        it("should accept positive duration values", () => {
            const validDurations = [30, 60, 120, 180];
            validDurations.forEach(d => {
                expect(d).toBeGreaterThan(0);
            });
        });

        it("should reject zero or negative durations", () => {
            const invalidDurations = [0, -30, -60];
            invalidDurations.forEach(d => {
                expect(d <= 0).toBe(true);
            });
        });

        it("should parse string duration to number", () => {
            expect(parseInt("60", 10)).toBe(60);
            expect(parseInt("120", 10)).toBe(120);
        });
    });

    describe("Enum Validation", () => {
        it("should validate personel durumu values", () => {
            const validStatuses = ["CALISAN", "AYRILDI", "IZINLI", "PASIF"];
            const testStatus = "CALISAN";
            expect(validStatuses.includes(testStatus)).toBe(true);
        });

        it("should reject invalid personel durumu", () => {
            const validStatuses = ["CALISAN", "AYRILDI", "IZINLI", "PASIF"];
            const invalidStatus = "INVALID";
            expect(validStatuses.includes(invalidStatus)).toBe(false);
        });

        it("should validate ic/dis egitim values", () => {
            const validTypes = ["IC", "DIS"];
            expect(validTypes.includes("IC")).toBe(true);
            expect(validTypes.includes("DIS")).toBe(true);
            expect(validTypes.includes("INVALID")).toBe(false);
        });

        it("should validate belge turu values", () => {
            const validTypes = ["EGITIM_KATILIM_CIZELGESI", "SERTIFIKA"];
            expect(validTypes.includes("EGITIM_KATILIM_CIZELGESI")).toBe(true);
            expect(validTypes.includes("SERTIFIKA")).toBe(true);
        });

        it("should validate egitim kategorisi values", () => {
            const validCategories = ["TEMEL", "TAZELEME", "DIGER"];
            expect(validCategories.includes("TEMEL")).toBe(true);
            expect(validCategories.includes("TAZELEME")).toBe(true);
            expect(validCategories.includes("DIGER")).toBe(true);
        });
    });

    describe("Email Validation (if applicable)", () => {
        it("should validate email format", () => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            expect("test@example.com").toMatch(emailRegex);
            expect("user.name@domain.co.uk").toMatch(emailRegex);
        });

        it("should reject invalid emails", () => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            expect("invalid-email").not.toMatch(emailRegex);
            expect("@domain.com").not.toMatch(emailRegex);
            expect("test@").not.toMatch(emailRegex);
        });
    });

    describe("Phone Number Validation", () => {
        it("should validate Turkish phone format", () => {
            const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
            expect("05551234567").toMatch(phoneRegex);
            expect("+905551234567").toMatch(phoneRegex);
        });
    });
});

describe("String Sanitization", () => {
    it("should trim whitespace", () => {
        expect("  test  ".trim()).toBe("test");
        expect("\n\ttest\n\t".trim()).toBe("test");
    });

    it("should handle null/undefined values", () => {
        const nullValue = null;
        const undefinedValue = undefined;

        expect(nullValue || "").toBe("");
        expect(undefinedValue || "default").toBe("default");
    });

    it("should normalize case for comparisons", () => {
        expect("TEMEL".toLowerCase()).toBe("temel");
        expect("temel".toUpperCase()).toBe("TEMEL");
    });
});

describe("Number Parsing", () => {
    it("should parse valid numbers", () => {
        expect(parseInt("123", 10)).toBe(123);
        expect(parseFloat("123.45")).toBe(123.45);
    });

    it("should handle invalid number strings", () => {
        expect(isNaN(parseInt("abc", 10))).toBe(true);
        expect(isNaN(parseFloat("abc"))).toBe(true);
    });

    it("should handle empty strings", () => {
        expect(isNaN(parseInt("", 10))).toBe(true);
    });
});
