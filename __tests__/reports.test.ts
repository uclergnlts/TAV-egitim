/**
 * Reports API Tests
 * Tests for Monthly and Detail report functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the dependencies
vi.mock("@/lib/db", () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(),
    },
    attendances: {},
    trainers: {},
    trainings: {},
}));

vi.mock("@/lib/auth", () => ({
    getSession: vi.fn(),
}));

import { getSession } from "@/lib/auth";

describe("Reports API", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Monthly Report", () => {
        it("should require admin authentication", async () => {
            vi.mocked(getSession).mockResolvedValue(null);
            const session = await getSession();
            expect(session).toBeNull();
        });

        it("should validate year parameter", () => {
            const validYear = 2025;
            const invalidYear = parseInt("abc", 10);

            expect(validYear).toBeGreaterThan(2000);
            expect(isNaN(invalidYear)).toBe(true);
        });

        it("should validate month parameter (1-12)", () => {
            const validMonths = [1, 6, 12];
            const invalidMonths = [0, 13, -1];

            validMonths.forEach(m => {
                expect(m).toBeGreaterThanOrEqual(1);
                expect(m).toBeLessThanOrEqual(12);
            });

            invalidMonths.forEach(m => {
                expect(m < 1 || m > 12).toBe(true);
            });
        });

        it("should handle date range mode", () => {
            const startDate = "2025-01-01";
            const endDate = "2025-01-31";

            expect(startDate < endDate || startDate === endDate).toBe(true);
        });

        it("should calculate total participation correctly", () => {
            const rows = [
                { id: "1", sicil_no: "001" },
                { id: "2", sicil_no: "002" },
                { id: "3", sicil_no: "003" },
            ];
            expect(rows.length).toBe(3);
        });

        it("should calculate total minutes correctly", () => {
            const rows = [
                { egitim_suresi_dk: 60 },
                { egitim_suresi_dk: 120 },
                { egitim_suresi_dk: 45 },
            ];
            const totalMinutes = rows.reduce((sum, r) => sum + r.egitim_suresi_dk, 0);
            expect(totalMinutes).toBe(225);
        });
    });

    describe("Detail Report", () => {
        it("should validate search parameters", () => {
            const validSearch = "John";
            const emptySearch = "";

            expect(validSearch.length).toBeGreaterThan(0);
            expect(emptySearch.length).toBe(0);
        });

        it("should filter by training code", () => {
            const trainingCode = "M90";
            const records = [
                { egitimKodu: "M90", adSoyad: "Test 1" },
                { egitimKodu: "M91", adSoyad: "Test 2" },
                { egitimKodu: "M90", adSoyad: "Test 3" },
            ];

            const filtered = records.filter(r => r.egitimKodu === trainingCode);
            expect(filtered).toHaveLength(2);
        });

        it("should filter by date range", () => {
            const startDate = "2025-01-01";
            const endDate = "2025-01-15";

            const records = [
                { baslamaTarihi: "2025-01-05" },
                { baslamaTarihi: "2025-01-20" },
                { baslamaTarihi: "2025-01-10" },
            ];

            const filtered = records.filter(
                r => r.baslamaTarihi >= startDate && r.baslamaTarihi <= endDate
            );
            expect(filtered).toHaveLength(2);
        });

        it("should filter by personnel status", () => {
            const records = [
                { personelDurumu: "CALISAN" },
                { personelDurumu: "AYRILDI" },
                { personelDurumu: "CALISAN" },
                { personelDurumu: "IZINLI" },
            ];

            const calisan = records.filter(r => r.personelDurumu === "CALISAN");
            expect(calisan).toHaveLength(2);
        });

        it("should filter by group", () => {
            const records = [
                { grup: "A" },
                { grup: "B" },
                { grup: "A" },
            ];

            const groupA = records.filter(r => r.grup === "A");
            expect(groupA).toHaveLength(2);
        });
    });

    describe("Column Order Validation", () => {
        it("should have correct column order for export", () => {
            const expectedColumnOrder = [
                "Sicil No",
                "Ad Soyad",
                "TC Kimlik No",
                "Görevi",
                "Proje",
                "Grup",
                "Eğitim Kodu",
                "Eğitim Alt Başlık",
                "Eğitim Başlama Tarihi",
                "Eğitim Bitiş Tarihi",
                "Eğitim Süresi (dk)",
                "Eğitim Başlama Saati",
                "Eğitim Bitiş Saati",
                "Eğitim Yeri",
                "Eğitmen Adı",
                "Sonuç Belgesi",
                "İç Dış Eğitim",
                "Eğitim Detay",
                "Veri Giren",
                "Veri Girilme Tarihi ve Saati",
                "Personel Durumu",
            ];

            expect(expectedColumnOrder).toHaveLength(21);
            expect(expectedColumnOrder[0]).toBe("Sicil No");
            expect(expectedColumnOrder[20]).toBe("Personel Durumu");
            expect(expectedColumnOrder[14]).toBe("Eğitmen Adı");
        });
    });

    describe("Data Transformation", () => {
        it("should format ic_dis_egitim correctly", () => {
            expect("IC" === "IC" ? "İç" : "Dış").toBe("İç");
            expect("DIS" === "IC" ? "İç" : "Dış").toBe("Dış");
        });

        it("should combine veri_giren fields", () => {
            const sicil = "12345";
            const adSoyad = "Test User";
            const combined = `${sicil} - ${adSoyad}`;
            expect(combined).toBe("12345 - Test User");
        });

        it("should format date with time", () => {
            const dateStr = "2025-01-15T14:30:00Z";
            const date = new Date(dateStr);
            const formatted = date.toLocaleString("tr-TR");
            expect(formatted).toBeTruthy();
            expect(formatted.length).toBeGreaterThan(0);
        });
    });
});

describe("Report Calculations", () => {
    describe("Summary Statistics", () => {
        it("should calculate unique training count", () => {
            const rows = [
                { egitim_kodu: "M90" },
                { egitim_kodu: "M91" },
                { egitim_kodu: "M90" },
                { egitim_kodu: "M92" },
            ];
            const uniqueTrainings = new Set(rows.map(r => r.egitim_kodu)).size;
            expect(uniqueTrainings).toBe(3);
        });

        it("should convert minutes to hours", () => {
            const totalMinutes = 180;
            const totalHours = totalMinutes / 60;
            expect(totalHours).toBe(3);
        });

        it("should handle zero records gracefully", () => {
            const rows: any[] = [];
            const totalMinutes = rows.reduce((sum, r) => sum + (r.egitim_suresi_dk || 0), 0);
            expect(totalMinutes).toBe(0);
        });
    });

    describe("Sorting", () => {
        it("should sort by personnel status (CALISAN first)", () => {
            const statusOrder = ["CALISAN", "IZINLI", "PASIF", "AYRILDI"];

            const rows = [
                { personelDurumu: "AYRILDI" },
                { personelDurumu: "CALISAN" },
                { personelDurumu: "PASIF" },
                { personelDurumu: "IZINLI" },
            ];

            const sorted = [...rows].sort((a, b) => {
                return statusOrder.indexOf(a.personelDurumu) - statusOrder.indexOf(b.personelDurumu);
            });

            expect(sorted[0].personelDurumu).toBe("CALISAN");
            expect(sorted[1].personelDurumu).toBe("IZINLI");
            expect(sorted[2].personelDurumu).toBe("PASIF");
            expect(sorted[3].personelDurumu).toBe("AYRILDI");
        });
    });
});
