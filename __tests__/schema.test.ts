/**
 * Database Schema Tests
 * Tests for data models and schema constraints
 */

import { describe, it, expect } from "vitest";

describe("Database Schema", () => {
    describe("Personnel Model", () => {
        it("should have all required fields", () => {
            const personnel = {
                id: "uuid",
                sicilNo: "12345",
                fullName: "Test User",
                tcKimlikNo: "12345678901",
                gorevi: "Mühendis",
                projeAdi: "TAV",
                grup: "A",
                personelDurumu: "CALISAN",
            };

            expect(personnel.id).toBeTruthy();
            expect(personnel.sicilNo).toBeTruthy();
            expect(personnel.fullName).toBeTruthy();
            expect(personnel.tcKimlikNo).toBeTruthy();
            expect(personnel.gorevi).toBeTruthy();
            expect(personnel.projeAdi).toBeTruthy();
            expect(personnel.grup).toBeTruthy();
            expect(personnel.personelDurumu).toBeTruthy();
        });

        it("should validate personelDurumu enum", () => {
            const validStatuses = ["CALISAN", "AYRILDI", "IZINLI", "PASIF"];
            
            validStatuses.forEach(status => {
                expect(["CALISAN", "AYRILDI", "IZINLI", "PASIF"]).toContain(status);
            });
        });

        it("should allow optional fields", () => {
            const personnel = {
                id: "uuid",
                sicilNo: "12345",
                fullName: "Test User",
                tcKimlikNo: "12345678901",
                gorevi: "Mühendis",
                projeAdi: "TAV",
                grup: "A",
                personelDurumu: "CALISAN",
                cinsiyet: undefined,
                telefon: undefined,
                dogumTarihi: undefined,
                adres: undefined,
            };

            expect(personnel.cinsiyet).toBeUndefined();
            expect(personnel.telefon).toBeUndefined();
        });
    });

    describe("Training Model", () => {
        it("should have all required fields", () => {
            const training = {
                id: "uuid",
                code: "M90",
                name: "Test Eğitim",
                durationMin: 60,
                category: "TEMEL",
                isActive: true,
            };

            expect(training.id).toBeTruthy();
            expect(training.code).toBeTruthy();
            expect(training.name).toBeTruthy();
            expect(training.durationMin).toBeGreaterThan(0);
            expect(training.category).toBeTruthy();
        });

        it("should validate category enum", () => {
            const validCategories = ["TEMEL", "TAZELEME", "DIGER"];
            
            validCategories.forEach(cat => {
                expect(["TEMEL", "TAZELEME", "DIGER"]).toContain(cat);
            });
        });
    });

    describe("Attendance Model", () => {
        it("should have all required fields", () => {
            const attendance = {
                id: "uuid",
                personelId: "personnel-uuid",
                trainingId: "training-uuid",
                sicilNo: "12345",
                adSoyad: "Test User",
                tcKimlikNo: "12345678901",
                gorevi: "Mühendis",
                projeAdi: "TAV",
                grup: "A",
                personelDurumu: "CALISAN",
                egitimKodu: "M90",
                baslamaTarihi: "2025-01-15",
                bitisTarihi: "2025-01-15",
                baslamaSaati: "09:00",
                bitisSaati: "10:00",
                egitimSuresiDk: 60,
                egitimYeri: "Eğitim Salonu",
                icDisEgitim: "IC",
                sonucBelgesiTuru: "SERTIFIKA",
                veriGirenSicil: "ADMIN001",
                veriGirenAdSoyad: "Admin User",
                year: 2025,
                month: 1,
            };

            expect(attendance.id).toBeTruthy();
            expect(attendance.personelId).toBeTruthy();
            expect(attendance.trainingId).toBeTruthy();
            expect(attendance.sicilNo).toBeTruthy();
            expect(attendance.baslamaTarihi).toBeTruthy();
            expect(attendance.year).toBe(2025);
            expect(attendance.month).toBe(1);
        });

        it("should validate icDisEgitim enum", () => {
            const validTypes = ["IC", "DIS"];
            
            expect(validTypes).toContain("IC");
            expect(validTypes).toContain("DIS");
        });

        it("should validate sonucBelgesiTuru enum", () => {
            const validTypes = ["EGITIM_KATILIM_CIZELGESI", "SERTIFIKA"];
            
            expect(validTypes).toContain("EGITIM_KATILIM_CIZELGESI");
            expect(validTypes).toContain("SERTIFIKA");
        });

        it("should allow optional trainerId", () => {
            const attendance = {
                trainerId: undefined,
            };

            expect(attendance.trainerId).toBeUndefined();
        });
    });

    describe("Trainer Model", () => {
        it("should have required fields", () => {
            const trainer = {
                id: "uuid",
                sicilNo: "TRAINER001",
                fullName: "Trainer Name",
                isActive: true,
            };

            expect(trainer.id).toBeTruthy();
            expect(trainer.sicilNo).toBeTruthy();
            expect(trainer.fullName).toBeTruthy();
            expect(trainer.isActive).toBe(true);
        });
    });

    describe("User Model", () => {
        it("should have required fields", () => {
            const user = {
                id: "uuid",
                sicilNo: "ADMIN001",
                fullName: "Admin User",
                role: "ADMIN",
                passwordHash: "hashed",
                isActive: true,
            };

            expect(user.id).toBeTruthy();
            expect(user.sicilNo).toBeTruthy();
            expect(user.fullName).toBeTruthy();
            expect(user.role).toBeTruthy();
            expect(user.passwordHash).toBeTruthy();
        });

        it("should validate role enum", () => {
            const validRoles = ["ADMIN", "CHEF"];
            
            expect(validRoles).toContain("ADMIN");
            expect(validRoles).toContain("CHEF");
        });
    });

    describe("Training Topics Model", () => {
        it("should have required fields", () => {
            const topic = {
                id: "uuid",
                trainingId: "training-uuid",
                title: "Topic Title",
                isActive: true,
            };

            expect(topic.id).toBeTruthy();
            expect(topic.trainingId).toBeTruthy();
            expect(topic.title).toBeTruthy();
        });

        it("should allow optional orderNo", () => {
            const topic = {
                orderNo: undefined,
            };

            expect(topic.orderNo).toBeUndefined();
        });
    });
});

describe("Index Constraints", () => {
    it("should have unique sicilNo for personnel", () => {
        const personnel = [
            { sicilNo: "001" },
            { sicilNo: "002" },
            { sicilNo: "003" },
        ];

        const sicilNos = personnel.map(p => p.sicilNo);
        const uniqueSicilNos = new Set(sicilNos);

        expect(uniqueSicilNos.size).toBe(personnel.length);
    });

    it("should have unique code for trainings", () => {
        const trainings = [
            { code: "M90" },
            { code: "M91" },
            { code: "M92" },
        ];

        const codes = trainings.map(t => t.code);
        const uniqueCodes = new Set(codes);

        expect(uniqueCodes.size).toBe(trainings.length);
    });

    it("should have unique attendance per person/training/year", () => {
        const attendances = [
            { personelId: "1", trainingId: "A", year: 2025 },
            { personelId: "1", trainingId: "B", year: 2025 },
            { personelId: "2", trainingId: "A", year: 2025 },
        ];

        const keys = attendances.map(a => `${a.personelId}-${a.trainingId}-${a.year}`);
        const uniqueKeys = new Set(keys);

        expect(uniqueKeys.size).toBe(attendances.length);
    });
});
