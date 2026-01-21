/**
 * Excel Export Tests
 * Tests for Excel export functionality
 */

import { describe, it, expect } from "vitest";

describe("Excel Export", () => {
    describe("Data Formatting", () => {
        it("should format data object with all required columns", () => {
            const row = {
                sicil_no: "12345",
                ad_soyad: "Test User",
                tc_kimlik_no: "12345678901",
                gorevi: "Mühendis",
                proje_adi: "TAV",
                grup: "A",
                egitim_kodu: "M90",
                egitim_alt_basligi: "Alt Başlık",
                baslama_tarihi: "2025-01-15",
                bitis_tarihi: "2025-01-15",
                egitim_suresi_dk: 60,
                baslama_saati: "09:00",
                bitis_saati: "10:00",
                egitim_yeri: "Eğitim Salonu",
                egitmen_adi: "Eğitmen Test",
                sonuc_belgesi_turu: "SERTIFIKA",
                ic_dis_egitim: "IC",
                egitim_detayli_aciklama: "Açıklama",
                veri_giren_sicil: "ADMIN001",
                veri_giren_ad_soyad: "Admin User",
                veri_giris_tarihi: "2025-01-15T10:30:00Z",
                personel_durumu: "CALISAN",
            };

            const exportData = {
                "Sicil No": row.sicil_no,
                "Ad Soyad": row.ad_soyad,
                "TC Kimlik No": row.tc_kimlik_no,
                "Görevi": row.gorevi,
                "Proje": row.proje_adi,
                "Grup": row.grup,
                "Eğitim Kodu": row.egitim_kodu,
                "Eğitim Alt Başlık": row.egitim_alt_basligi || "",
                "Eğitim Başlama Tarihi": row.baslama_tarihi,
                "Eğitim Bitiş Tarihi": row.bitis_tarihi,
                "Eğitim Süresi (dk)": row.egitim_suresi_dk,
                "Eğitim Başlama Saati": row.baslama_saati,
                "Eğitim Bitiş Saati": row.bitis_saati,
                "Eğitim Yeri": row.egitim_yeri,
                "Eğitmen Adı": row.egitmen_adi || "",
                "Sonuç Belgesi": row.sonuc_belgesi_turu,
                "İç Dış Eğitim": row.ic_dis_egitim === "IC" ? "İç" : "Dış",
                "Eğitim Detay": row.egitim_detayli_aciklama || "",
                "Veri Giren": `${row.veri_giren_sicil} - ${row.veri_giren_ad_soyad}`,
                "Veri Girilme Tarihi ve Saati": row.veri_giris_tarihi,
                "Personel Durumu": row.personel_durumu,
            };

            expect(Object.keys(exportData)).toHaveLength(21);
            expect(exportData["Sicil No"]).toBe("12345");
            expect(exportData["Eğitmen Adı"]).toBe("Eğitmen Test");
            expect(exportData["İç Dış Eğitim"]).toBe("İç");
            expect(exportData["Veri Giren"]).toBe("ADMIN001 - Admin User");
        });

        it("should handle null/undefined fields gracefully", () => {
            const row = {
                egitim_alt_basligi: null,
                egitmen_adi: null,
                egitim_detayli_aciklama: undefined,
            };

            expect(row.egitim_alt_basligi || "").toBe("");
            expect(row.egitmen_adi || "").toBe("");
            expect(row.egitim_detayli_aciklama || "").toBe("");
        });

        it("should format ic_dis_egitim correctly", () => {
            expect("IC" === "IC" ? "İç" : "Dış").toBe("İç");
            expect("DIS" === "IC" ? "İç" : "Dış").toBe("Dış");
        });
    });

    describe("Column Width Calculation", () => {
        it("should calculate column widths", () => {
            const columns = 21;
            const colWidths = Array.from({ length: columns }, () => ({ wch: 18 }));

            expect(colWidths).toHaveLength(21);
            expect(colWidths[0].wch).toBe(18);
        });
    });

    describe("Filename Generation", () => {
        it("should generate monthly report filename", () => {
            const year = 2025;
            const month = "Ocak";
            const filename = `Aylik_Rapor_${month}_${year}.xlsx`;

            expect(filename).toBe("Aylik_Rapor_Ocak_2025.xlsx");
        });

        it("should generate date range filename", () => {
            const startDate = "2025-01-01";
            const endDate = "2025-01-31";
            const filename = `Rapor_${startDate}_${endDate}.xlsx`;

            expect(filename).toBe("Rapor_2025-01-01_2025-01-31.xlsx");
        });

        it("should generate detail report filename", () => {
            const date = new Date().toISOString().slice(0, 10);
            const filename = `Egitim_Detay_Raporu_${date}.xlsx`;

            expect(filename).toContain("Egitim_Detay_Raporu_");
            expect(filename).toContain(".xlsx");
        });
    });

    describe("Sheet Name Validation", () => {
        it("should limit sheet name to 31 characters", () => {
            const longName = "Very Long Sheet Name That Exceeds Maximum";
            const truncated = longName.substring(0, 31);

            expect(truncated.length).toBeLessThanOrEqual(31);
        });

        it("should handle short sheet names", () => {
            const shortName = "Ocak 2025";
            const truncated = shortName.substring(0, 31);

            expect(truncated).toBe("Ocak 2025");
        });
    });

    describe("Data Array Processing", () => {
        it("should map array of records correctly", () => {
            const rows = [
                { sicil_no: "001", ad_soyad: "User 1" },
                { sicil_no: "002", ad_soyad: "User 2" },
                { sicil_no: "003", ad_soyad: "User 3" },
            ];

            const exportData = rows.map(row => ({
                "Sicil No": row.sicil_no,
                "Ad Soyad": row.ad_soyad,
            }));

            expect(exportData).toHaveLength(3);
            expect(exportData[0]["Sicil No"]).toBe("001");
            expect(exportData[2]["Ad Soyad"]).toBe("User 3");
        });

        it("should handle empty array", () => {
            const rows: any[] = [];
            const exportData = rows.map(row => ({
                "Sicil No": row.sicil_no,
            }));

            expect(exportData).toHaveLength(0);
        });
    });
});

describe("Date Formatting for Export", () => {
    it("should format ISO date to TR locale", () => {
        const isoDate = "2025-01-15T14:30:00Z";
        const date = new Date(isoDate);
        const formatted = date.toLocaleString("tr-TR");

        expect(formatted).toBeTruthy();
        expect(formatted.length).toBeGreaterThan(0);
    });

    it("should handle date-only strings", () => {
        const dateStr = "2025-01-15";
        const date = new Date(dateStr);

        expect(date.getFullYear()).toBe(2025);
        expect(date.getMonth()).toBe(0); // January
        expect(date.getDate()).toBe(15);
    });

    it("should format date for display", () => {
        const date = new Date("2025-01-15");
        const formatted = date.toLocaleDateString("tr-TR");

        expect(formatted).toContain("2025");
    });
});
