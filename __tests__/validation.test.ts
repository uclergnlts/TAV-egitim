/**
 * Validation Schema Tests
 */

import { describe, it, expect } from "vitest";
import {
    loginSchema,
    createPersonnelSchema,
    createTrainingSchema,
    createAttendanceSchema,
    tcKimlikNoSchema,
    sicilNoSchema,
    personnelQuerySchema,
} from "@/lib/validation";

describe("Validation Schemas", () => {
    describe("sicilNoSchema", () => {
        it("should validate valid sicil numbers", () => {
            const result = sicilNoSchema.safeParse("ADMIN001");
            expect(result.success).toBe(true);
        });

        it("should reject sicil numbers with lowercase letters", () => {
            const result = sicilNoSchema.safeParse("admin001");
            expect(result.success).toBe(false);
        });

        it("should reject sicil numbers with special characters", () => {
            const result = sicilNoSchema.safeParse("ADMIN-001");
            expect(result.success).toBe(false);
        });

        it("should reject too short sicil numbers", () => {
            const result = sicilNoSchema.safeParse("AB");
            expect(result.success).toBe(false);
        });
    });

    describe("tcKimlikNoSchema", () => {
        it("should validate valid TC Kimlik numbers", () => {
            const result = tcKimlikNoSchema.safeParse("12345678901");
            expect(result.success).toBe(true);
        });

        it("should reject TC Kimlik numbers with letters", () => {
            const result = tcKimlikNoSchema.safeParse("1234567890A");
            expect(result.success).toBe(false);
        });

        it("should reject TC Kimlik numbers with wrong length", () => {
            const result = tcKimlikNoSchema.safeParse("1234567890");
            expect(result.success).toBe(false);
        });
    });

    describe("loginSchema", () => {
        it("should validate valid login data", () => {
            const result = loginSchema.safeParse({
                sicil_no: "ADMIN001",
                password: "password123",
            });
            expect(result.success).toBe(true);
        });

        it("should reject short passwords", () => {
            const result = loginSchema.safeParse({
                sicil_no: "ADMIN001",
                password: "123",
            });
            expect(result.success).toBe(false);
        });

        it("should reject missing fields", () => {
            const result = loginSchema.safeParse({
                sicil_no: "ADMIN001",
            });
            expect(result.success).toBe(false);
        });
    });

    describe("createPersonnelSchema", () => {
        it("should validate valid personnel data", () => {
            const result = createPersonnelSchema.safeParse({
                sicilNo: "PER001",
                fullName: "John Doe",
                tcKimlikNo: "12345678901",
                gorevi: "Security",
                projeAdi: "TAV ESB",
                grup: "Team A",
            });
            expect(result.success).toBe(true);
        });

        it("should reject invalid TC Kimlik", () => {
            const result = createPersonnelSchema.safeParse({
                sicilNo: "PER001",
                fullName: "John Doe",
                tcKimlikNo: "12345",
                gorevi: "Security",
                projeAdi: "TAV ESB",
                grup: "Team A",
            });
            expect(result.success).toBe(false);
        });

        it("should accept optional fields", () => {
            const result = createPersonnelSchema.safeParse({
                sicilNo: "PER001",
                fullName: "John Doe",
                tcKimlikNo: "12345678901",
                gorevi: "Security",
                projeAdi: "TAV ESB",
                grup: "Team A",
                cinsiyet: "ERKEK",
                telefon: "+90 555 123 4567",
            });
            expect(result.success).toBe(true);
        });
    });

    describe("createTrainingSchema", () => {
        it("should validate valid training data", () => {
            const result = createTrainingSchema.safeParse({
                code: "TRN001",
                name: "Safety Training",
                duration_min: 120,
                category: "TEMEL",
            });
            expect(result.success).toBe(true);
        });

        it("should reject too long duration", () => {
            const result = createTrainingSchema.safeParse({
                code: "TRN001",
                name: "Safety Training",
                duration_min: 2000, // More than 24 hours
                category: "TEMEL",
            });
            expect(result.success).toBe(false);
        });

        it("should accept valid categories", () => {
            const validCategories = ["TEMEL", "TAZELEME", "DIGER"];
            
            for (const category of validCategories) {
                const result = createTrainingSchema.safeParse({
                    code: "TRN001",
                    name: "Training",
                    duration_min: 60,
                    category,
                });
                expect(result.success).toBe(true);
            }
        });
    });

    describe("createAttendanceSchema", () => {
        it("should validate valid attendance data", () => {
            const result = createAttendanceSchema.safeParse({
                sicil_nos: ["PER001", "PER002"],
                training_id: "550e8400-e29b-41d4-a716-446655440000",
                trainer_id: "550e8400-e29b-41d4-a716-446655440001",
                ic_dis_egitim: "IC",
                egitim_yeri: "Conference Room",
                baslama_tarihi: "2024-01-15",
                bitis_tarihi: "2024-01-15",
                baslama_saati: "09:00",
                bitis_saati: "12:00",
                sonuc_belgesi_turu: "EGITIM_KATILIM_CIZELGESI",
            });
            expect(result.success).toBe(true);
        });

        it("should reject end date before start date", () => {
            const result = createAttendanceSchema.safeParse({
                sicil_nos: ["PER001"],
                training_id: "550e8400-e29b-41d4-a716-446655440000",
                trainer_id: "550e8400-e29b-41d4-a716-446655440001",
                ic_dis_egitim: "IC",
                egitim_yeri: "Conference Room",
                baslama_tarihi: "2024-01-15",
                bitis_tarihi: "2024-01-14", // Before start date
                baslama_saati: "09:00",
                bitis_saati: "12:00",
                sonuc_belgesi_turu: "EGITIM_KATILIM_CIZELGESI",
            });
            expect(result.success).toBe(false);
        });

        it("should reject empty sicil_nos array", () => {
            const result = createAttendanceSchema.safeParse({
                sicil_nos: [],
                training_id: "550e8400-e29b-41d4-a716-446655440000",
                trainer_id: "550e8400-e29b-41d4-a716-446655440001",
                ic_dis_egitim: "IC",
                egitim_yeri: "Conference Room",
                baslama_tarihi: "2024-01-15",
                bitis_tarihi: "2024-01-15",
                baslama_saati: "09:00",
                bitis_saati: "12:00",
                sonuc_belgesi_turu: "EGITIM_KATILIM_CIZELGESI",
            });
            expect(result.success).toBe(false);
        });
    });

    describe("personnelQuerySchema", () => {
        it("should validate with default values", () => {
            const result = personnelQuerySchema.safeParse({});
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.page).toBe(1);
                expect(result.data.limit).toBe(50);
                expect(result.data.sortBy).toBe("fullName");
                expect(result.data.sortOrder).toBe("asc");
            }
        });

        it("should coerce string numbers to actual numbers", () => {
            const result = personnelQuerySchema.safeParse({
                page: "2",
                limit: "25",
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.page).toBe(2);
                expect(result.data.limit).toBe(25);
            }
        });

        it("should reject invalid sortBy values", () => {
            const result = personnelQuerySchema.safeParse({
                sortBy: "invalidField",
            });
            expect(result.success).toBe(false);
        });
    });
});
